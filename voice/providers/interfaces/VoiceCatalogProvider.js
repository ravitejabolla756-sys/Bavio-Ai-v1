'use strict';

/**
 * VoiceCatalogProvider — abstract base interface
 *
 * Returns available voices for a given TTS provider.
 * Used by the assistant configuration UI so business owners can
 * pick from available ElevenLabs or OpenAI voices.
 */

class VoiceCatalogProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === VoiceCatalogProvider) {
      throw new TypeError(
        'VoiceCatalogProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName = providerName;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Return the list of available voices for this provider.
   *
   * @param {object} [opts]
   * @param {string} [opts.language]   BCP-47 filter, e.g. 'en-US'
   * @param {string} [opts.gender]     'male' | 'female' | 'neutral'
   * @returns {Promise<VoiceEntry[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async listVoices(opts = {}) {
    throw new Error(`${this.providerName}.listVoices() not implemented`);
  }

  /**
   * Return metadata for a single voice by its provider ID.
   *
   * @param {string} voiceId
   * @returns {Promise<VoiceEntry|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async getVoice(voiceId) {
    throw new Error(`${this.providerName}.getVoice() not implemented`);
  }

  /**
   * Return the default voice for this provider and language.
   *
   * @param {string} [language]  BCP-47 code (e.g. 'en-US')
   * @returns {Promise<VoiceEntry>}
   */
  // eslint-disable-next-line no-unused-vars
  async getDefaultVoice(language) {
    throw new Error(`${this.providerName}.getDefaultVoice() not implemented`);
  }
}

/**
 * @typedef {object} VoiceEntry
 * @property {string} voiceId         Provider-specific voice identifier
 * @property {string} name            Human-readable voice name
 * @property {string} provider        'openai' | 'elevenlabs' | 'deepgram'
 * @property {string} [gender]        'male' | 'female' | 'neutral'
 * @property {string} [language]      Primary BCP-47 language code
 * @property {string} [preview_url]   URL to a short audio preview sample
 * @property {boolean} [isDefault]    True if this is the provider's default
 */

module.exports = VoiceCatalogProvider;
