const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');

// --- LEADS ---

// Get all leads
router.get('/leads', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create lead
router.post('/leads', authenticate, async (req, res) => {
    const { name, phone, email, company_name, source } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leads (user_id, name, phone, email, company_name, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, name, phone, email, company_name, source]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update lead
router.put('/leads/:id', authenticate, async (req, res) => {
    const { name, phone, email, company_name, source, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE leads SET name = $1, phone = $2, email = $3, company_name = $4, source = $5, status = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
            [name, phone, email, company_name, source, status, req.params.id, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete lead
router.delete('/leads/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM leads WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ msg: 'Lead removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- DEALS ---

// Get all deals
router.get('/deals', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT d.*, l.name as lead_name FROM deals d JOIN leads l ON d.lead_id = l.id WHERE d.user_id = $1 ORDER BY d.created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create deal
router.post('/deals', authenticate, async (req, res) => {
    const { lead_id, name, value, stage, expected_close_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO deals (user_id, lead_id, name, value, stage, expected_close_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, lead_id, name, value, stage || 'new', expected_close_date]
        );
        
        // If stage is closed, trigger client creation
        if (stage === 'closed') {
            await createClientFromLead(req.user.id, lead_id);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update deal
router.put('/deals/:id', authenticate, async (req, res) => {
    const { name, value, stage, expected_close_date } = req.body;
    try {
        const result = await pool.query(
            'UPDATE deals SET name = $1, value = $2, stage = $3, expected_close_date = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [name, value, stage, expected_close_date, req.params.id, req.user.id]
        );

        // If stage is updated to closed, trigger client creation
        if (stage === 'closed') {
            // Get lead_id for this deal
            const dealRes = await pool.query('SELECT lead_id FROM deals WHERE id = $1', [req.params.id]);
            if (dealRes.rows.length > 0) {
                await createClientFromLead(req.user.id, dealRes.rows[0].lead_id);
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- ACTIVITIES ---

// Get activities for a lead
router.get('/activities/:lead_id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM activities WHERE lead_id = $1 AND user_id = $2 ORDER BY created_at DESC',
            [req.params.lead_id, req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create activity
router.post('/activities', authenticate, async (req, res) => {
    const { lead_id, note, next_follow_up_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO activities (user_id, lead_id, note, next_follow_up_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, lead_id, note, next_follow_up_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- CLIENTS & INTEGRATION ---

// Get all clients with financial summary
router.get('/clients', authenticate, async (req, res) => {
    try {
        // Get clients and their revenue/pending from receivables and transactions
        const result = await pool.query(`
            SELECT 
                c.*,
                COALESCE(SUM(CASE WHEN r.status = 'received' THEN r.amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN r.status = 'pending' THEN r.amount ELSE 0 END), 0) as pending_amount
            FROM clients c
            LEFT JOIN receivables r ON c.id = r.client_id
            WHERE c.user_id = $1
            GROUP BY c.id
            ORDER BY c.name ASC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get client details including history
router.get('/clients/:id', authenticate, async (req, res) => {
    try {
        const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (clientRes.rows.length === 0) return res.status(404).json({ msg: 'Client not found' });

        const historyRes = await pool.query(
            'SELECT * FROM receivables WHERE client_id = $1 AND user_id = $2 ORDER BY due_date DESC',
            [req.params.id, req.user.id]
        );

        res.json({
            client: clientRes.rows[0],
            history: historyRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Helper function to create client from lead
async function createClientFromLead(userId, leadId) {
    // Check if client already exists for this lead
    const existing = await pool.query('SELECT id FROM clients WHERE linked_lead_id = $1', [leadId]);
    if (existing.rows.length > 0) return;

    // Get lead name
    const lead = await pool.query('SELECT name FROM leads WHERE id = $1', [leadId]);
    if (lead.rows.length === 0) return;

    await pool.query(
        'INSERT INTO clients (user_id, name, linked_lead_id) VALUES ($1, $2, $3)',
        [userId, lead.rows[0].name, leadId]
    );
    
    // Also update lead status to closed if not already
    await pool.query('UPDATE leads SET status = $1 WHERE id = $2', ['closed', leadId]);
}

module.exports = router;
