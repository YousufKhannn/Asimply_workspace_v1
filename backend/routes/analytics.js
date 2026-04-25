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

module.exports = router;
