const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   POST /api/payment/verify
// @desc    Mark the authenticated user as paid (MVP - no gateway)
router.post('/verify', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE users SET is_paid = true WHERE id = $1',
            [req.user.id]
        );
        res.json({ success: true, msg: 'Payment verified. Full access granted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/payment/status
// @desc    Get payment status of the authenticated user
router.get('/status', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT is_paid FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ is_paid: result.rows[0]?.is_paid ?? false });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
