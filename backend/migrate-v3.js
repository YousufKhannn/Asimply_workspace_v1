const pool = require('./db');

async function runMigration() {
    try {
        console.log('Running v3 migration: adding is_paid to users...');

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
        `);
        console.log('is_paid column added to users table.');

        console.log('v3 Migration executed successfully.');
    } catch (err) {
        console.error('Error executing v3 migration:', err);
    } finally {
        pool.end();
    }
}

runMigration();
