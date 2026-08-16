'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCookie, navigateAfterAuth } from '@/lib/auth-utils';


function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState('Verifying your session...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bavio_signup_email');
      if (stored) setEmail(stored);
    }
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setResendError('Please enter your email address.');
      return;
    }
    setIsResending(true);
    setResendStatus('');
    setResendError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setResendStatus('Verification email sent.');
      } else {
        throw new Error(result.error || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const isPopup = searchParams.get('oauth_popup') === 'true';

    async function fetchProfileAndLogin(tokenVal: string) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${apiUrl}/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenVal}`
          }
        });

        let user: any = null;
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.id) {
            user = result;
          }
        }

        // Fallback to Supabase User if profile endpoint was slow or pending row creation
        if (!user) {
          const { data: userData } = await supabase.auth.getUser(tokenVal);
          if (userData && userData.user) {
            const sbUser = userData.user;
            user = {
              id: sbUser.id,
              name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'My Workspace',
              email: sbUser.email,
              plan: 'free',
              plan_name: 'free_trial'
            };
          }
        }

        if (user) {
          localStorage.setItem('bavio_token', tokenVal);
          localStorage.setItem('bavio_client_id', user.id);
          if (user.name) {
            localStorage.setItem('bavio_name', user.name);
          }
          localStorage.setItem('bavio_user', JSON.stringify(user));
          
          // Set auth cookies
          setCookie("bavio_auth", "true");
          setCookie("bavio_onboarding_completed", "true");
          setStatus('Authentication successful!');

          if (isPopup) {
            const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://bavio.in' : window.location.origin;
            if (window.opener) {
              window.opener.postMessage({ type: "BAVIO_AUTH_SUCCESS" }, targetOrigin);
            }
            setStatus('Authentication successful! Closing window...');
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          }

          const redirectUrl = localStorage.getItem("bavio_auth_redirect");
          if (redirectUrl) {
            localStorage.removeItem("bavio_auth_redirect");
            navigateAfterAuth(redirectUrl);
          } else {
            navigateAfterAuth('/workspace');
          }
        } else {
          throw new Error('Unable to resolve user session.');
        }
      } catch (err: any) {
        console.error('[OAuth Callback] Profile fetch error:', err.message);
        setError(err.message || 'Error occurred while establishing session.');
        setStatus('');

        if (isPopup) {
          const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://bavio.in' : window.location.origin;
          if (window.opener) {
            window.opener.postMessage({ type: "BAVIO_AUTH_ERROR" }, targetOrigin);
          }
          setTimeout(() => {
            window.close();
          }, 1500);
          return;
        }
      }
    }

    async function handleSession() {
      try {
        const { supabase } = await import('@/lib/supabase');
        
        // 1. Explicitly check for code query parameter first and exchange it
        const code = searchParams.get('code');
        const type = searchParams.get('type');
        if (code) {
          setStatus('Exchanging verification code...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (data && data.session) {
            if (type === 'recovery') {
              router.push('/reset-password');
              return;
            }
            await fetchProfileAndLogin(data.session.access_token);
            return;
          }
        }

        // 2. Check if a session already exists (implicit flow / hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session) {
          await fetchProfileAndLogin(session.access_token);
          return;
        }

        // 3. Fallback to token query param
        const token = searchParams.get('token');
        if (token) {
          await fetchProfileAndLogin(token);
        } else {
          throw new Error('No authentication session or token found in URL.');
        }
      } catch (err: any) {
        console.error('[OAuth Callback] Session error:', err.message);
        let errorMsg = err.message || 'Error occurred while establishing session.';
        if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('code')) {
          errorMsg = 'This verification link is no longer valid or has expired. Please request a new verification email.';
        }
        setError(errorMsg);
        setStatus('');

        if (isPopup) {
          const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://bavio.in' : window.location.origin;
          if (window.opener) {
            window.opener.postMessage({ type: "BAVIO_AUTH_ERROR" }, targetOrigin);
          }
          setTimeout(() => {
            window.close();
          }, 1500);
          return;
        }
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
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-red-500">Verification Link Issue</h2>
            <p className="text-[#5A5A66] text-sm leading-relaxed">{error}</p>
            
            <form onSubmit={handleResend} className="mt-6 border-t border-[#E5E0D8] pt-6 flex flex-col gap-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-[#14141A] mb-1.5 pl-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isResending}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
                />
              </div>

              {resendStatus && (
                <p className="text-[#10B981] text-[11px] font-semibold pl-1">
                  {resendStatus}
                </p>
              )}
              {resendError && (
                <p className="text-state-error text-[11px] font-semibold pl-1">
                  {resendError}
                </p>
              )}

              <button
                type="submit"
                disabled={isResending}
                className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-400 text-white text-body-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all duration-200"
              >
                {isResending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-block text-xs font-semibold text-[#FF6B00] hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
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
