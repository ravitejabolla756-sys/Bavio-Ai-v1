'use strict';

// Extraction is interpretation, not proof that a business action executed.
function validateInsight(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid insight');
  const result = {};
  for (const key of ['interested', 'callback_required']) {
    if (typeof value[key] !== 'boolean') throw new Error(`Invalid ${key}`);
    result[key] = value[key];
  }
  const score = value.lead_score;
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) throw new Error('Invalid lead_score');
  result.lead_score = score;
  for (const key of ['budget', 'location', 'property_type', 'purchase_timeline', 'summary']) {
    if (value[key] !== null && typeof value[key] !== 'string') throw new Error(`Invalid ${key}`);
    result[key] = typeof value[key] === 'string' ? value[key].trim() || null : null;
  }
  return result;
}
module.exports = { validateInsight };
