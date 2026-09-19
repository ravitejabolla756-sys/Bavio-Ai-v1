# Bavio Data Flow

```text
Caller
  -> Twilio/telephony provider (configured path)
  -> Bavio voice runtime and WebSocket/session handling
  -> STT provider (Deepgram, Sarvam, or configured path)
  -> LLM provider (Cerebras, Groq, OpenAI, or configured path)
  -> TTS provider (ElevenLabs, Sarvam, OpenAI, or configured path)
  -> Call/Conversation and transcript persistence
  -> optional structured understanding
  -> Bavio Lead
  -> verified ActionExecution / ExecutionEvidence
  -> ordered WorkflowExecution
  -> configured signed webhook
```

The exact path depends on voice-stack and environment configuration. Not every call records audio, not every call creates a Lead, and not every Conversation triggers a Workflow. Stage 9’s canonical `conversation.completed` event is a persistence boundary; it does not automatically invoke a Workflow.
