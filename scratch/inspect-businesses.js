require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = require('../database/db');

async function main() {
    try {
        console.log("=== Updating Pricing Plans in Database ===");
        
        const updateStarter = await pool.query(
            `UPDATE pricing_plans 
             SET monthly_price = 2599.00, yearly_price = 24950.00, minutes_included = 250, updated_at = NOW() 
             WHERE country_code = 'IN' AND plan_name = 'starter'
             RETURNING *`
        );
        console.log("Updated Starter:", updateStarter.rows[0]);

        const updateGrowth = await pool.query(
            `UPDATE pricing_plans 
             SET monthly_price = 5199.00, yearly_price = 49910.00, minutes_included = 600, updated_at = NOW() 
             WHERE country_code = 'IN' AND plan_name = 'growth'
             RETURNING *`
        );
        console.log("Updated Growth:", updateGrowth.rows[0]);

        const updateScale = await pool.query(
            `UPDATE pricing_plans 
             SET monthly_price = 10399.00, yearly_price = 99830.00, minutes_included = 2000, updated_at = NOW() 
             WHERE country_code = 'IN' AND plan_name = 'scale'
             RETURNING *`
        );
        console.log("Updated Scale:", updateScale.rows[0]);

    } catch (err) {
        console.error("Update failed:", err);
    } finally {
        await pool.end();
    }
}

main();
