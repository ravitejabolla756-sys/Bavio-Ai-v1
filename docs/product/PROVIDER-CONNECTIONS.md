# Provider Connections

Provider connections are environment- and account-dependent. Code paths include Twilio telephony, Deepgram and Sarvam speech recognition, ElevenLabs/Sarvam/OpenAI text-to-speech, Cerebras/Groq/OpenAI/Sarvam language models, Supabase infrastructure, Resend email, and Dodo billing events.

Some providers are optional or fallback paths. A provider name in code is not proof that the customer account is connected or that the provider is active in a deployment. Credentials must remain server-side environment configuration.
