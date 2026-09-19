import { redirect } from 'next/navigation';

/**
 * Legacy voice-pipeline route.
 * Provider connections are now managed internally by Bavio.
 * Redirect safely to the Phone Numbers surface.
 */
export default function VoicePipelineRedirectPage() {
  redirect('/dashboard/phone-numbers');
}
