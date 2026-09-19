# Bavio Infrastructure Overview

The audited repository uses a Node/Express backend, a Next.js frontend, PostgreSQL through `pg`, Supabase client integrations, Supabase Storage paths, WebSockets for voice streaming, and provider-specific telephony/AI/email/billing integrations.

Observed providers include Twilio, Deepgram, ElevenLabs, Cerebras, Groq, OpenAI, Sarvam, Resend, Dodo, and Supabase. Provider activation depends on environment configuration and voice-stack routing. The repository does not establish a single hosting region, availability commitment, topology, disaster-recovery region, or production network diagram.

Do not publish credentials, service-role keys, internal hostnames, callback secrets, or exploit-sensitive route details. Hosting region and infrastructure ownership remain `[PRIMARY_HOSTING_REGION]` / `[INFRASTRUCTURE_OPERATOR]`.
