const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to summarize data
async function getSummarizedData(userId) {
    const [txs, recs, pays] = await Promise.all([
        pool.query('SELECT type, amount, category, date FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 50', [userId]),
        pool.query('SELECT amount, due_date, status FROM receivables WHERE user_id = $1', [userId]),
        pool.query('SELECT amount, due_date, status FROM payables WHERE user_id = $1', [userId])
    ]);

    const totalIncome = txs.rows.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = txs.rows.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingReceivables = recs.rows.filter(r => r.status === 'pending').reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const pendingPayables = pays.rows.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
        summary: {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            pendingReceivables,
            pendingPayables,
            transactionCount: txs.rows.length
        },
        recentTransactions: txs.rows.slice(0, 10).map(t => `${t.date}: ${t.type} of ${t.amount} in ${t.category}`).join('\n')
    };
}

// @route   GET api/ai/insights
// @desc    Get AI-generated financial insights
router.get('/insights', auth, async (req, res) => {
    try {
        const data = await getSummarizedData(req.user.id);
        
        const prompt = `
            You are a minimalist CFO AI assistant for a platform called Asimply.
            Based on the following financial summary, provide exactly 3 concise, high-value insights in bullet points.
            Focus on trends, risks, or profit observations. Keep it extremely brief (max 15 words per bullet).
            
            Data:
            - Total Income: ${data.summary.totalIncome}
            - Total Expense: ${data.summary.totalExpense}
            - Net Profit: ${data.summary.netProfit}
            - Pending Receivables: ${data.summary.pendingReceivables}
            - Pending Payables: ${data.summary.pendingPayables}
            
            Recent Transactions:
            ${data.recentTransactions}
            
            Output format:
            - Insight 1
            - Insight 2
            - Insight 3
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const insights = text.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace('-', '').trim());
        res.json({ insights: insights.slice(0, 3) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'AI Insights failed' });
    }
});

// @route   POST api/ai/chat
// @desc    Simple AI Q&A
router.post('/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const data = await getSummarizedData(req.user.id);

        const prompt = `
            You are a minimalist CFO AI assistant. Answer the user's question using their financial data.
            Be direct, professional, and very brief. No fluff.
            
            Financial Summary:
            - Net Profit: ${data.summary.netProfit}
            - Income: ${data.summary.totalIncome}
            - Expenses: ${data.summary.totalExpense}
            - Receivables: ${data.summary.pendingReceivables}
            - Payables: ${data.summary.pendingPayables}
            
            User Question: "${message}"
            
            Instructions:
            - If they ask about profit, mention ${data.summary.netProfit}.
            - If they ask about losing money, look at expenses.
            - Keep response under 30 words.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ reply: response.text().trim() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'AI Chat failed' });
    }
});

module.exports = router;
