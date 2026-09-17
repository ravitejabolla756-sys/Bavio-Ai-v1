'use strict';

async function resolveSignedLeadTenant({ db, toNumber, fromNumber, assistantId }) {
  const businesses = new Map();
  for (const candidate of [toNumber, fromNumber]) {
    if (!candidate || candidate === 'Unknown') continue;
    const result = await db.query('SELECT business_id, country_code FROM phone_numbers WHERE number = $1 OR phone_number = $1 OR user_original_number = $1', [candidate]);
    for (const row of result.rows) if (row.business_id) businesses.set(String(row.business_id), row.country_code || null);
  }
  if (assistantId) {
    const result = await db.query('SELECT business_id FROM assistants WHERE id = $1', [assistantId]);
    for (const row of result.rows) if (row.business_id) businesses.set(String(row.business_id), businesses.get(String(row.business_id)) || null);
  }
  if (businesses.size !== 1) throw Object.assign(new Error('Tenant could not be resolved for this signed lead event.'), { code: businesses.size === 0 ? 'TENANT_NOT_FOUND' : 'TENANT_AMBIGUOUS' });
  const businessId = [...businesses.keys()][0];
  const business = await db.query('SELECT id, country_code FROM businesses WHERE id = $1', [businessId]);
  if (business.rows.length !== 1) throw Object.assign(new Error('Tenant could not be resolved for this signed lead event.'), { code: 'TENANT_NOT_FOUND' });
  return { businessId, countryCode: business.rows[0].country_code || businesses.get(businessId) || 'US' };
}

module.exports = { resolveSignedLeadTenant };
