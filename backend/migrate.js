const fs = require('fs');
const pool = require('./db');

async function runSchema() {
    try {
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        console.log('Running schema...');
        await pool.query(schema);
        console.log('Schema executed successfully.');
    } catch (err) {
        console.error('Error executing schema:', err);
    } finally {
        pool.end();
    }
}

runSchema();
