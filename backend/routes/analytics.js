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

module.exports = router;
