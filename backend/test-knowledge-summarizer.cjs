const test = require('node:test');
const assert = require('node:assert/strict');
const openAI = require('./services/openAIService');
const summarizer = require('./services/knowledgeSummarizer');

test('knowledge summary is structured and sends explicit operation', async () => {
  const original = openAI.chatCompletion;
  let messages;
  openAI.chatCompletion = async value => { messages = value; return JSON.stringify({ summary: 'Acme operates Monday through Saturday.', keyPoints: ['9 AM to 6 PM', 'Site visits require an appointment'], topics: ['Hours'] }); };
  try {
    const result = await summarizer.summarizeKnowledgeSource({ businessId: 'b', sourceId: 's', text: 'Acme operates Monday through Saturday from 9 AM to 6 PM.' });
    assert.deepEqual(result.topics, ['Hours']);
    assert.match(messages[1].content, /Operation: knowledge_summary/);
    assert.match(messages[1].content, /<source>/);
  } finally { openAI.chatCompletion = original; }
});

test('empty source is deterministic and never calls provider', async () => {
  await assert.rejects(() => summarizer.summarizeKnowledgeSource({ sourceId: 's', text: '  ' }), error => error.code === 'NO_READABLE_CONTENT');
});

test('generic clarification output is rejected', () => {
  assert.throws(() => summarizer.parseSummary('{"summary":"What would you like me to do?","keyPoints":[],"topics":[]}'), error => error.code === 'INVALID_KNOWLEDGE_SUMMARY');
});

test('invalid structured output has stable error code', () => {
  assert.throws(() => summarizer.parseSummary('How can I help?'), error => error.code === 'AI_SUMMARY_INVALID_RESPONSE');
});