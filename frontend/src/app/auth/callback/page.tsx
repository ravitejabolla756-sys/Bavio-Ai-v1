'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCookie } from '@/lib/auth-utils';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your login...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfileAndLogin(tokenVal: string) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${apiUrl}/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenVal}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve business profile information.');
        }

        const result = await res.json();
        if (result.success && result.id) {
          const user = result;
          localStorage.setItem('bavio_token', tokenVal);
          localStorage.setItem('bavio_client_id', user.id);
          if (user.name) {
            localStorage.setItem('bavio_name', user.name);
          }
          localStorage.setItem('bavio_user', JSON.stringify(user));
          
          // Set auth cookies
          setCookie("bavio_auth", "true");

          const isOnboardingComplete = user.phone && !user.phone.startsWith('google_oauth_fallback');
          
          if (isOnboardingComplete) {
            setCookie("bavio_onboarding_completed", "true");
            setStatus('Authentication successful! Redirecting...');
            const redirectUrl = localStorage.getItem("bavio_auth_redirect");
            if (redirectUrl) {
              localStorage.removeItem("bavio_auth_redirect");
              router.push(redirectUrl);
            } else {
              router.push('/workspace');
            }
          } else {
            setCookie("bavio_onboarding_completed", "false");
            setStatus('Welcome! Redirecting to Onboarding...');
            router.push('/onboarding');
          }
        } else {
          throw new Error(result.error || 'Invalid response from profile server.');
        }
      } catch (err: any) {
        console.error('[OAuth Callback] Profile fetch error:', err.message);
        setError(err.message || 'Error occurred while establishing session.');
        setStatus('');
        setTimeout(() => router.push('/login?error=oauth_failed'), 2000);
      }
    }

    async function handleSession() {
      try {
        const { supabase } = await import('@/lib/supabase');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        // ─── POPUP MODE: send result back to opener and close ───
        if (window.opener && !window.opener.closed) {
          if (session?.user) {
            const user = session.user;
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              user: {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                accessToken: session.access_token,
              }
            }, window.location.origin);
          } else {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_CANCELLED' }, window.location.origin);
          }
          window.close();
          return;
        }

        // ─── NORMAL MODE: redirect as usual ───
        if (session) {
          await fetchProfileAndLogin(session.access_token);
          return;
        }

        const token = searchParams.get('token');
        if (token) {
          await fetchProfileAndLogin(token);
        } else {
          throw new Error('No authentication session or token found in URL.');
        }
      } catch (err: any) {
        // If in popup, send error back and close
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: err.message }, window.location.origin);
          setTimeout(() => window.close(), 1500);
          return;
        }
        console.error('[OAuth Callback] Session error:', err.message);
        setError(err.message || 'Error occurred while establishing session.');
        setStatus('');
        setTimeout(() => router.push('/login?error=oauth_failed'), 2000);
      }
    }

    handleSession();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#14141A] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-[#E5E0D8] text-center shadow-premium">
        <div className="mb-6 flex justify-center">
          {error ? (
            <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-500 text-xl font-bold">
              !
            </div>
          ) : (
            <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        
        {status && (
          <div>
            <h2 className="text-xl font-bold mb-2 tracking-tight text-[#14141A]">{status}</h2>
            <p className="text-[#5A5A66] text-sm">Please hold on while we set up your session.</p>
          </div>
        )}

        {error && (
          <div>
            <h2 className="text-xl font-bold mb-2 tracking-tight text-red-500">Authentication Failed</h2>
            <p className="text-[#5A5A66] text-sm mb-4">{error}</p>
            <p className="text-[#8A8A96] text-xs">Redirecting back to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}
