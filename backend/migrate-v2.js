const pool = require('./db');

async function runMigration() {
    try {
        console.log('Running v2 migration...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS receivables (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_name VARCHAR(255) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                due_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Receivables table created or verified.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payables (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                vendor_name VARCHAR(255) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                due_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Payables table created or verified.');

        console.log('v2 Migration executed successfully.');
    } catch (err) {
        console.error('Error executing v2 migration:', err);
    } finally {
        pool.end();
    }
}

runMigration();
