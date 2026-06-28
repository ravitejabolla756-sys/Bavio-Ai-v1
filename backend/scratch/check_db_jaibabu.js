require('dotenv').config();
const db = require('../database/db');

async function run() {
    try {
        console.log('Searching for jaibabu/jaibab...');
        const emails = await db.query(
            "SELECT id, name, email, phone FROM businesses WHERE email ILIKE $1 OR email ILIKE $2 OR phone ILIKE $3",
            ['%jaibabu%', '%jaibab%', '%8478%']
        );
        console.log('Matching database rows:', emails.rows);

        // Also query Supabase Auth users if we can
        console.log('Querying Supabase auth users...');
        const { data: { users }, error } = await db.supabase.auth.admin.listUsers();
        if (error) {
            console.error('Supabase listUsers error:', error);
        } else {
            const matchingUsers = users.filter(u => 
                (u.email && u.email.includes('jaibabu')) || 
                (u.email && u.email.includes('jaibab')) || 
                (u.phone && u.phone.includes('8478'))
            );
            console.log('Matching Supabase users:', matchingUsers.map(u => ({ id: u.id, email: u.email, phone: u.phone })));
        }
    } catch (err) {
        console.error('Error running check:', err);
    } finally {
        process.exit();
    }
}

run();
