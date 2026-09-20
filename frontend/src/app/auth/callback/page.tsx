'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setCookie, navigateAfterAuth, sanitizeRedirectPath } from '@/lib/auth-utils';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AuthErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Authentication couldn't be completed.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Auth Callback ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4EF] text-[#14141A] flex items-center justify-center px-4 font-sans">
          <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-[#E5E0D8] text-center shadow-premium">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-500 text-xl font-bold">
                !
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#14141A]">
                Authentication couldn&apos;t be completed
              </h2>
              <p className="text-[#5A5A66] text-sm leading-relaxed">
                {this.state.errorMessage || 'An unexpected issue occurred while verifying your session. Please try signing in again.'}
              </p>
              <div className="mt-6 border-t border-[#E5E0D8] pt-6 text-center">
                <Link
                  href="/login"
                  className="inline-block w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all duration-200 text-center"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState('Verifying your session...');
  const [error, setError] = useState('');
  const handledRef = useRef(false);

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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
    // Guard against React Strict Mode / effect double invocation
    if (handledRef.current) return;
    handledRef.current = true;

    const isPopup = searchParams.get('oauth_popup') === 'true';

    async function finishLogin(tokenVal: string, sbUserFallback?: any) {
      try {
        let user: any = null;

        // 1. Fetch profile from Bavio backend
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
          const res = await fetch(`${apiUrl}/auth/profile`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tokenVal}`,
            },
          });

          if (res.ok) {
            const result = await res.json();
            if (result && result.success && result.id) {
              user = result;
            }
          }
        } catch (fetchErr) {
          console.warn('[OAuth Callback] Backend profile fetch deferred:', (fetchErr as Error).message);
        }

        // 2. Fallback to Supabase User if backend profile was pending
        if (!user) {
          let sbUser = sbUserFallback;
          if (!sbUser) {
            const { data: userData } = await supabase.auth.getUser(tokenVal);
            sbUser = userData?.user;
          }
          if (sbUser) {
            user = {
              id: sbUser.id,
              name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'My Workspace',
              email: sbUser.email,
              plan: 'free',
              plan_name: 'free_trial',
            };
          }
        }

        if (!user) {
          throw new Error("Unable to establish user profile from verified session.");
        }

        // 3. Persist session data safely
        localStorage.setItem('bavio_token', tokenVal);
        localStorage.setItem('bavio_client_id', user.id);
        if (user.name) {
          localStorage.setItem('bavio_name', user.name);
        }
        localStorage.setItem('bavio_user', JSON.stringify(user));

        // 4. Set auth cookies
        setCookie('bavio_auth', 'true');
        setCookie('bavio_onboarding_completed', 'true');
        setStatus('Authentication successful!');

        if (isPopup) {
          const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://www.bavio.in' : window.location.origin;
          if (window.opener) {
            window.opener.postMessage({ type: 'BAVIO_AUTH_SUCCESS' }, targetOrigin);
          }
          setStatus('Authentication successful! Closing window...');
          setTimeout(() => {
            window.close();
          }, 800);
          return;
        }

        const rawRedirect = localStorage.getItem('bavio_auth_redirect');
        localStorage.removeItem('bavio_auth_redirect');
        const destination = sanitizeRedirectPath(rawRedirect, '/workspace');
        navigateAfterAuth(destination);
      } catch (err: any) {
        console.error('[OAuth Callback] Session completion error:', err.message);
        setError(err.message || "Authentication couldn't be completed.");
        setStatus('');

        if (isPopup) {
          const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://www.bavio.in' : window.location.origin;
          if (window.opener) {
            window.opener.postMessage({ type: 'BAVIO_AUTH_ERROR' }, targetOrigin);
          }
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      }
    }

    async function handleAuth() {
      try {
        // A. Check for OAuth error parameters in query string
        const queryError = searchParams.get('error');
        const queryErrorDesc = searchParams.get('error_description');
        if (queryError) {
          throw new Error(queryErrorDesc || queryError || 'Authentication was denied or canceled.');
        }

        // B. Check for hash parameters (implicit flow or hash-based errors)
        let hashParams: URLSearchParams | null = null;
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.length > 1) {
          try {
            hashParams = new URLSearchParams(window.location.hash.substring(1));
          } catch {
            hashParams = null;
          }
        }

        if (hashParams) {
          const hashError = hashParams.get('error');
          const hashErrorDesc = hashParams.get('error_description');
          if (hashError) {
            throw new Error(hashErrorDesc || hashError || 'Authentication was denied or canceled.');
          }
        }

        // C. PKCE Flow: exchange code for session
        const code = searchParams.get('code');
        const type = searchParams.get('type') || hashParams?.get('type');
        if (code) {
          setStatus('Exchanging verification code...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('[OAuth Callback] Code exchange error:', exchangeError.message);
            // Check if a valid session already exists in client
            const { data: existingSession } = await supabase.auth.getSession();
            if (existingSession?.session?.access_token) {
              await finishLogin(existingSession.session.access_token, existingSession.session.user);
              return;
            }
            throw new Error('This verification link is no longer valid or has expired. Please sign in again.');
          }

          if (data?.session?.access_token) {
            if (type === 'recovery') {
              router.push('/reset-password');
              return;
            }
            await finishLogin(data.session.access_token, data.session.user);
            return;
          }
        }

        // D. Hash flow (access_token in hash fragment)
        if (hashParams) {
          const hashAccessToken = hashParams.get('access_token');
          const hashRefreshToken = hashParams.get('refresh_token');
          if (hashAccessToken) {
            setStatus('Restoring session...');
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken || '',
            });
            if (!setSessionError && data?.session?.access_token) {
              if (type === 'recovery') {
                router.push('/reset-password');
                return;
              }
              await finishLogin(data.session.access_token, data.session.user);
              return;
            }
          }
        }

        // E. Existing Supabase Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && session?.access_token) {
          await finishLogin(session.access_token, session.user);
          return;
        }

        // F. Token query parameter fallback (magic link / email OTP)
        const token = searchParams.get('token');
        if (token) {
          await finishLogin(token);
          return;
        }

        throw new Error("No authentication credentials found. Please return to Sign In.");
      } catch (err: any) {
        console.error('[OAuth Callback] Authentication error:', err.message);
        let errorMsg = err.message || "Authentication couldn't be completed.";
        if (
          errorMsg.toLowerCase().includes('expired') ||
          errorMsg.toLowerCase().includes('invalid') ||
          errorMsg.toLowerCase().includes('code') ||
          errorMsg.toLowerCase().includes('verifier')
        ) {
          errorMsg = 'This verification link is no longer valid or has expired. Please return to Sign In and try again.';
        }
        setError(errorMsg);
        setStatus('');

        if (isPopup) {
          const targetOrigin = window.location.origin.includes('bavio.in') ? 'https://www.bavio.in' : window.location.origin;
          if (window.opener) {
            window.opener.postMessage({ type: 'BAVIO_AUTH_ERROR' }, targetOrigin);
          }
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      }
    }

    handleAuth();
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

        {status && !error && (
          <div>
            <h2 className="text-xl font-bold mb-2 tracking-tight text-[#14141A]">{status}</h2>
            <p className="text-[#5A5A66] text-sm">Please hold on while we set up your session.</p>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#14141A]">
              Authentication couldn&apos;t be completed
            </h2>
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
                Return to Sign In
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
    <AuthErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <AuthCallback />
      </Suspense>
    </AuthErrorBoundary>
  );
}
