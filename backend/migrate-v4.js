const pool = require('./db');

async function runMigration() {
    try {
        console.log('Running v4 migration: adding payment_utr to users...');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS payment_utr VARCHAR(255);
        `);
        console.log('payment_utr column added to users table.');

        console.log('v4 Migration executed successfully.');
    } catch (err) {
        console.error('Error executing v4 migration:', err);
    } finally {
        pool.end();
    }
}

runMigration();
