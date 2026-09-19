# Bavio Subprocessors Draft

**STATUS: Draft for legal review**  
**Last reviewed:** 2026-09-14

The following names are supported by repository code or configuration paths. “Configured” does not prove that every provider is active in every deployment.

| Provider | Role observed | Data categories | Location | Status |
|---|---|---|---|---|
| Supabase | PostgreSQL, Auth client, Storage | account, Workspace, Conversations, transcripts, recordings/TTS where used, execution data | `[PRIMARY_HOSTING_REGION]` | Active platform dependency; exact region requires confirmation |
| Twilio | telephony, Phone Numbers, callbacks | phone numbers, call IDs, call status, audio/media path where configured | Provider-specific; confirm contract | Active telephony path |
| Deepgram | STT path | caller audio/transcription stream | Provider-specific; confirm contract | Configurable voice path |
| ElevenLabs | TTS path | Agent text and voice configuration | Provider-specific; confirm contract | Configurable voice path |
| Cerebras | LLM path | prompts, Knowledge context, conversation context | Provider-specific; confirm contract | Configurable primary path |
| Groq | LLM fallback path | prompts and conversation context | Provider-specific; confirm contract | Configurable fallback path |
| OpenAI | LLM/STT/TTS paths | prompts, audio/text, generated output | Provider-specific; confirm contract | Current and configurable code paths |
| Sarvam | Indic STT/LLM/TTS paths | audio/text and generated output | Provider-specific; confirm contract | Optional/configurable path |
| Resend | email delivery | email address, message metadata/content | Provider-specific; confirm contract | Configured email path |
| Dodo | billing/payment webhook path | subscription/payment references and billing state | Provider-specific; confirm contract | Billing path in controller |

AWS, Stripe, Razorpay, HubSpot, Capsule, Mailchimp, Discord, Zendesk, Help Scout, and Google Sheets are not listed as active subprocessors from this audit. Some appear in UI copy or retired/optional code paths; they require separate activation evidence before inclusion.

## Legal review required

Confirm active provider contracts, legal names, processing locations, transfer mechanisms, privacy/security links, notice period, and customer notification process.
