import { redisClient } from '../redis/redis.client';
import { supabase } from '../database/supabase';

export class SarvamService {
  static async processTurn(callSid: string, userTranscript: string): Promise<string> {
    const redisKey = `call:${callSid}`;
    const sessionData = await redisClient.hgetall(redisKey);

    if (!sessionData || !sessionData.assistant_id) {
      throw new Error(`Session not found for call ${callSid}`);
    }

    const history = JSON.parse(sessionData.conversation_history || '[]');
    history.push({ role: 'user', content: userTranscript });

    await supabase.from('transcripts').insert({
      call_sid: callSid,
      role: 'user',
      content: userTranscript
    });

    const sarvamResponse = await this.callSarvamLLM(sessionData.assistant_id, history);
    history.push({ role: 'assistant', content: sarvamResponse });

    await supabase.from('transcripts').insert({
      call_sid: callSid,
      role: 'assistant',
      content: sarvamResponse
    });

    await redisClient.hset(redisKey, 'conversation_history', JSON.stringify(history));
    const ttsAudioUrl = await this.callSarvamTTS(sarvamResponse);

    return ttsAudioUrl;
  }

  private static async callSarvamLLM(assistantId: string, history: any[]): Promise<string> {
    return "Thank you for calling. How can I help you today?";
  }

  private static async callSarvamTTS(text: string): Promise<string> {
    return "https://storage.placeholder.com/audio.wav";
  }
}
