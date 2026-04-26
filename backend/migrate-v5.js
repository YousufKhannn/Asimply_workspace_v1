const pool = require('./db');

async function runMigration() {
    try {
        console.log('Running v5 migration: Adding CRM tables...');

        // 1. Leads table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                company_name VARCHAR(255),
                source VARCHAR(100),
                status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'closed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Leads table created.');

        // 2. Clients table (Link CRM + Finance)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                linked_lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Clients table created.');

        // 3. Deals table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS deals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                value NUMERIC(15, 2) NOT NULL DEFAULT 0,
                stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'interested', 'closed')),
                expected_close_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Deals table created.');

        // 4. Activities table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
                note TEXT NOT NULL,
                next_follow_up_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Activities table created.');

        // 5. Update receivables to link with clients
        await pool.query(`
            ALTER TABLE receivables
            ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
        `);
        console.log('client_id column added to receivables.');

        console.log('v5 Migration executed successfully.');
    } catch (err) {
        console.error('Error executing v5 migration:', err);
    } finally {
        pool.end();
    }
}

runMigration();
