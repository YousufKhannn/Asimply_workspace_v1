import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

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
                        <p className="tagline" style={{ borderLeft: 'none', paddingLeft: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Welcome, {user?.name}</p>
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

                    {/* ══════════════════════════════════════════════ */}
                    {/* CFO INSIGHTS SECTION */}
                    {/* ══════════════════════════════════════════════ */}
                    <div className="cfo-insights-section">
                        <div className="cfo-section-header">
                            <div className="cfo-section-badge">
                                <i className="fa-solid fa-brain"></i>
                                CFO Insights
                            </div>
                            <p className="cfo-section-sub">Real-time intelligence for your business</p>
                        </div>

                        {/* Top Row: Health Score + Cash Runway */}
                        <div className="cfo-top-row">

                            {/* ── FINANCIAL HEALTH SCORE ── */}
                            <div className="cfo-card cfo-health-card" style={{
                                borderTop: `4px solid ${healthScore ? getScoreColor(healthScore.score) : 'var(--border-color)'}`
                            }}>
                                <div className="cfo-card-header">
                                    <div className="cfo-card-icon" style={{
                                        background: healthScore ? getScoreBg(healthScore.score) : 'var(--bg-color)',
                                        color: healthScore ? getScoreColor(healthScore.score) : 'var(--text-muted)'
                                    }}>
                                        <i className="fa-solid fa-heart-pulse"></i>
                                    </div>
                                    <span className="cfo-card-label">Financial Health</span>
                                </div>
                                {healthScore ? (
                                    <>
                                        <div className="cfo-score-display">
                                            <span className="cfo-score-number" style={{ color: getScoreColor(healthScore.score) }}>
                                                {healthScore.score}
                                            </span>
                                            <span className="cfo-score-denom">/10</span>
                                        </div>
                                        <div className="cfo-score-bar-wrap">
                                            <div className="cfo-score-bar-track">
                                                <div
                                                    className="cfo-score-bar-fill"
                                                    style={{
                                                        width: `${healthScore.score * 10}%`,
                                                        background: getScoreColor(healthScore.score)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <p className="cfo-card-status" style={{ color: getScoreColor(healthScore.score) }}>
                                            {healthScore.status}
                                        </p>
                                        <p className="cfo-card-message">{healthScore.message}</p>
                                        {healthScore.profit_margin !== undefined && (
                                            <p className="cfo-card-meta">Profit margin: <strong>{healthScore.profit_margin}%</strong></p>
                                        )}
                                    </>
                                ) : (
                                    <p className="cfo-empty">Add transactions to calculate your health score.</p>
                                )}
                            </div>

                            {/* ── CASH RUNWAY ── */}
                            <div className="cfo-card cfo-runway-card" style={{
                                borderTop: `4px solid ${runway ? getRunwayColor(runway.status) : 'var(--border-color)'}`
                            }}>
                                <div className="cfo-card-header">
                                    <div className="cfo-card-icon" style={{
                                        background: runway ? (runway.status === 'healthy' ? 'var(--success-bg)' : runway.status === 'warning' ? 'var(--warning-bg)' : 'var(--danger-bg)') : 'var(--bg-color)',
                                        color: runway ? getRunwayColor(runway.status) : 'var(--text-muted)'
                                    }}>
                                        <i className="fa-solid fa-plane-departure"></i>
                                    </div>
                                    <span className="cfo-card-label">Cash Runway</span>
                                </div>
                                {runway ? (
                                    <>
                                        <p className="cfo-runway-value" style={{ color: getRunwayColor(runway.status) }}>
                                            {runway.runway_months === null
                                                ? '∞'
                                                : runway.current_cash < 0
                                                ? 'At Risk'
                                                : `${runway.runway_months} mo`}
                                        </p>
                                        <p className="cfo-card-message">
                                            {runway.runway_months === null
                                                ? 'Infinite runway — no burn rate'
                                                : runway.current_cash < 0
                                                ? 'Cash balance is negative'
                                                : `You can operate for ${runway.runway_months} month${runway.runway_months !== 1 ? 's' : ''} at current burn`}
                                        </p>
                                        <div className="cfo-meta-row">
                                            <div className="cfo-meta-pill">
                                                <span>Cash</span>
                                                <strong>{formatMoney(runway.current_cash)}</strong>
                                            </div>
                                            <div className="cfo-meta-pill">
                                                <span>Burn/mo</span>
                                                <strong>{formatMoney(runway.monthly_burn)}</strong>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="cfo-empty">Add transactions to calculate runway.</p>
                                )}
                            </div>
                        </div>

                        {/* Bottom Row: Cash Forecast */}
                        <div className="cf-section">
                            <div className="cf-header">
                                <div className="cf-title-row">
                                    <div className="cf-title-left">
                                        <i className="fa-solid fa-calendar-days" style={{ color: 'var(--primary-color)' }}></i>
                                        <div>
                                            <span className="cf-title">Cash Forecast</span>
                                            <span className="cf-subtitle">Know your future cash position before problems happen</span>
                                        </div>
                                    </div>
                                    <div className="cf-range-buttons">
                                        {[7, 15, 30].map(r => (
                                            <button
                                                key={r}
                                                className={`cf-range-btn ${forecastRange === r ? 'active' : ''}`}
                                                onClick={() => setForecastRange(r)}
                                            >
                                                {r}d
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {forecastLoading ? (
                                <div className="cf-loading">
                                    <div className="spinner" style={{ width: '28px', height: '28px', marginBottom: 0, borderWidth: '3px' }}></div>
                                    <span>Calculating forecast…</span>
                                </div>
                            ) : forecastData ? (
                                <>
                                    {/* Risk Alert Banner */}
                                    {forecastData.summary.risk && (
                                        <div className="cf-risk-alert">
                                            <i className="fa-solid fa-circle-exclamation"></i>
                                            <div>
                                                <strong>Cash Shortage Warning</strong>
                                                <span>You may run out of cash on <strong>{formatForecastDate(forecastData.summary.risk_date)}</strong> — take action now.</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary Pills */}
                                    <div className="cf-summary-grid">
                                        <div className="cf-summary-pill">
                                            <span className="cf-pill-label">Current Cash</span>
                                            <span className="cf-pill-value" style={{ color: forecastData.summary.current_cash >= 0 ? 'var(--text-main)' : 'var(--danger-color)' }}>
                                                {formatMoney(forecastData.summary.current_cash)}
                                            </span>
                                        </div>
                                        <div className="cf-summary-pill cf-pill-in">
                                            <span className="cf-pill-label">Incoming ({forecastRange}d)</span>
                                            <span className="cf-pill-value" style={{ color: 'var(--success-color)' }}>
                                                +{formatMoney(forecastData.summary.total_incoming)}
                                            </span>
                                        </div>
                                        <div className="cf-summary-pill cf-pill-out">
                                            <span className="cf-pill-label">Outgoing ({forecastRange}d)</span>
                                            <span className="cf-pill-value" style={{ color: 'var(--danger-color)' }}>
                                                -{formatMoney(forecastData.summary.total_outgoing)}
                                            </span>
                                        </div>
                                        <div className="cf-summary-pill cf-pill-net">
                                            <span className="cf-pill-label">Net Position</span>
                                            <span className="cf-pill-value" style={{
                                                color: forecastData.summary.net_projection >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                                                fontWeight: '800'
                                            }}>
                                                {forecastData.summary.net_projection >= 0 ? '+' : ''}{formatMoney(forecastData.summary.net_projection)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Day-by-day timeline — only show days with events OR risk crossover */}
                                    {(() => {
                                        const visible = forecastData.timeline.filter((day, i) => {
                                            const prev = i > 0 ? forecastData.timeline[i - 1].balance : forecastData.summary.current_cash;
                                            return day.balance !== prev || day.balance < 0;
                                        });
                                        if (visible.length === 0) {
                                            return (
                                                <p className="cf-no-events">No receivables or payables due in the next {forecastRange} days — cash balance stays stable.</p>
                                            );
                                        }
                                        return (
                                            <div className="cf-timeline">
                                                <div className="cf-timeline-header">
                                                    <span>Date</span>
                                                    <span>Event</span>
                                                    <span className="text-right">Projected Balance</span>
                                                </div>
                                                <div className="cf-timeline-body">
                                                    {forecastData.timeline.map((day, i) => {
                                                        const prev = i > 0 ? forecastData.timeline[i - 1].balance : forecastData.summary.current_cash;
                                                        const dayIn = day.balance - prev >= 0 ? day.balance - prev : 0;
                                                        const dayOut = prev - day.balance > 0 ? prev - day.balance : 0;
                                                        const changed = day.balance !== prev;
                                                        const isRisk = day.date === forecastData.summary.risk_date;
                                                        if (!changed && !isRisk) return null;
                                                        return (
                                                            <div key={day.date} className={`cf-timeline-row ${isRisk ? 'cf-row-risk' : ''}`}>
                                                                <span className="cf-row-date">{formatForecastDate(day.date)}</span>
                                                                <span className="cf-row-event">
                                                                    {dayIn > 0 && <span className="cf-event-in">+{formatMoney(dayIn)}</span>}
                                                                    {dayOut > 0 && <span className="cf-event-out">-{formatMoney(dayOut)}</span>}
                                                                </span>
                                                                <span className={`cf-row-balance ${day.balance < 0 ? 'cf-balance-negative' : 'cf-balance-positive'}`}>
                                                                    {formatMoney(day.balance)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                <p className="cf-no-events">Add transactions to see your cash forecast.</p>
                            )}
                        </div>

                        {/* Bottom Row: Leakage Alerts */}
                        {leakage.length > 0 && (
                            <div className="cfo-leakage-section">
                                <div className="cfo-leakage-header">
                                    <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--warning-color)' }}></i>
                                    <span>Profit Leakage Detected</span>
                                    <span className="cfo-leakage-count">{leakage.length} spike{leakage.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="cfo-leakage-list">
                                    {leakage.map((spike, i) => (
                                        <div key={i} className="cfo-leakage-item">
                                            <div className="cfo-leakage-icon">
                                                <i className="fa-solid fa-arrow-trend-up"></i>
                                            </div>
                                            <div className="cfo-leakage-body">
                                                <span className="cfo-leakage-msg">{spike.message}</span>
                                                <span className="cfo-leakage-sub">
                                                    This week: {formatMoney(spike.current_week)}
                                                    {spike.prev_week > 0 && ` vs last week: ${formatMoney(spike.prev_week)}`}
                                                </span>
                                            </div>
                                            <div className="cfo-leakage-badge">+{spike.increase_percent}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* END CFO INSIGHTS */}

                    {/* ALERTS SECTION (Always on top for visibility) */}
                    <div id="alerts-container" className="alerts-container">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`alert-box alert-${alert.type}`}>
                                <div className="alert-icon"><i className={`fa-solid ${alert.icon}`}></i></div>
                                <div className="alert-content">
                                    <h4>{alert.title}</h4>
                                    <p>{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SECTION 1: PRIMARY ACTION AREA */}
                    <div className="grid layout-top-row section" style={{ marginBottom: '3.5rem' }}>
                        <div className="card form-card">
                            <h2 className="card-title">Add Transaction</h2>
                            <form id="transaction-form" onSubmit={handleAddTransaction}>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <div className="type-toggle">
                                        <button type="button" className={`btn-toggle ${type === 'income' ? 'active' : ''}`} onClick={() => { setType('income'); setCategory('Sales'); }}>Income</button>
                                        <button type="button" className={`btn-toggle ${type === 'expense' ? 'active' : ''}`} onClick={() => { setType('expense'); setCategory('Payroll'); }}>Expense</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <div className="input-with-icon">
                                        <span id="currency-symbol-input">{currency === 'INR' ? '₹' : '$'}</span>
                                        <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} required>
                                        {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Add {type === 'income' ? 'Income' : 'Expense'}</button>
                            </form>
                        </div>

                        <div className="card table-card">
                            <div className="card-header-flex">
                                <h2 className="card-title">Recent Transactions</h2>
                            </div>
                            <div className="table-responsive scrollable-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Category</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.slice(0, 10).map(t => (
                                            <tr key={t.id}>
                                                <td>{formatDate(t.date)}</td>
                                                <td><span className={`type-badge badge-${t.type}`}>{t.type}</span></td>
                                                <td>{t.category}</td>
                                                <td className={`text-right ${t.type === 'income' ? 'text-success' : ''}`}>
                                                    {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                                </td>
                                                <td className="text-center">
                                                    <button className="btn-delete" onClick={() => deleteTransaction(t.id)}>
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>Start by adding your first transaction</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: FINANCIAL OVERVIEW */}
                    <div className="grid section" style={{ gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3.5rem' }}>
                        <section className="section cash-flow" style={{ marginBottom: 0 }}>
                            <h2 className="section-title" style={{ marginTop: 0 }}>Cash Flow Tracker</h2>
                            <div className="grid cards-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                <div className="card metric-card">
                                    <div className="card-header">
                                        <h3>Net Cash Balance</h3>
                                        <div className="card-icon bg-gray"><i className="fa-solid fa-vault"></i></div>
                                    </div>
                                    <p className="value">{formatMoney(summary.netCash)}</p>
                                    <p className="subtitle">Total all-time cash</p>
                                </div>
                                <div className="card metric-card">
                                    <div className="card-header">
                                        <h3>Runway</h3>
                                        <div className="card-icon bg-purple"><i className="fa-solid fa-plane-departure"></i></div>
                                    </div>
                                    <p className={`value ${summary.runway !== '∞' && parseFloat(summary.runway) < 3 ? 'text-danger' : 'text-success'}`}>{summary.runway === '∞' ? '∞' : `${summary.runway} Months`}</p>
                                    <p className="subtitle">Estimated cash runway</p>
                                </div>
                            </div>
                        </section>

                        <section className="section profit-snapshot" style={{ marginBottom: 0 }}>
                            <h2 className="section-title" style={{ marginTop: 0 }}>Profit Snapshot <span>(This Month)</span></h2>
                            <div className="grid cards-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                <div className="card metric-card">
                                    <div className="card-header">
                                        <h3>Total Revenue</h3>
                                        <div className="card-icon bg-blue"><i className="fa-solid fa-arrow-trend-up"></i></div>
                                    </div>
                                    <p className="value">{formatMoney(summary.revenue)}</p>
                                </div>
                                <div className="card metric-card highlight-card">
                                    <div className="card-header">
                                        <h3>Net Profit</h3>
                                        <div className="card-icon bg-green"><i className="fa-solid fa-scale-balanced"></i></div>
                                    </div>
                                    <p className={`value ${summary.profit >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(summary.profit)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        <div className="comparison-pill" style={{ margin: 0 }}>vs Prev: <span className={diffClass} style={{ marginLeft: '4px' }}>{diff > 0 ? '+' : ''}{formatMoney(diff)}</span></div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{profitInsight}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* SECTION 3: CASH CONTROL */}
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <h2 className="section-title section-title-large" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Money Flow Control</h2>
                        <p className="subtitle" style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>Track money coming in and going out</p>
                    </div>
                    <div className="grid layout-top-row section" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                        
                        {/* RECEIVABLES CARD */}
                        <div className="card table-card full-height-card">
                            <div className="card-header-flex" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 className="card-title" style={{ margin: 0, color: '#172B4D' }}>Money to Receive</h2>
                                    <p className="subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                                        Pending: <strong>{formatMoney(receivables.filter(r => r.status === 'pending').reduce((s, r) => s + parseFloat(r.amount), 0))}</strong> &nbsp;|&nbsp; 
                                        Overdue: <strong className="text-danger">{formatMoney(receivables.filter(r => isOverdue(r.due_date, r.status)).reduce((s, r) => s + parseFloat(r.amount), 0))}</strong>
                                    </p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleAddReceivable} className="control-form">
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Client Name</label>
                                    <input type="text" placeholder="e.g. Acme Corp" value={rClient} onChange={e => setRClient(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Amount</label>
                                    <input type="number" placeholder="0.00" value={rAmount} onChange={e => setRAmount(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Due Date</label>
                                    <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-primary" style={{ margin: 0, height: '48px', padding: '0 1.5rem' }}>Add</button>
                            </form>

                            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th>Due</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receivables.map(r => {
                                            const overdue = isOverdue(r.due_date, r.status);
                                            return (
                                                <tr key={r.id}>
                                                    <td>{r.client_name}</td>
                                                    <td className={overdue ? 'text-danger' : ''}>{formatDate(r.due_date)}</td>
                                                    <td className="text-right text-success">+{formatMoney(r.amount)}</td>
                                                    <td className="text-center">
                                                        {r.status === 'received' ? <span className="type-badge bg-green" style={{color: '#fff'}}>Received</span> : 
                                                         (overdue ? <span className="type-badge bg-red" style={{color: '#fff'}}>Overdue</span> : <span className="type-badge bg-gray">Pending</span>)}
                                                    </td>
                                                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                                        {r.status === 'pending' && <button className="btn-text text-success" onClick={() => updateReceivableStatus(r.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deleteReceivable(r.id)} style={{ marginLeft: '0.25rem' }}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {receivables.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No pending collections. Add a receivable to track incoming money.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* PAYABLES CARD */}
                        <div className="card table-card full-height-card">
                            <div className="card-header-flex" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 className="card-title" style={{ margin: 0, color: '#172B4D' }}>Money to Pay</h2>
                                    <p className="subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                                        Pending: <strong>{formatMoney(payables.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount), 0))}</strong> &nbsp;|&nbsp; 
                                        Overdue: <strong className="text-danger">{formatMoney(payables.filter(p => isOverdue(p.due_date, p.status)).reduce((s, p) => s + parseFloat(p.amount), 0))}</strong>
                                    </p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleAddPayable} className="control-form">
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Vendor Name</label>
                                    <input type="text" placeholder="e.g. AWS" value={pVendor} onChange={e => setPVendor(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Amount</label>
                                    <input type="number" placeholder="0.00" value={pAmount} onChange={e => setPAmount(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', fontWeight: '600' }}>Due Date</label>
                                    <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-primary" style={{ margin: 0, height: '48px', padding: '0 1.5rem' }}>Add</button>
                            </form>

                            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Vendor</th>
                                            <th>Due</th>
                                            <th className="text-right">Amount</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payables.map(p => {
                                            const overdue = isOverdue(p.due_date, p.status);
                                            return (
                                                <tr key={p.id}>
                                                    <td>{p.vendor_name}</td>
                                                    <td className={overdue ? 'text-danger' : ''}>{formatDate(p.due_date)}</td>
                                                    <td className="text-right text-danger">-{formatMoney(p.amount)}</td>
                                                    <td className="text-center">
                                                        {p.status === 'paid' ? <span className="type-badge bg-green" style={{color: '#fff'}}>Paid</span> : 
                                                         (overdue ? <span className="type-badge bg-red" style={{color: '#fff'}}>Overdue</span> : <span className="type-badge bg-gray">Pending</span>)}
                                                    </td>
                                                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                                                        {p.status === 'pending' && <button className="btn-text text-success" onClick={() => updatePayableStatus(p.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deletePayable(p.id)} style={{ marginLeft: '0.25rem' }}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {payables.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No pending payments. Add a payable to track outgoing money.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </main>
            </div>
        </div>
    );
};

export default Dashboard;
