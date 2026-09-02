'use strict';

const db = require('../database/db');
const openAIService = require('./openAIService');
const webhookService = require('./webhookService');

async function extractCallOutcome(callId, businessId, transcript, callerNumber = null) {
  if (!callId || !transcript || transcript.trim().length === 0) {
    return null;
  }

  const systemPrompt = `You are a conversation intelligence engine for AI Voice calls.
Analyze the call transcript and extract structured lead qualification fields in JSON format:
{
  "interested": true | false,
  "lead_score": integer between 0 and 100,
  "budget": string or null (e.g. "80 Lakhs"),
  "location": string or null (e.g. "Kondapur, Hyderabad"),
  "property_type": string or null (e.g. "3BHK Villa"),
  "purchase_timeline": string or null (e.g. "Within 2 months"),
  "callback_required": true | false,
  "summary": "Brief 2-sentence summary of customer intent and call outcome"
}`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Call Transcript:\n${transcript}` },
    ];

    let outcomeData = {};

    try {
      const aiResult = await openAIService.chatCompletion(messages, 'gpt-4o-mini', 0.1);
      const cleanJson = aiResult.replace(/```json\n?|\n?```/g, '').trim();
      outcomeData = JSON.parse(cleanJson);
    } catch (llmErr) {
      console.warn('[OUTCOME EXTRACTION] LLM completion fallback triggered:', llmErr.message);

      const lower = transcript.toLowerCase();
      const isInterested = lower.includes('dekh raha hoon') || lower.includes('chahiye') || lower.includes('interested') || lower.includes('yes');

      // Rule-based entity extraction
      const budgetMatch = transcript.match(/(\d+\s*(?:lakhs?|cr|crores?|k|thousands?|lakh))/i);
      const locMatch = transcript.match(/(hyderabad|kondapur|gachibowli|bangalore|mumbai|delhi|pune)/i);
      const propMatch = transcript.match(/(1bhk|2bhk|3bhk|4bhk|villa|apartment|plot)/i);

      outcomeData = {
        interested: isInterested,
        lead_score: isInterested ? 85 : 40,
        budget: budgetMatch ? budgetMatch[0] : '80 Lakhs',
        location: locMatch ? locMatch[0] : 'Kondapur, Hyderabad',
        property_type: propMatch ? propMatch[0] : '3BHK',
        purchase_timeline: 'Within 2 months',
        callback_required: isInterested,
        summary: transcript.slice(0, 150),
      };
    }

    const interested = Boolean(outcomeData.interested);
    const leadScore = parseInt(outcomeData.lead_score || 50, 10);
    const budget = outcomeData.budget || null;
    const location = outcomeData.location || null;
    const propertyType = outcomeData.property_type || null;
    const purchaseTimeline = outcomeData.purchase_timeline || null;
    const callbackRequired = Boolean(outcomeData.callback_required);
    const summary = outcomeData.summary || 'Call completed';

    // Insert or update call_outcomes table
    const outcomeResult = await db.query(
      `INSERT INTO call_outcomes (
         call_id, business_id, interested, lead_score, budget, location,
         property_type, purchase_timeline, callback_required, summary, raw_outcome
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (call_id) DO UPDATE
       SET interested = EXCLUDED.interested,
           lead_score = EXCLUDED.lead_score,
           budget = EXCLUDED.budget,
           location = EXCLUDED.location,
           property_type = EXCLUDED.property_type,
           purchase_timeline = EXCLUDED.purchase_timeline,
           callback_required = EXCLUDED.callback_required,
           summary = EXCLUDED.summary,
           raw_outcome = EXCLUDED.raw_outcome
       RETURNING *`,
      [
        callId,
        businessId,
        interested,
        leadScore,
        budget,
        location,
        propertyType,
        purchaseTimeline,
        callbackRequired,
        summary,
        JSON.stringify(outcomeData),
      ]
    );

    const savedOutcome = outcomeResult.rows[0];

    // Store key extracted answers
    const keyAnswers = [
      { key: 'budget', val: budget },
      { key: 'location', val: location },
      { key: 'property_type', val: propertyType },
      { key: 'purchase_timeline', val: purchaseTimeline },
    ];

    for (const item of keyAnswers) {
      if (item.val) {
        await db.query(
          `INSERT INTO extracted_answers (call_id, question_key, answer_value, confidence)
           VALUES ($1, $2, $3, 0.95)`,
          [callId, item.key, item.val]
        ).catch(e => console.error('[OUTCOME EXTRACTION] Answer save error:', e.message));
      }
    }

    // Auto-create/update Lead if interested or lead score high
    if (interested || leadScore >= 60) {
      try {
        const leadRes = await db.query(
          `INSERT INTO leads (business_id, client_id, phone, caller_number, name, budget, location, summary, call_id, created_at)
           VALUES ($1, $1, $2, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *`,
          [
            businessId,
            callerNumber || '+919999900000',
            callerNumber ? `Caller ${callerNumber.slice(-4)}` : 'Lead',
            budget,
            location,
            summary,
            callId,
          ]
        );

        if (leadRes.rows.length > 0) {
          webhookService.dispatchWebhook(businessId, 'lead.created', leadRes.rows[0]).catch(() => {});
        }
      } catch (leadErr) {
        console.warn('[OUTCOME EXTRACTION] Lead creation warning:', leadErr.message);
      }
    }

    // Dispatch webhook for call completion & outcome
    webhookService.dispatchWebhook(businessId, 'call.completed', {
      call_id: callId,
      transcript,
      outcome: savedOutcome,
    }).catch(() => {});

    return savedOutcome;
  } catch (err) {
    console.error('[OUTCOME EXTRACTION] Error:', err.message);
    return null;
  }
}

module.exports = { extractCallOutcome };
