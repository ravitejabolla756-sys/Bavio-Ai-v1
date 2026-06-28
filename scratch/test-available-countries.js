require('dotenv').config();
const twilio = require('twilio');

async function main() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  console.log('Twilio SID:', sid);
  if (!sid || !token) {
    console.error('Credentials missing');
    return;
  }
  const client = twilio(sid, token);
  try {
    console.log('Fetching available phone number countries from Twilio...');
    const countries = await client.availablePhoneNumbers.list({ limit: 10 });
    console.log('Fetched countries count:', countries.length);
    console.log('Sample country records:', countries.map(c => ({ countryCode: c.countryCode, country: c.country })));
  } catch (err) {
    console.error('Error fetching available countries:', err);
  }
}

main();
