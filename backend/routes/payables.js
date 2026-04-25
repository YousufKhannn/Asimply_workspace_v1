const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   POST api/payables
// @desc    Add new payable
router.post('/', auth, async (req, res) => {
    try {
        const { vendor_name, amount, due_date } = req.body;
        const newEntry = await pool.query(
            'INSERT INTO payables (user_id, vendor_name, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, vendor_name, amount, due_date]
        );
        res.json(newEntry.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/payables
// @desc    Get all user payables
router.get('/', auth, async (req, res) => {
    try {
        const entries = await pool.query(
            'SELECT * FROM payables WHERE user_id = $1 ORDER BY due_date ASC',
            [req.user.id]
        );
        res.json(entries.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/payables/:id
// @desc    Mark as paid
router.patch('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // should be 'paid'
        
        const updateEntry = await pool.query(
            'UPDATE payables SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [status, id, req.user.id]
        );
        
        if (updateEntry.rows.length === 0) {
            return res.status(404).json({ msg: 'Payable not found or not authorized' });
        }
        res.json(updateEntry.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/payables/:id
// @desc    Delete payable
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteEntry = await pool.query(
            'DELETE FROM payables WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        
        if (deleteEntry.rows.length === 0) {
            return res.status(404).json({ msg: 'Payable not found or not authorized' });
        }
        res.json({ msg: 'Payable deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
