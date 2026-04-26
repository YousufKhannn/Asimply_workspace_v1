const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   GET api/analytics/dashboard-summary
// @desc    Get dashboard metrics (revenue, expenses, profit, cash, burn rate, runway)
router.get('/dashboard-summary', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use raw query to get all transactions and calculate on server for simplicity
        // In a real huge production app, we'd do aggregations in SQL
        const result = await pool.query('SELECT type, amount, date FROM transactions WHERE user_id = $1', [userId]);
        const transactions = result.rows;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalIncomeAllTime = 0;
        let totalExpenseAllTime = 0;
        let currentMonthIncome = 0;
        let currentMonthExpense = 0;
        let prevMonthIncome = 0;
        let prevMonthExpense = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const amt = parseFloat(t.amount);
            const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            const isPrevMonth = (currentMonth === 0) ? 
                (tDate.getMonth() === 11 && tDate.getFullYear() === currentYear - 1) : 
                (tDate.getMonth() === currentMonth - 1 && tDate.getFullYear() === currentYear);

            if (t.type === 'income') {
                totalIncomeAllTime += amt;
                if (isCurrentMonth) currentMonthIncome += amt;
                if (isPrevMonth) prevMonthIncome += amt;
            } else {
                totalExpenseAllTime += amt;
                if (isCurrentMonth) currentMonthExpense += amt;
                if (isPrevMonth) prevMonthExpense += amt;
            }
        });

        const netCashBalance = totalIncomeAllTime - totalExpenseAllTime;
        const currentMonthProfit = currentMonthIncome - currentMonthExpense;
        const prevMonthProfit = prevMonthIncome - prevMonthExpense;
        const monthlyBurnRate = currentMonthExpense;
        const runwayMonths = monthlyBurnRate > 0 ? (netCashBalance / monthlyBurnRate).toFixed(1) : (netCashBalance > 0 ? '∞' : '0');

        res.json({
            revenue: currentMonthIncome,
            expenses: currentMonthExpense,
            profit: currentMonthProfit,
            prevProfit: prevMonthProfit,
            netCash: netCashBalance,
            burnRate: monthlyBurnRate,
            runway: runwayMonths
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/expense-breakdown
// @desc    Get expenses by category for current month
router.get('/expense-breakdown', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const result = await pool.query(
            `SELECT category, SUM(amount) as total 
             FROM transactions 
             WHERE user_id = $1 AND type = 'expense' AND date >= $2
             GROUP BY category
             ORDER BY total DESC`,
             [userId, startOfMonth]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ─────────────────────────────────────────────
// FEATURE 1: Cash Runway Calculator
// GET /api/analytics/runway
// ─────────────────────────────────────────────
router.get('/runway', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT type, amount, date FROM transactions WHERE user_id = $1',
            [userId]
        );
        const transactions = result.rows;

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        let totalIncome = 0;
        let totalExpense = 0;
        let last30DaysExpense = 0;

        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            const tDate = new Date(t.date);
            if (t.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                if (tDate >= thirtyDaysAgo) {
                    last30DaysExpense += amt;
                }
            }
        });

        const currentCash = totalIncome - totalExpense;
        const monthlyBurn = last30DaysExpense; // last 30 days = 1 month approximation

        let runwayMonths = null;
        let status = 'healthy';

        if (currentCash < 0) {
            status = 'at_risk';
            runwayMonths = 0;
        } else if (monthlyBurn === 0) {
            status = 'healthy';
            runwayMonths = null; // infinite
        } else {
            runwayMonths = parseFloat((currentCash / monthlyBurn).toFixed(1));
            status = runwayMonths >= 6 ? 'healthy' : runwayMonths >= 3 ? 'warning' : 'at_risk';
        }

        res.json({
            current_cash: currentCash,
            monthly_burn: monthlyBurn,
            runway_months: runwayMonths,
            status
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ─────────────────────────────────────────────
// FEATURE 2: Profit Leakage Detector
// GET /api/analytics/leakage
// ─────────────────────────────────────────────
router.get('/leakage', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // Current week: last 7 days
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - 7);

        // Previous week: 8–14 days ago
        const prevWeekStart = new Date(now);
        prevWeekStart.setDate(now.getDate() - 14);
        const prevWeekEnd = new Date(currentWeekStart);

        const result = await pool.query(
            `SELECT category, amount, date FROM transactions
             WHERE user_id = $1 AND type = 'expense' AND date >= $2`,
            [userId, prevWeekStart.toISOString().split('T')[0]]
        );
        const rows = result.rows;

        // Group by category for both windows
        const currentWeek = {};
        const prevWeek = {};

        rows.forEach(t => {
            const tDate = new Date(t.date);
            const amt = parseFloat(t.amount);
            const cat = t.category;

            if (tDate >= currentWeekStart) {
                currentWeek[cat] = (currentWeek[cat] || 0) + amt;
            } else if (tDate >= prevWeekStart && tDate < prevWeekEnd) {
                prevWeek[cat] = (prevWeek[cat] || 0) + amt;
            }
        });

        const spikes = [];
        Object.keys(currentWeek).forEach(cat => {
            const curr = currentWeek[cat];
            const prev = prevWeek[cat] || 0;

            if (prev === 0 && curr > 0) {
                // New expense category this week — flag as new spike
                spikes.push({
                    category: cat,
                    increase_percent: 100,
                    current_week: curr,
                    prev_week: 0,
                    message: `${cat} expenses appeared this week (new category)`
                });
            } else if (prev > 0 && curr > prev * 1.3) {
                const pct = Math.round(((curr - prev) / prev) * 100);
                spikes.push({
                    category: cat,
                    increase_percent: pct,
                    current_week: curr,
                    prev_week: prev,
                    message: `${cat} expenses increased ${pct}% this week`
                });
            }
        });

        // Sort by highest increase first
        spikes.sort((a, b) => b.increase_percent - a.increase_percent);

        res.json(spikes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ─────────────────────────────────────────────
// FEATURE 3: Financial Health Score
// GET /api/analytics/health
// ─────────────────────────────────────────────
router.get('/health', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // For runway sub-calc (last 30 days)
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const result = await pool.query(
            'SELECT type, amount, date FROM transactions WHERE user_id = $1',
            [userId]
        );
        const transactions = result.rows;

        let totalIncome = 0;
        let totalExpense = 0;
        let last30DaysExpense = 0;

        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            const tDate = new Date(t.date);
            if (t.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                if (tDate >= thirtyDaysAgo) last30DaysExpense += amt;
            }
        });

        const profit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? profit / totalIncome : 0;
        const currentCash = profit;
        const runway = last30DaysExpense > 0 ? currentCash / last30DaysExpense : Infinity;

        // Scoring
        let score = 10;
        const deductions = [];

        if (profit < 0) {
            score -= 4;
            deductions.push('Negative profit (-4)');
        }
        if (totalIncome > 0 && totalExpense > totalIncome * 0.7) {
            score -= 3;
            deductions.push('High expense ratio (-3)');
        }
        if (runway < 3 && last30DaysExpense > 0) {
            score -= 3;
            deductions.push('Low runway (-3)');
        }

        score = Math.max(0, Math.min(10, score));

        let status, message;
        if (score >= 7) {
            status = 'Healthy';
            message = 'Your business is in strong financial shape.';
        } else if (score >= 4) {
            status = 'Moderate';
            message = 'Some areas need attention to improve stability.';
        } else {
            status = 'At Risk';
            message = 'Immediate action needed to stabilize finances.';
        }

        res.json({
            score,
            status,
            message,
            profit_margin: parseFloat((profitMargin * 100).toFixed(1)),
            deductions
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ─────────────────────────────────────────────
// FEATURE 4: Cash Gap Forecast
// GET /api/analytics/cash-forecast?range=7|15|30
// ─────────────────────────────────────────────
router.get('/cash-forecast', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const range = parseInt(req.query.range) || 7;
        if (![7, 15, 30].includes(range)) {
            return res.status(400).json({ msg: 'Range must be 7, 15, or 30' });
        }

        // 1. Compute current cash from all transactions
        const txResult = await pool.query(
            'SELECT type, amount FROM transactions WHERE user_id = $1',
            [userId]
        );
        let totalIncome = 0;
        let totalExpense = 0;
        txResult.rows.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') totalIncome += amt;
            else totalExpense += amt;
        });
        const currentCash = totalIncome - totalExpense;

        // 2. Fetch pending receivables and payables within the range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(today);
        rangeEnd.setDate(today.getDate() + range);
        const rangeEndStr = rangeEnd.toISOString().split('T')[0];

        const [recResult, payResult] = await Promise.all([
            pool.query(
                `SELECT amount, due_date FROM receivables
                 WHERE user_id = $1 AND status = 'pending' AND due_date <= $2`,
                [userId, rangeEndStr]
            ),
            pool.query(
                `SELECT amount, due_date FROM payables
                 WHERE user_id = $1 AND status = 'pending' AND due_date <= $2`,
                [userId, rangeEndStr]
            )
        ]);

        // 3. Index events by date string (YYYY-MM-DD)
        const inflows = {};   // date → total incoming
        const outflows = {};  // date → total outgoing

        recResult.rows.forEach(r => {
            const d = new Date(r.due_date).toISOString().split('T')[0];
            inflows[d] = (inflows[d] || 0) + parseFloat(r.amount);
        });

        payResult.rows.forEach(p => {
            const d = new Date(p.due_date).toISOString().split('T')[0];
            outflows[d] = (outflows[d] || 0) + parseFloat(p.amount);
        });

        // 4. Build day-by-day timeline
        let balance = currentCash;
        let totalIncoming = 0;
        let totalOutgoing = 0;
        let risk = false;
        let riskDate = null;

        const timeline = [];

        for (let i = 0; i < range; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];

            const dayIn = inflows[dateStr] || 0;
            const dayOut = outflows[dateStr] || 0;

            balance += dayIn - dayOut;
            totalIncoming += dayIn;
            totalOutgoing += dayOut;

            timeline.push({ date: dateStr, balance: parseFloat(balance.toFixed(2)) });

            if (!risk && balance < 0) {
                risk = true;
                riskDate = dateStr;
            }
        }

        res.json({
            summary: {
                current_cash: parseFloat(currentCash.toFixed(2)),
                total_incoming: parseFloat(totalIncoming.toFixed(2)),
                total_outgoing: parseFloat(totalOutgoing.toFixed(2)),
                net_projection: parseFloat((currentCash + totalIncoming - totalOutgoing).toFixed(2)),
                risk,
                risk_date: riskDate
            },
            timeline
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

