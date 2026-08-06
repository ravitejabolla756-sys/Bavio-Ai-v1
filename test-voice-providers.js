'use strict';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_key';

/**
 * test-voice-providers.js
 *
 * Self-contained unit tests for the Bavio voice abstraction layer.
 * Run with: node test-voice-providers.js
 *
 * Tests:
 *   1.  Config validation — accepts valid provider values
 *   2.  Config validation — rejects unknown provider
 *   3.  Config validation — rejects invalid rollout percent
 *   4.  Config validation — rejects mismatched LLM backend
 *   5.  Config validation — fails fast when modular_v1 enabled without keys
 *   6.  Config validation — passes when modular_v1 enabled with all keys
 *   7.  Interface contracts — all abstract methods throw on base class
 *   8.  Router — returns current_openai by default (no env set)
 *   9.  Router — returns modular_v1 when global toggle set
 *   10. Router — returns modular_v1 for allowlisted business
 *   11. Router — returns current_openai for non-allowlisted business
 *   12. Router — deterministic rollout bucket (same ID = same bucket)
 *   13. Router — rollout 100% routes all calls to modular_v1
 *   14. Router — rollout 0% never routes to modular_v1
 *   15. Router — getStackSummary never exposes api keys
 *   16. CurrentOpenAIStt — implements SpeechToTextProvider interface
 *   17. CurrentOpenAILlm — implements LanguageModelProvider interface
 *   18. CurrentOpenAITts — implements TextToSpeechProvider interface
 *   19. CurrentTwilioTelephony — implements TelephonyProvider interface
 *   20. DefaultVoiceCatalog — returns OpenAI voices without EL key
 */

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertThrows(fn, msgFragment) {
  let threw = false;
  try { fn(); } catch (err) {
    threw = true;
    if (msgFragment && !err.message.includes(msgFragment)) {
      throw new Error(`Expected error containing "${msgFragment}" but got: "${err.message}"`);
    }
  }
  if (!threw) throw new Error(`Expected function to throw but it did not`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function withEnv(vars, fn) {
  const { _resetConfigForTesting } = require('./voice/config/voiceConfig');
  const saved = {};
  // Save and set
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined || v === null) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  _resetConfigForTesting();
  try {
    fn();
  } finally {
    // Restore
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    _resetConfigForTesting();
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n── Bavio Voice Provider Tests ────────────────────────────────────────────\n');
console.log('  Block 1: Configuration Validation\n');

test('1. accepts VOICE_STACK_PROVIDER=current_openai (default)', () => {
  withEnv({ VOICE_STACK_PROVIDER: 'current_openai' }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    const cfg = getVoiceConfig();
    assert(cfg.provider === 'current_openai', 'expected current_openai');
  });
});

test('2. rejects unknown VOICE_STACK_PROVIDER value', () => {
  withEnv({ VOICE_STACK_PROVIDER: 'some_unknown_v99' }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    assertThrows(() => getVoiceConfig(), 'Invalid VOICE_STACK_PROVIDER');
  });
});

test('3. rejects VOICE_STACK_ROLLOUT_PERCENT=150', () => {
  withEnv({ VOICE_STACK_ROLLOUT_PERCENT: '150', VOICE_STACK_PROVIDER: 'current_openai' }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    assertThrows(() => getVoiceConfig(), 'VOICE_STACK_ROLLOUT_PERCENT');
  });
});

test('4. rejects invalid VOICE_PRIMARY_LLM value', () => {
  withEnv({ VOICE_PRIMARY_LLM: 'bard', VOICE_STACK_PROVIDER: 'current_openai' }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    assertThrows(() => getVoiceConfig(), 'Invalid VOICE_PRIMARY_LLM');
  });
});

test('5. fails fast: modular_v1 enabled but CEREBRAS_API_KEY missing', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'modular_v1',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
    DEEPGRAM_API_KEY             : 'dg_key',
    ELEVENLABS_API_KEY           : 'el_key',
    CEREBRAS_API_KEY             : undefined,
    GROQ_API_KEY                 : 'gr_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    assertThrows(() => getVoiceConfig(), 'CEREBRAS_API_KEY');
  });
});

