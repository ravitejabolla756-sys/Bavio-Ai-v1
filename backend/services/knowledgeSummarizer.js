const openAIService = require('./openAIService');

const SUMMARIZER_PROMPT = `You are Bavio Knowledge Intelligence.

You are not a general-purpose chat assistant.
The operation for this request is KNOWLEDGE_SUMMARY.
The user's intent has already been determined by the Bavio product.
Immediately summarize the supplied business knowledge.
Never ask what the user wants you to do. Never ask for instructions.
Never mention that the user did not provide a request. Never respond conversationally.

Use only facts contained in <source>. Return valid JSON only:
{"summary":"A concise 1–3 sentence description of what the source contains.","keyPoints":["3–6 factual points when available"],"topics":["short topic labels when supported"]}
Do not add outside knowledge, infer missing facts, or invent prices, hours, policies, contacts, products, addresses, or services. Preserve uncertainty.`;

const BLOCKED_RESPONSE_PATTERNS = [
  /what would you like me to do/i,
  /what should i do with/i,
  /there['’]?s no specific request/i,
  /i see the attached/i,
  /how can i help with this document/i,
];

function invalidSummary(message, code = 'AI_SUMMARY_INVALID_RESPONSE') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function parseSummary(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw invalidSummary('The summarizer returned no structured content.');
  if (BLOCKED_RESPONSE_PATTERNS.some(pattern => pattern.test(raw))) throw invalidSummary('The summarizer returned generic assistant language.', 'INVALID_KNOWLEDGE_SUMMARY');
  const withoutFence = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start < 0 || end <= start) throw invalidSummary('The summarizer returned invalid structured content.');
  let parsed;
  try { parsed = JSON.parse(withoutFence.slice(start, end + 1)); } catch { throw invalidSummary('The summarizer returned invalid structured content.'); }
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(point => typeof point === 'string' && point.trim()).map(point => point.trim()).slice(0, 6) : [];
  const topics = Array.isArray(parsed.topics) ? parsed.topics.filter(topic => typeof topic === 'string' && topic.trim()).map(topic => topic.trim()).slice(0, 8) : [];
  if (!summary) throw invalidSummary('The summarizer returned no summary.');
  return { summary, keyPoints, topics };
}

async function summarizeKnowledgeSource(input, legacySourceName = '') {
  const options = typeof input === 'string' ? { text: input, sourceName: legacySourceName } : (input || {});
  const content = options.text;
  if (typeof content !== 'string' || !content.trim()) throw Object.assign(new Error('NO_READABLE_CONTENT'), { code: 'NO_READABLE_CONTENT' });
  const sourceName = typeof options.sourceName === 'string' ? options.sourceName : '';
  console.info('[KB] Knowledge summary input', { sourceId: options.sourceId || 'unknown', sourceType: options.sourceType || 'text', chars: content.trim().length, words: content.trim().split(/\s+/).length });
  const context = sourceName.trim() ? `Source title (context only): ${sourceName.trim()}\n` : '';
  const raw = await openAIService.chatCompletion([
    { role: 'system', content: SUMMARIZER_PROMPT },
    { role: 'user', content: `Operation: knowledge_summary\nSummarize the business knowledge contained in <source> according to the system instructions.\n\n<source>\n${context}${content.trim()}\n</source>` },
  ], 'gpt-5.4-mini', 0.1);
  return parseSummary(raw);
}

module.exports = { SUMMARIZER_PROMPT, parseSummary, summarizeKnowledgeSource };