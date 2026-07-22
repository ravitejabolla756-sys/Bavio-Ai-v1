'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TOPUPS = [
  {
    id: 'topup_100',
    name: '100-Minute Top-Up',
    price: 25,
    minutes: 100,
    perMinute: 0.25,
    tag: null,
    description: 'Prepaid connected call minutes',
    features: [
      'Added instantly after payment confirmed',
      'Used after your monthly allowance',
      'Carry over indefinitely — no expiry',
      'Requires an active subscription',
    ],
  },
  {
    id: 'topup_250',
    name: '250-Minute Top-Up',
    price: 55,
    minutes: 250,
    perMinute: 0.22,
    tag: 'Best Value',
    description: 'Prepaid connected call minutes',
    features: [
      'Added instantly after payment confirmed',
      'Used after your monthly allowance',
      'Carry over indefinitely — no expiry',
      'Requires an active subscription',
    ],
  },
];

export default function TopupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuyTopup(topupId: string) {
    setLoading(topupId);
    setError(null);

    try {
      const res = await fetch('/api/billing/create-topup-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError('This top-up is being prepared for launch. Please check back soon.');
        } else if (res.status === 403) {
          setError('An active Bavio subscription is required to purchase top-up minutes.');
        } else {
          setError(data.message || 'Failed to create checkout. Please try again.');
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/billing"
            className="text-sm text-[#7a6e5f] hover:text-[#FF6B00] transition-colors font-sans mb-4 inline-flex items-center gap-1"
          >
            ← Back to Billing
          </Link>
          <h1 className="text-3xl font-bold text-[#140A02] font-serif mt-2">
            Prepaid Minute Top-Ups
          </h1>
          <p className="text-sm text-[#7a6e5f] mt-2 font-sans leading-relaxed">
            Top-up minutes are used after your monthly allowance is consumed. They carry over indefinitely and never expire.
          </p>
        </div>

        {/* Notice */}
        <div className="bg-[#FFF8F0] border border-[#FFD9B3] rounded-xl p-4 mb-8 text-sm text-[#7a5030] font-sans flex gap-3">
          <span className="text-lg shrink-0">ℹ️</span>
          <div>
            <strong className="text-[#140A02]">Active subscription required.</strong>
            {' '}Top-up minutes can only be purchased while you have an active Bavio subscription. Minutes are added to your account immediately after payment is confirmed by our payment system.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 font-sans">
            {error}
          </div>
        )}

        {/* Top-up cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {TOPUPS.map((topup) => (
            <div
              key={topup.id}
              className={`bg-white rounded-2xl p-7 border-2 flex flex-col relative transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,107,0,0.10)] ${
                topup.tag ? 'border-[#FF6B00]' : 'border-[#E8E0D5]'
              }`}
            >
              {topup.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                  {topup.tag}
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] mb-1">{topup.description}</p>
                <h2 className="text-xl font-bold text-[#140A02] font-serif">{topup.name}</h2>
              </div>

              <div className="mb-5">
                <span className="text-4xl font-bold text-[#FF6B00] font-serif">${topup.price}</span>
                <span className="text-sm text-[#7a6e5f] ml-1">one-time</span>
              </div>

              <div className="bg-[#F7F4EF] rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
                <span className="text-sm font-bold text-[#140A02] font-sans">{topup.minutes} minutes</span>
                <span className="text-xs text-[#7a6e5f]">${topup.perMinute.toFixed(2)}/min</span>
              </div>

              <ul className="space-y-2 mb-6 flex-grow">
                {topup.features.map((f, i) => (
                  <li key={i} className="text-xs text-[#7a6e5f] flex items-start gap-2 font-sans">
                    <span className="text-[#10B981] font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuyTopup(topup.id)}
                disabled={loading === topup.id}
                className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                  topup.tag
                    ? 'bg-[#FF6B00] hover:bg-[#E55A00] text-white'
                    : 'bg-[#140A02] hover:bg-[#2a1a0a] text-white'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading === topup.id ? 'Redirecting to checkout…' : `Buy ${topup.minutes} Minutes — $${topup.price}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white border border-[#E8E0D5] rounded-2xl p-6 text-sm font-sans">
          <h3 className="font-bold text-[#140A02] mb-4 font-serif text-base">Top-Up FAQ</h3>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-[#140A02] mb-1">When are minutes added to my account?</dt>
              <dd className="text-[#7a6e5f]">Minutes are added automatically when your payment is confirmed by our payment system. This typically happens within seconds of completing checkout.</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#140A02] mb-1">Do top-up minutes expire?</dt>
              <dd className="text-[#7a6e5f]">No. Prepaid top-up minutes never expire and carry over each month until used.</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#140A02] mb-1">In what order are minutes consumed?</dt>
              <dd className="text-[#7a6e5f]">Your monthly included minutes are always consumed first. Top-up minutes are only used after your monthly allowance is fully consumed.</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#140A02] mb-1">What happens if I cancel my subscription?</dt>
              <dd className="text-[#7a6e5f]">Your AI call handling will pause at the end of your billing period. Top-up minutes can only be used with an active subscription.</dd>
            </div>
          </dl>
        </div>

      </div>
    </div>
  );
}