test('6. passes when modular_v1 enabled with all required keys', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'modular_v1',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
    DEEPGRAM_API_KEY             : 'dg_test_key',
    ELEVENLABS_API_KEY           : 'el_test_key',
    CEREBRAS_API_KEY             : 'cb_test_key',
    GROQ_API_KEY                 : 'gr_test_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { getVoiceConfig } = require('./voice/config/voiceConfig');
    const cfg = getVoiceConfig();
    assert(cfg.provider === 'modular_v1', 'expected modular_v1');
    assert(cfg.deepgram.hasKey, 'deepgram key should be set');
    assert(cfg.elevenlabs.hasKey, 'elevenlabs key should be set');
  });
});

console.log('\n  Block 2: Interface Contracts\n');

test('7a. SpeechToTextProvider abstract — cannot instantiate base class', () => {
  const SpeechToTextProvider = require('./voice/providers/interfaces/SpeechToTextProvider');
  assertThrows(() => new SpeechToTextProvider('test'), 'abstract');
});

test('7b. LanguageModelProvider abstract — cannot instantiate base class', () => {
  const LanguageModelProvider = require('./voice/providers/interfaces/LanguageModelProvider');
  assertThrows(() => new LanguageModelProvider('test'), 'abstract');
});

test('7c. TextToSpeechProvider abstract — cannot instantiate base class', () => {
  const TextToSpeechProvider = require('./voice/providers/interfaces/TextToSpeechProvider');
  assertThrows(() => new TextToSpeechProvider('test'), 'abstract');
});

test('7d. TelephonyProvider abstract — cannot instantiate base class', () => {
  const TelephonyProvider = require('./voice/providers/interfaces/TelephonyProvider');
  assertThrows(() => new TelephonyProvider('test'), 'abstract');
});

test('7e. TurnDetectionProvider abstract — cannot instantiate base class', () => {
  const TurnDetectionProvider = require('./voice/providers/interfaces/TurnDetectionProvider');
  assertThrows(() => new TurnDetectionProvider('test'), 'abstract');
});

test('7f. VoiceWorkerSession abstract — cannot instantiate base class', () => {
  const VoiceWorkerSession = require('./voice/providers/interfaces/VoiceWorkerSession');
  assertThrows(() => new VoiceWorkerSession('test'), 'abstract');
});

test('7g. VoiceCatalogProvider abstract — cannot instantiate base class', () => {
  const VoiceCatalogProvider = require('./voice/providers/interfaces/VoiceCatalogProvider');
  assertThrows(() => new VoiceCatalogProvider('test'), 'abstract');
});

console.log('\n  Block 3: Voice Stack Router\n');

test('8. router returns current_openai by default (no env set)', () => {
  withEnv({
    VOICE_STACK_PROVIDER: 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT: '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const stack = selectVoiceStack('some-biz-id');
    assert(stack === 'current_openai', `expected current_openai, got ${stack}`);
  });
});

test('9. router returns modular_v1 when global toggle is set', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'modular_v1',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
    DEEPGRAM_API_KEY             : 'dg_key',
    ELEVENLABS_API_KEY           : 'el_key',
    CEREBRAS_API_KEY             : 'cb_key',
    GROQ_API_KEY                 : 'gr_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const stack = selectVoiceStack('any-biz-id');
    assert(stack === 'modular_v1', `expected modular_v1, got ${stack}`);
  });
});

test('10. router returns modular_v1 for allowlisted business', () => {
  const bizId = 'aaaa-1111-2222-3333-bbbb';
  withEnv({
    VOICE_STACK_PROVIDER         : 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: bizId,
    DEEPGRAM_API_KEY             : 'dg_key',
    ELEVENLABS_API_KEY           : 'el_key',
    CEREBRAS_API_KEY             : 'cb_key',
    GROQ_API_KEY                 : 'gr_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const stack = selectVoiceStack(bizId);
    assert(stack === 'modular_v1', `expected modular_v1 for allowlisted ID, got ${stack}`);
  });
});

test('11. router returns current_openai for non-allowlisted business', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: 'some-other-biz-id',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const stack = selectVoiceStack('definitely-not-allowlisted-id');
    assert(stack === 'current_openai', `expected current_openai, got ${stack}`);
  });
});

test('12. rollout bucket is deterministic for same business ID', () => {
  // Access the internal hash function via two separate calls
  withEnv({
    VOICE_STACK_PROVIDER         : 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT  : '50',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
    DEEPGRAM_API_KEY             : 'dg_key',
    ELEVENLABS_API_KEY           : 'el_key',
    CEREBRAS_API_KEY             : 'cb_key',
    GROQ_API_KEY                 : 'gr_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const bizId = 'test-biz-uuid-determinism-check-12345';
    const r1 = selectVoiceStack(bizId);
    const r2 = selectVoiceStack(bizId);
    assert(r1 === r2, `Expected deterministic result but got ${r1} vs ${r2}`);
  });
});

