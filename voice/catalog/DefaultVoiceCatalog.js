'use strict';

/**
 * DefaultVoiceCatalog — VoiceCatalogProvider for OpenAI and ElevenLabs voices
 *
 * Returns the list of available TTS voices for the assistant configuration UI.
 * For ElevenLabs, fetches the live voice list from the API.
 * For OpenAI, returns the static list (OpenAI does not have a list endpoint).
 */

const axios                  = require('axios');
const VoiceCatalogProvider   = require('../providers/interfaces/VoiceCatalogProvider');

// ── Static OpenAI voices ──────────────────────────────────────────────────────
const OPENAI_VOICES = [
  { voiceId: 'alloy',   name: 'Alloy',   provider: 'openai', gender: 'neutral', language: 'en-US', isDefault: true },
  { voiceId: 'echo',    name: 'Echo',    provider: 'openai', gender: 'male',    language: 'en-US' },
  { voiceId: 'fable',   name: 'Fable',   provider: 'openai', gender: 'neutral', language: 'en-US' },
  { voiceId: 'onyx',    name: 'Onyx',    provider: 'openai', gender: 'male',    language: 'en-US' },
  { voiceId: 'nova',    name: 'Nova',    provider: 'openai', gender: 'female',  language: 'en-US' },
  { voiceId: 'shimmer', name: 'Shimmer', provider: 'openai', gender: 'female',  language: 'en-US' },
];

class DefaultVoiceCatalog extends VoiceCatalogProvider {
  /**
   * @param {object} [opts]
   * @param {string} [opts.elevenLabsApiKey]  ElevenLabs key for live voice listing
   */
  constructor({ elevenLabsApiKey = null } = {}) {
    super('DefaultVoiceCatalog');
    this._elevenLabsApiKey = elevenLabsApiKey;
    this._elCache          = null;   // Simple in-memory cache for ElevenLabs list
    this._elCachedAt       = 0;
  }

  // ── VoiceCatalogProvider implementation ───────────────────────────────────

  async listVoices({ language = null, gender = null, provider = null } = {}) {
    const all = [
      ...OPENAI_VOICES,
      ...(await this._listElevenLabsVoices()),
    ];

    return all.filter(v => {
      if (provider && v.provider !== provider)   return false;
      if (language  && v.language && !v.language.startsWith(language.split('-')[0])) return false;
      if (gender    && v.gender   && v.gender !== gender) return false;
      return true;
    });
  }

  async getVoice(voiceId) {
    const all = await this.listVoices();
    return all.find(v => v.voiceId === voiceId) || null;
  }

  async getDefaultVoice(language = 'en-US') {
    const openAiDefault = OPENAI_VOICES.find(v => v.isDefault);
    if (!this._elevenLabsApiKey) return openAiDefault;

    const elVoices = await this._listElevenLabsVoices();
    const langCode  = language.split('-')[0].toLowerCase();
    const match     = elVoices.find(v => v.language && v.language.toLowerCase().startsWith(langCode));
    return match || openAiDefault;
  }

  // ── Internal: ElevenLabs live voice list ─────────────────────────────────

  async _listElevenLabsVoices() {
    if (!this._elevenLabsApiKey) return [];

    const CACHE_TTL_MS = 10 * 60 * 1000;   // 10 minutes
    if (this._elCache && Date.now() - this._elCachedAt < CACHE_TTL_MS) {
      return this._elCache;
    }

    try {
      const res = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers  : { 'xi-api-key': this._elevenLabsApiKey },
        timeout  : 8000,
      });

      this._elCache    = (res.data?.voices || []).map(v => ({
        voiceId    : v.voice_id,
        name       : v.name,
        provider   : 'elevenlabs',
        gender     : v.labels?.gender || 'neutral',
        language   : v.labels?.language || 'en-US',
        preview_url: v.preview_url,
        isDefault  : false,
      }));

      this._elCachedAt = Date.now();
      return this._elCache;
    } catch (err) {
      console.warn(`[DefaultVoiceCatalog] ElevenLabs voice list failed: ${err.message}`);
      return [];
    }
  }
}

module.exports = DefaultVoiceCatalog;
