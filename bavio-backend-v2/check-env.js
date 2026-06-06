require('dotenv').config();

console.log('Checking environment variables...\n');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    // Parse and mask the password
    try {
        const url = new URL(dbUrl);
        console.log('\nDATABASE_URL components:');
        console.log('  Protocol:', url.protocol);
        console.log('  Host:', url.host);
        console.log('  Username:', url.username);
        console.log('  Password:', url.password ? '****' : 'none');
        console.log('  Database:', url.pathname.slice(1));
    } catch (e) {
        console.log('\nDATABASE_URL: [invalid URL format]');
    }
} else {
    console.log('\nDATABASE_URL: NOT SET');
}

console.log('\nSARVAM_API_KEY:', process.env.SARVAM_API_KEY ? '****' : 'not set');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '****' : 'not set');