test('13. rollout 100% routes all calls to modular_v1', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT  : '100',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
    DEEPGRAM_API_KEY             : 'dg_key',
    ELEVENLABS_API_KEY           : 'el_key',
    CEREBRAS_API_KEY             : 'cb_key',
    GROQ_API_KEY                 : 'gr_key',
    VOICE_PRIMARY_LLM            : 'cerebras',
    VOICE_FALLBACK_LLM           : 'groq',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    // Test several different IDs
    const ids = ['biz-a', 'biz-b', 'biz-c', 'biz-d', 'biz-xyz-123'];
    for (const id of ids) {
      const s = selectVoiceStack(id);
      assert(s === 'modular_v1', `Expected modular_v1 at 100% rollout for ${id}, got ${s}`);
    }
  });
});

test('14. rollout 0% never routes to modular_v1', () => {
  withEnv({
    VOICE_STACK_PROVIDER         : 'current_openai',
    VOICE_STACK_ROLLOUT_PERCENT  : '0',
    VOICE_STACK_ALLOWED_BUSINESS_IDS: '',
  }, () => {
    const { selectVoiceStack } = require('./voice/routing/voiceStackRouter');
    const ids = Array.from({ length: 20 }, (_, i) => `biz-${i}`);
    for (const id of ids) {
      const s = selectVoiceStack(id);
      assert(s === 'current_openai', `Expected current_openai at 0% rollout for ${id}, got ${s}`);
    }
  });
});

test('15. getStackSummary never exposes API key values', () => {
  withEnv({
    VOICE_STACK_PROVIDER: 'current_openai',
    DEEPGRAM_API_KEY    : 'super-secret-key-value',
  }, () => {
    const { getStackSummary } = require('./voice/routing/voiceStackRouter');
    const summary = JSON.stringify(getStackSummary());
    assert(
      !summary.includes('super-secret-key-value'),
      'API key value should NOT appear in stack summary'
    );
  });
});

console.log('\n  Block 4: Provider Interface Implementations\n');

test('16. CurrentOpenAIStt implements SpeechToTextProvider interface', () => {
  const CurrentOpenAIStt      = require('./voice/providers/current/CurrentOpenAIStt');
  const SpeechToTextProvider  = require('./voice/providers/interfaces/SpeechToTextProvider');
  const inst = new CurrentOpenAIStt();
  assert(inst instanceof SpeechToTextProvider, 'Should be instance of SpeechToTextProvider');
  assert(typeof inst.connect          === 'function', 'connect missing');
  assert(typeof inst.sendAudio        === 'function', 'sendAudio missing');
  assert(typeof inst.close            === 'function', 'close missing');
  assert(typeof inst.onPartialTranscript === 'function', 'onPartialTranscript missing');
  assert(typeof inst.onFinalTranscript   === 'function', 'onFinalTranscript missing');
  assert(typeof inst.onSpeechStarted    === 'function', 'onSpeechStarted missing');
  assert(typeof inst.onEagerEndOfTurn   === 'function', 'onEagerEndOfTurn missing');
  assert(typeof inst.onEndOfTurn        === 'function', 'onEndOfTurn missing');
  assert(typeof inst.transcribeBuffer  === 'function', 'transcribeBuffer missing');
});

test('17. CurrentOpenAILlm implements LanguageModelProvider interface', () => {
  const CurrentOpenAILlm      = require('./voice/providers/current/CurrentOpenAILlm');
  const LanguageModelProvider = require('./voice/providers/interfaces/LanguageModelProvider');
  const inst = new CurrentOpenAILlm();
  assert(inst instanceof LanguageModelProvider, 'Should be instance of LanguageModelProvider');
  assert(typeof inst.createSession   === 'function', 'createSession missing');
  assert(typeof inst.streamResponse  === 'function', 'streamResponse missing');
  assert(typeof inst.cancelResponse  === 'function', 'cancelResponse missing');
  assert(typeof inst.callTool        === 'function', 'callTool missing');
  assert(typeof inst.close           === 'function', 'close missing');
});

