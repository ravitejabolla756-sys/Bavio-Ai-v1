require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testDB() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("Connected to Supabase PostgreSQL:", result.rows);
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        await pool.end();
    }
}

testDB();
