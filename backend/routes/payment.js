const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   POST /api/payment/verify
// @desc    Mark the authenticated user as paid (MVP - no gateway)
router.post('/verify', auth, async (req, res) => {
    const { utr } = req.body;

    if (!utr || utr.length < 8) {
        return res.status(400).json({ msg: 'Please enter a valid 12-digit UTR or Transaction ID.' });
    }

    try {
        await pool.query(
            'UPDATE users SET is_paid = true, payment_utr = $1 WHERE id = $2',
            [utr, req.user.id]
        );
        res.json({ success: true, msg: 'Payment details submitted. Access granted.' });
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