test('18. CurrentOpenAITts implements TextToSpeechProvider interface', () => {
  const CurrentOpenAITts      = require('./voice/providers/current/CurrentOpenAITts');
  const TextToSpeechProvider  = require('./voice/providers/interfaces/TextToSpeechProvider');
  const inst = new CurrentOpenAITts();
  assert(inst instanceof TextToSpeechProvider, 'Should be instance of TextToSpeechProvider');
  assert(typeof inst.connect     === 'function', 'connect missing');
  assert(typeof inst.streamText  === 'function', 'streamText missing');
  assert(typeof inst.flush       === 'function', 'flush missing');
  assert(typeof inst.cancel      === 'function', 'cancel missing');
  assert(typeof inst.close       === 'function', 'close missing');
  assert(typeof inst.onAudioChunk === 'function', 'onAudioChunk missing');
  assert(typeof inst.onComplete  === 'function', 'onComplete missing');
  assert(typeof inst.synthesize  === 'function', 'synthesize missing');
});

test('19. CurrentTwilioTelephony implements TelephonyProvider interface', () => {
  const CurrentTwilioTelephony = require('./voice/providers/current/CurrentTwilioTelephony');
  const TelephonyProvider      = require('./voice/providers/interfaces/TelephonyProvider');
  const inst = new CurrentTwilioTelephony();
  assert(inst instanceof TelephonyProvider, 'Should be instance of TelephonyProvider');
  assert(typeof inst.startMediaSession === 'function', 'startMediaSession missing');
  assert(typeof inst.sendAudio         === 'function', 'sendAudio missing');
  assert(typeof inst.clearAudio        === 'function', 'clearAudio missing');
  assert(typeof inst.terminateCall     === 'function', 'terminateCall missing');
  assert(typeof inst.close             === 'function', 'close missing');
  assert(typeof inst.onAudioChunk      === 'function', 'onAudioChunk missing');
  assert(typeof inst.onCallEnd         === 'function', 'onCallEnd missing');
});

test('20. DefaultVoiceCatalog returns OpenAI voices without ElevenLabs key', async () => {
  const DefaultVoiceCatalog = require('./voice/catalog/DefaultVoiceCatalog');
  const catalog = new DefaultVoiceCatalog();  // No EL key
  const voices  = await catalog.listVoices();
  assert(voices.length >= 6, `Expected at least 6 OpenAI voices, got ${voices.length}`);
  assert(voices.every(v => v.provider === 'openai'), 'All voices should be openai without EL key');
  const def = await catalog.getDefaultVoice();
  assert(def.voiceId === 'alloy', 'Default voice should be alloy');
});

test('21. updateAssistantVoice revalidates voice catalog before saving', async () => {
  const assistantController = require('./controllers/assistantController');
  
  // Set up mock request and response
  const req = {
    params: { id: 'ast_123' },
    user: { id: 'biz_123' },
    body: { voiceId: 'EXAVITQu4vr4xnSDxMaL' }
  };
  
  let statusSent = 0;
  let jsonSent = null;
  const res = {
    status: (code) => {
      statusSent = code;
      return { json: (data) => { jsonSent = data; } };
    }
  };

  const db = require('./database/db');
  const originalQuery = db.query;

  try {
    // 1. Mock voice not found (fails revalidation)
    db.query = async (sql) => {
      if (sql.includes('voices')) {
        return { rows: [] };
      }
      return { rows: [] };
    };

    await assistantController.updateAssistantVoice(req, res);
    assert(statusSent === 400, `Expected 400, got ${statusSent}`);
    assert(jsonSent.error === 'invalid_voice', 'Expected invalid_voice error');

    // 2. Mock voice found (succeeds revalidation)
    db.query = async (sql, params) => {
      if (sql.includes('voices')) {
        return { rows: [{ voice_id: 'EXAVITQu4vr4xnSDxMaL', voice_display_name: 'Sarah' }] };
      }
      if (sql.includes('assistants')) {
        return { rows: [{ id: 'ast_123', voice_id: 'EXAVITQu4vr4xnSDxMaL', updated_at: '2026-08-02' }] };
      }
      return { rows: [] };
    };

    await assistantController.updateAssistantVoice(req, res);
    assert(statusSent === 200, `Expected 200, got ${statusSent}`);
    assert(jsonSent.success === true, 'Expected success: true');
    assert(jsonSent.voice_id === 'EXAVITQu4vr4xnSDxMaL');
    assert(jsonSent.voice_display_name === 'Sarah');

  } finally {
    db.query = originalQuery;
  }
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n──────────────────────────────────────────────────────────────────────────');
console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('  All tests passed ✅\n');
}
