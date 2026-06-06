import { redisClient } from '../redis/redis.client';
import { supabase } from '../database/supabase';

export class LeadService {
  static async extractLead(callSid: string): Promise<void> {
    const redisKey = `call:${callSid}`;
    const sessionData = await redisClient.hgetall(redisKey);

    if (!sessionData || !sessionData.business_id) return;

    const history = JSON.parse(sessionData.conversation_history || '[]');
    const extractedData = await this.performExtraction(history);

    await supabase.from('leads').insert({
      business_id: sessionData.business_id,
      call_sid: callSid,
      caller_name: extractedData.name || 'Unknown',
      caller_phone: sessionData.caller_number,
      intent: extractedData.intent || 'General Inquiry',
      summary: extractedData.summary || '',
      extracted_data: extractedData.rawJson,
      status: 'new'
    });

    await this.notifyBusiness(sessionData.business_id, extractedData);
  }

  private static async performExtraction(history: any[]): Promise<any> {
    return {
      name: "John Doe",
      intent: "Booking an appointment",
      summary: "Customer wants to book an appointment for tomorrow at 2 PM.",
      rawJson: { time: "2 PM", date: "Tomorrow" }
    };
  }

  private static async notifyBusiness(businessId: string, leadData: any): Promise<void> {
    await supabase.from('notifications').insert({
      business_id: businessId,
      type: 'whatsapp',
      recipient: 'business-owner',
      content: `New Lead: ${leadData.name} - ${leadData.intent}`,
      status: 'pending'
    });
  }
}
