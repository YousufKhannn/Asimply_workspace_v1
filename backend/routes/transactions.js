const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   POST api/transactions
// @desc    Add new transaction
router.post('/', auth, async (req, res) => {
    try {
        const { type, amount, category, date } = req.body;
        const newTransaction = await pool.query(
            'INSERT INTO transactions (user_id, type, amount, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, type, amount, category, date]
        );
        res.json(newTransaction.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/transactions
// @desc    Get all user transactions
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
            [req.user.id]
        );
        res.json(transactions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/transactions/:id
// @desc    Delete transaction
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteTransaction = await pool.query(
            'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (deleteTransaction.rows.length === 0) {
            return res.status(404).json({ msg: 'Transaction not found or not authorized' });
        }
        res.json({ msg: 'Transaction deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
