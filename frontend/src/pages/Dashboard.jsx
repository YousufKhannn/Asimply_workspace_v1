import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import AIInsights from '../components/AIInsights';
import AIChatbot from '../components/AIChatbot';

import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        revenue: 0, expenses: 0, profit: 0, prevProfit: 0, netCash: 0, burnRate: 0, runway: '0'
    });
    const [expenseCategories, setExpenseCategories] = useState([]);
    
    const [receivables, setReceivables] = useState([]);
    const [payables, setPayables] = useState([]);

    // CFO Insights state
    const [runway, setRunway] = useState(null);
    const [leakage, setLeakage] = useState([]);
    const [healthScore, setHealthScore] = useState(null);

    // Cash Forecast state
    const [forecastRange, setForecastRange] = useState(7);
    const [forecastData, setForecastData] = useState(null);
    const [forecastLoading, setForecastLoading] = useState(false);

    
    const [alerts, setAlerts] = useState([]);
    
    // Form state (Transactions)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('income');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Sales');
    
    // Form state (Receivables)
    const [rClient, setRClient] = useState('');
    const [rAmount, setRAmount] = useState('');
    const [rDate, setRDate] = useState('');

    // Form state (Payables)
    const [pVendor, setPVendor] = useState('');
    const [pAmount, setPAmount] = useState('');
    const [pDate, setPDate] = useState('');

    const INCOME_CATEGORIES = ['Sales', 'Services', 'Investment', 'Other'];
    const EXPENSE_CATEGORIES = ['Payroll', 'Software/SaaS', 'Marketing', 'Rent', 'Legal', 'Office Supplies', 'Other'];
    
    const [currency, setCurrency] = useState('INR');
    const exchangeRate = 83;

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchForecast(forecastRange);
    }, [forecastRange]);

    const fetchForecast = async (range) => {
        setForecastLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/analytics/cash-forecast?range=${range}`);
            setForecastData(res.data);
        } catch (err) {
            console.error('Forecast error', err);
        } finally {
            setForecastLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const [txRes, sumRes, expRes, recRes, payRes, runwayRes, leakageRes, healthRes] = await Promise.all([
                axios.get(`${API_URL}/api/transactions`),
                axios.get(`${API_URL}/api/analytics/dashboard-summary`),
                axios.get(`${API_URL}/api/analytics/expense-breakdown`),
                axios.get(`${API_URL}/api/receivables`),
                axios.get(`${API_URL}/api/payables`),
                axios.get(`${API_URL}/api/analytics/runway`),
                axios.get(`${API_URL}/api/analytics/leakage`),
                axios.get(`${API_URL}/api/analytics/health`)
            ]);
            
            setTransactions(txRes.data);
            setSummary(sumRes.data);
            setExpenseCategories(expRes.data);
            setReceivables(recRes.data);
            setPayables(payRes.data);
            setRunway(runwayRes.data);
            setLeakage(leakageRes.data);
            setHealthScore(healthRes.data);
            
            generateAlerts(sumRes.data, recRes.data, payRes.data);

        } catch (err) {
            console.error('Error fetching data', err);
        }
    };

    const isOverdue = (dateString, status) => {
        if (status !== 'pending') return false;
        return new Date(dateString) < new Date();
    };

    const generateAlerts = (metrics, recData, payData) => {
        const newAlerts = [];
        if (metrics.expenses > metrics.revenue && metrics.revenue > 0) {
            newAlerts.push({
                type: 'danger', icon: 'fa-triangle-exclamation',
                title: 'Negative Cash Flow Alert', message: 'Your expenses exceed your revenue for this month.'
            });
        }
        if (metrics.runway !== '∞' && parseFloat(metrics.runway) < 1.0 && metrics.netCash > 0) {
            newAlerts.push({
                type: 'danger', icon: 'fa-skull-crossbones',
                title: 'Critical Runway Alert', message: `You have less than 30 days of runway left.`
            });
        }
        if (metrics.profit < metrics.prevProfit && metrics.prevProfit > 0) {
            newAlerts.push({
                type: 'warning', icon: 'fa-chart-line-down',
                title: 'Profitability Warning', message: 'Your profit is lower than last month.'
            });
        }

        const overdueRec = recData.filter(r => isOverdue(r.due_date, r.status));
        if (overdueRec.length > 0) {
            const totalOverdue = overdueRec.reduce((sum, r) => sum + parseFloat(r.amount), 0);
            newAlerts.push({
                type: 'danger', icon: 'fa-hand-holding-dollar',
                title: 'Overdue Collections', message: `${formatMoney(totalOverdue)} is overdue — follow up immediately.`
            });
        }

        const overduePay = payData.filter(p => isOverdue(p.due_date, p.status));
        if (overduePay.length > 0) {
            const totalOverdue = overduePay.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            newAlerts.push({
                type: 'danger', icon: 'fa-file-invoice-dollar',
                title: 'Overdue Payments', message: `${formatMoney(totalOverdue)} payments overdue — risk of penalty.`
            });
        }

        setAlerts(newAlerts);
    };

    const formatMoney = (amt) => {
        let displayAmount = parseFloat(amt);
        let currencyCode = 'INR';
        if (currency === 'USD') {
            displayAmount = displayAmount / exchangeRate;
            currencyCode = 'USD';
        }
        return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency', currency: currencyCode
        }).format(displayAmount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();

        let submitAmount = parseFloat(amount);
        if (currency === 'USD') submitAmount = submitAmount * exchangeRate;
        try {
            await axios.post(`${API_URL}/api/transactions`, { type, amount: submitAmount, category, date });
            setAmount(''); fetchData();
        } catch (err) {}
    };

    const deleteTransaction = async (id) => {
        try { await axios.delete(`${API_URL}/api/transactions/${id}`); fetchData(); } catch (err) {}
    };

    const handleAddReceivable = async (e) => {
        e.preventDefault();

        let submitAmount = parseFloat(rAmount);
        if (currency === 'USD') submitAmount = submitAmount * exchangeRate;
        try {
            await axios.post(`${API_URL}/api/receivables`, { client_name: rClient, amount: submitAmount, due_date: rDate });
            setRClient(''); setRAmount(''); setRDate(''); fetchData();
        } catch (err) {}
    };
    
    const updateReceivableStatus = async (id) => {
        try { await axios.patch(`${API_URL}/api/receivables/${id}`, { status: 'received' }); fetchData(); } catch (err) {}
    };
    
    const deleteReceivable = async (id) => {
        try { await axios.delete(`${API_URL}/api/receivables/${id}`); fetchData(); } catch (err) {}
    };

    const handleAddPayable = async (e) => {
        e.preventDefault();

        let submitAmount = parseFloat(pAmount);
        if (currency === 'USD') submitAmount = submitAmount * exchangeRate;
        try {
            await axios.post(`${API_URL}/api/payables`, { vendor_name: pVendor, amount: submitAmount, due_date: pDate });
            setPVendor(''); setPAmount(''); setPDate(''); fetchData();
        } catch (err) {}
    };
    
    const updatePayableStatus = async (id) => {
        try { await axios.patch(`${API_URL}/api/payables/${id}`, { status: 'paid' }); fetchData(); } catch (err) {}
    };
    
    const deletePayable = async (id) => {
        try { await axios.delete(`${API_URL}/api/payables/${id}`); fetchData(); } catch (err) {}
    };

    const diff = summary.profit - summary.prevProfit;
    const diffClass = diff > 0 ? 'text-success' : (diff < 0 ? 'text-danger' : 'text-neutral');
    const profitInsight = summary.profit > 0 ? 'Your business is profitable this month' : (summary.profit < 0 ? 'Your expenses are higher than revenue' : 'Revenue and expenses are perfectly balanced');

    // ─── CFO Insights Helpers ───────────────────────────
    const getRunwayColor = (status) => {
        if (!status) return 'var(--text-muted)';
        if (status === 'healthy') return 'var(--success-color)';
        if (status === 'warning') return 'var(--warning-color)';
        return 'var(--danger-color)';
    };

    const getScoreColor = (score) => {
        if (score >= 7) return 'var(--success-color)';
        if (score >= 4) return 'var(--warning-color)';
        return 'var(--danger-color)';
    };

    const getScoreBg = (score) => {
        if (score >= 7) return 'var(--success-bg)';
        if (score >= 4) return 'var(--warning-bg)';
        return 'var(--danger-bg)';
    };

    const formatForecastDate = (dateStr) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div id="dashboard-view" style={{ display: 'block' }}>
            <header className="header">
                <div className="header-container">
                    <div className="logo">
                        <img src="/asimplylogo.png" alt="Asimply Logo" style={{ height: '40px', width: 'auto' }} />
                    </div>
                    <div style={{ marginRight: 'auto' }}>
                        <p className="tagline" style={{ borderLeft: 'none', paddingLeft: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', margin: 0 }}>Welcome, {user?.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Your financial overview</p>
                    </div>
                    <div className="currency-toggle" style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn-toggle-currency" onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}>
                            Currency: {currency}
                        </button>
                        <button onClick={logout} className="btn-text text-danger">Logout</button>
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <main className="main-content">
                    <AIInsights />

                    {/* ══════════════════════════════════════════════ */}
                    {/* CFO INSIGHTS SECTION */}
                    {/* ══════════════════════════════════════════════ */}
                    {/* 🔴 SECTION 1: ATTENTION NEEDED (TOP PRIORITY) */}
                    <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
                        <h2 className="section-title-large" style={{ color: 'var(--danger-color)', borderBottomColor: 'var(--danger-bg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> Attention Needed
                        </h2>
                        
                        <div className="alerts-priority-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* 1. Cash Forecast Risk (Dominant) */}
                            {forecastData?.summary.risk && (
                                <div className="cf-risk-alert" style={{ margin: 0, background: 'var(--danger-bg)', border: 'none', boxShadow: '0 4px 15px rgba(255,82,82,0.1)', padding: '1.25rem' }}>
                                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '1.5rem', color: 'var(--danger-color)' }}></i>
                                    <div>
                                        <strong style={{ fontSize: '1.1rem', color: 'var(--danger-color)', display: 'block', marginBottom: '4px' }}>Future Cash Shortage Detected</strong>
                                        <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>You are projected to run out of cash on <strong>{formatForecastDate(forecastData.summary.risk_date)}</strong>.</span>
                                    </div>
                                </div>
                            )}

                            {/* 2. Critical Runway Alert & Other Dangers */}
                            {alerts.filter(a => a.type === 'danger').map((alert, i) => (
                                <div key={i} className="alert-box alert-danger" style={{ margin: 0, border: 'none', boxShadow: '0 4px 15px rgba(255,82,82,0.05)' }}>
                                    <div className="alert-icon"><i className={`fa-solid ${alert.icon}`}></i></div>
                                    <div className="alert-content">
                                        <h4 style={{ margin: '0 0 4px 0' }}>{alert.title}</h4>
                                        <p style={{ margin: 0 }}>{alert.message}</p>
                                    </div>
                                </div>
                            ))}

                            {/* 3. Profit Leakage Detected */}
                            {leakage.length > 0 && (
                                <div className="cfo-leakage-section" style={{ background: 'var(--warning-bg)', border: 'none', boxShadow: '0 4px 15px rgba(255,159,28,0.08)', borderRadius: '12px' }}>
                                    <div className="cfo-leakage-header" style={{ background: 'rgba(255,159,28,0.05)', borderBottom: '1px solid rgba(255,159,28,0.1)' }}>
                                        <i className="fa-solid fa-magnifying-glass-chart" style={{ color: 'var(--warning-color)' }}></i>
                                        <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>Profit Leakage Warning</span>
                                        <span className="cfo-leakage-count" style={{ background: 'var(--warning-color)' }}>{leakage.length} spikes</span>
                                    </div>
                                    <div className="cfo-leakage-list">
                                        {leakage.slice(0, 2).map((spike, i) => (
                                            <div key={i} className="cfo-leakage-item" style={{ borderBottomColor: 'rgba(255,159,28,0.05)' }}>
                                                <div className="cfo-leakage-body">
                                                    <span className="cfo-leakage-msg" style={{ fontSize: '0.9rem' }}>{spike.message}</span>
                                                </div>
                                                <div className="cfo-leakage-badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>+{spike.increase_percent}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Default state if nothing needs attention */}
                            {!forecastData?.summary.risk && alerts.filter(a => a.type === 'danger').length === 0 && leakage.length === 0 && (
                                <div className="alert-box" style={{ background: 'var(--success-bg)', border: 'none', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '12px', padding: '1.25rem' }}>
                                    <i className="fa-solid fa-circle-check" style={{ fontSize: '1.25rem' }}></i>
                                    <span style={{ fontWeight: '600' }}>Everything looks good! No immediate risks detected.</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 📊 SECTION 2: YOUR BUSINESS TODAY */}
                    <section className="dashboard-section" style={{ marginBottom: '4rem' }}>
                        <h2 className="section-title-large" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-chart-line" style={{ color: 'var(--primary-color)' }}></i> Your Business Today
                        </h2>
                        <div className="grid cards-3">
                            
                            {/* 1. Financial Health Score */}
                            <div className="card metric-card highlight-card" style={{ borderTop: `4px solid ${healthScore ? getScoreColor(healthScore.score) : 'var(--primary-color)'}` }}>
                                <div className="card-header">
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Health Score</h3>
                                    <div className="card-icon" style={{ background: healthScore ? getScoreBg(healthScore.score) : 'var(--bg-color)', color: healthScore ? getScoreColor(healthScore.score) : 'var(--text-muted)' }}>
                                        <i className="fa-solid fa-heart-pulse"></i>
                                    </div>
                                </div>
                                {healthScore ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '0.5rem 0' }}>
                                            <p className="value" style={{ color: getScoreColor(healthScore.score), marginBottom: 0, fontSize: '2.5rem' }}>{healthScore.score}</p>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.1rem' }}>/10</span>
                                        </div>
                                        <p style={{ fontWeight: '700', color: getScoreColor(healthScore.score), margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{healthScore.status}</p>
                                        <p className="subtitle" style={{ margin: 0 }}>{healthScore.message}</p>
                                    </>
                                ) : <p className="subtitle">Calculating health...</p>}
                            </div>

                            {/* 2. Cash Flow Tracker (Net Cash + Runway) */}
                            <div className="card metric-card">
                                <div className="card-header">
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Flow Tracker</h3>
                                    <div className="card-icon bg-purple"><i className="fa-solid fa-vault"></i></div>
                                </div>
                                <p className="value" style={{ margin: '0.5rem 0', fontSize: '2rem' }}>{formatMoney(summary.netCash)}</p>
                                <div className="comparison-pill" style={{ background: 'var(--icon-purple-bg)', color: 'var(--icon-purple)', border: 'none', padding: '6px 12px', borderRadius: '20px' }}>
                                    Runway: <strong>{summary.runway === '∞' ? '∞' : `${summary.runway} Months`}</strong>
                                </div>
                                <p className="subtitle" style={{ marginTop: '0.75rem' }}>Total available liquidity</p>
                            </div>

                            {/* 3. Profit Snapshot */}
                            <div className="card metric-card">
                                <div className="card-header">
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit <span>(This Month)</span></h3>
                                    <div className="card-icon bg-green"><i className="fa-solid fa-scale-balanced"></i></div>
                                </div>
                                <p className={`value ${summary.profit >= 0 ? 'text-success' : 'text-danger'}`} style={{ margin: '0.5rem 0', fontSize: '2rem' }}>{formatMoney(summary.profit)}</p>
                                <div className="comparison-pill" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                                    vs Prev: <span className={diffClass} style={{ marginLeft: '4px', fontWeight: '700' }}>{diff > 0 ? '+' : ''}{formatMoney(diff)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Forecast Deep-Dive */}
                        <div className="cf-section" style={{ marginTop: '2rem', boxShadow: '0 4px 20px rgba(9, 30, 66, 0.04)' }}>
                            <div className="cf-header" style={{ padding: '1.25rem' }}>
                                <div className="cf-title-row">
                                    <div className="cf-title-left">
                                        <i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent-color)' }}></i>
                                        <span className="cf-title" style={{ fontSize: '1rem' }}>Detailed Cash Forecast</span>
                                    </div>
                                    <div className="cf-range-buttons">
                                        {[7, 15, 30].map(r => (
                                            <button key={r} className={`cf-range-btn ${forecastRange === r ? 'active' : ''}`} onClick={() => setForecastRange(r)}>{r}d</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {forecastData && (
                                <div className="cf-summary-grid" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                    <div className="cf-summary-pill"><span className="cf-pill-label">Incoming</span><span className="cf-pill-value text-success">+{formatMoney(forecastData.summary.total_incoming)}</span></div>
                                    <div className="cf-summary-pill"><span className="cf-pill-label">Outgoing</span><span className="cf-pill-value text-danger">-{formatMoney(forecastData.summary.total_outgoing)}</span></div>
                                    <div className="cf-summary-pill cf-pill-net" style={{ borderColor: 'var(--accent-color)' }}><span className="cf-pill-label">Net Projected</span><span className="cf-pill-value" style={{color: 'var(--accent-color)'}}>{formatMoney(forecastData.summary.net_projection)}</span></div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 💼 SECTION 3: MONEY CONTROL */}
                    <section className="dashboard-section" style={{ marginBottom: '4rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="section-title-large" style={{ borderBottom: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary-color)' }}></i> Manage Your Money
                            </h2>
                            <p className="subtitle" style={{ fontSize: '1rem', marginTop: '4px' }}>Active receivables and payables management</p>
                        </div>
                        <div className="grid layout-top-row" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* RECEIVABLES */}
                            <div className="card table-card" style={{ padding: '1.5rem' }}>
                                <div className="card-header-flex" style={{ marginBottom: '1.5rem' }}>
                                    <h2 className="card-title" style={{ color: 'var(--success-color)', fontSize: '1.1rem' }}>Money to Receive</h2>
                                    <div className="comparison-pill" style={{ background: 'var(--success-bg)', color: 'var(--success-color)', border: 'none', padding: '6px 12px' }}>
                                        Total: <strong>{formatMoney(receivables.filter(r => r.status === 'pending').reduce((s, r) => s + parseFloat(r.amount), 0))}</strong>
                                    </div>
                                </div>
                                <div className="table-responsive" style={{ maxHeight: '350px' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Client</th><th>Due</th><th className="text-right">Amount</th><th className="text-center">Action</th></tr></thead>
                                        <tbody>
                                            {receivables.map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.client_name}</td>
                                                    <td className={isOverdue(r.due_date, r.status) ? 'text-danger' : ''}>{formatDate(r.due_date)}</td>
                                                    <td className="text-right text-success" style={{ fontWeight: '700' }}>+{formatMoney(r.amount)}</td>
                                                    <td className="text-center">
                                                        {r.status === 'pending' && <button className="btn-text text-success" onClick={() => updateReceivableStatus(r.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deleteReceivable(r.id)}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAddReceivable} className="control-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', marginTop: '1.5rem', background: 'var(--bg-color)', padding: '12px', borderRadius: '12px' }}>
                                    <input type="text" placeholder="Client" value={rClient} onChange={e => setRClient(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <input type="number" placeholder="Amt" value={rAmount} onChange={e => setRAmount(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <button type="submit" className="btn-primary" style={{ margin: 0, padding: '8px 12px', width: 'auto' }}><i className="fa-solid fa-plus"></i></button>
                                </form>
                            </div>

                            {/* PAYABLES */}
                            <div className="card table-card" style={{ padding: '1.5rem' }}>
                                <div className="card-header-flex" style={{ marginBottom: '1.5rem' }}>
                                    <h2 className="card-title" style={{ color: 'var(--danger-color)', fontSize: '1.1rem' }}>Money to Pay</h2>
                                    <div className="comparison-pill" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)', border: 'none', padding: '6px 12px' }}>
                                        Total: <strong>{formatMoney(payables.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount), 0))}</strong>
                                    </div>
                                </div>
                                <div className="table-responsive" style={{ maxHeight: '350px' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Vendor</th><th>Due</th><th className="text-right">Amount</th><th className="text-center">Action</th></tr></thead>
                                        <tbody>
                                            {payables.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.vendor_name}</td>
                                                    <td className={isOverdue(p.due_date, p.status) ? 'text-danger' : ''}>{formatDate(p.due_date)}</td>
                                                    <td className="text-right text-danger" style={{ fontWeight: '700' }}>-{formatMoney(p.amount)}</td>
                                                    <td className="text-center">
                                                        {p.status === 'pending' && <button className="btn-text text-success" onClick={() => updatePayableStatus(p.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deletePayable(p.id)}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAddPayable} className="control-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', marginTop: '1.5rem', background: 'var(--bg-color)', padding: '12px', borderRadius: '12px' }}>
                                    <input type="text" placeholder="Vendor" value={pVendor} onChange={e => setPVendor(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <input type="number" placeholder="Amt" value={pAmount} onChange={e => setPAmount(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                    <button type="submit" className="btn-primary" style={{ margin: 0, padding: '8px 12px', width: 'auto' }}><i className="fa-solid fa-plus"></i></button>
                                </form>
                            </div>
                        </div>
                    </section>

                    {/* ⚙️ SECTION 4: ACTION AREA */}
                    <section className="dashboard-section" style={{ marginBottom: '6rem' }}>
                        <h2 className="section-title-large" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-circle-plus" style={{ color: 'var(--primary-color)' }}></i> Add & Track
                        </h2>
                        <div className="grid layout-top-row" style={{ gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
                            <div className="card" style={{ padding: '1.75rem' }}>
                                <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>New Transaction</h2>
                                <form onSubmit={handleAddTransaction}>
                                    <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <div className="type-toggle">
                                            <button type="button" className={`btn-toggle ${type === 'income' ? 'active' : ''}`} onClick={() => { setType('income'); setCategory('Sales'); }}>Income</button>
                                            <button type="button" className={`btn-toggle ${type === 'expense' ? 'active' : ''}`} onClick={() => { setType('expense'); setCategory('Payroll'); }}>Expense</button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <div className="input-with-icon"><span>{currency === 'INR' ? '₹' : '$'}</span><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)}>
                                            {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }}>Add {type === 'income' ? 'Income' : 'Expense'}</button>
                                </form>
                            </div>

                            <div className="card" style={{ padding: '1.75rem' }}>
                                <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Activity</h2>
                                <div className="table-responsive" style={{ maxHeight: '450px' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Date</th><th>Category</th><th className="text-right">Amount</th><th className="text-center">Action</th></tr></thead>
                                        <tbody>
                                            {transactions.slice(0, 15).map(t => (
                                                <tr key={t.id}>
                                                    <td>{formatDate(t.date)}</td>
                                                    <td><span className={`type-badge badge-${t.type}`} style={{ padding: '4px 10px', borderRadius: '12px' }}>{t.category}</span></td>
                                                    <td className={`text-right ${t.type === 'income' ? 'text-success' : ''}`} style={{ fontWeight: '700' }}>
                                                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                                    </td>
                                                    <td className="text-center"><button className="btn-delete" onClick={() => deleteTransaction(t.id)} style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-trash"></i></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>
            </div>
            <AIChatbot />
        </div>
    );
};

export default Dashboard;
