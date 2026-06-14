require('dotenv').config();
const twilio = require('twilio');

async function main() {
    try {
        console.log("=== Fetching Twilio Active Numbers ===");
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({limit: 10});
        incomingPhoneNumbers.forEach(number => {
            console.log(`SID: ${number.sid}, FriendlyName: ${number.friendlyName}, PhoneNumber: ${number.phoneNumber}`);
        });
    } catch (err) {
        console.error("Twilio error:", err.message);
    }
}

main();
