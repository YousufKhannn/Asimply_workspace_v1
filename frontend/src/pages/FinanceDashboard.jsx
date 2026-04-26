import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import AIInsights from '../components/AIInsights';
import AIChatbot from '../components/AIChatbot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FinanceDashboard = () => {
    const { user } = useContext(AuthContext);

    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        revenue: 0, expenses: 0, profit: 0, prevProfit: 0, netCash: 0, burnRate: 0, runway: '0'
    });
    const [expenseCategories, setExpenseCategories] = useState([]);
    
    const [receivables, setReceivables] = useState([]);
    const [payables, setPayables] = useState([]);
    const [clients, setClients] = useState([]);

    // CFO Insights state
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
    const [rClientId, setRClientId] = useState('');
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
            const [txRes, sumRes, expRes, recRes, payRes, leakageRes, healthRes, clientsRes] = await Promise.all([
                axios.get(`${API_URL}/api/transactions`),
                axios.get(`${API_URL}/api/analytics/dashboard-summary`),
                axios.get(`${API_URL}/api/analytics/expense-breakdown`),
                axios.get(`${API_URL}/api/receivables`),
                axios.get(`${API_URL}/api/payables`),
                axios.get(`${API_URL}/api/analytics/leakage`),
                axios.get(`${API_URL}/api/analytics/health`),
                axios.get(`${API_URL}/api/crm/clients`)
            ]);
            
            setTransactions(txRes.data);
            setSummary(sumRes.data);
            setExpenseCategories(expRes.data);
            setReceivables(recRes.data);
            setPayables(payRes.data);
            setLeakage(leakageRes.data);
            setHealthScore(healthRes.data);
            setClients(clientsRes.data);
            
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
            await axios.post(`${API_URL}/api/receivables`, { 
                client_name: rClient, 
                amount: submitAmount, 
                due_date: rDate,
                client_id: rClientId || null
            });
            setRClient(''); setRAmount(''); setRDate(''); setRClientId(''); fetchData();
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
        <div className="dashboard-content">
            <header className="content-header">
                <div className="header-info">
                    <h1>Finance Dashboard</h1>
                    <p>Welcome back, {user?.name}</p>
                </div>
                <div className="header-actions">
                    <button className="btn-toggle-currency" onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}>
                        Currency: {currency}
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                <main className="main-content">
                    <AIInsights />

                    {/* Attention Needed */}
                    <section className="dashboard-section">
                        <h2 className="section-title-large" style={{ color: 'var(--danger-color)' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> Attention Needed
                        </h2>
                        
                        <div className="alerts-priority-grid">
                            {forecastData?.summary.risk && (
                                <div className="cf-risk-alert">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    <div>
                                        <strong>Future Cash Shortage Detected</strong>
                                        <span>You are projected to run out of cash on <strong>{formatForecastDate(forecastData.summary.risk_date)}</strong>.</span>
                                    </div>
                                </div>
                            )}

                            {alerts.filter(a => a.type === 'danger').map((alert, i) => (
                                <div key={i} className="alert-box alert-danger">
                                    <div className="alert-icon"><i className={`fa-solid ${alert.icon}`}></i></div>
                                    <div className="alert-content">
                                        <h4>{alert.title}</h4>
                                        <p>{alert.message}</p>
                                    </div>
                                </div>
                            ))}

                            {leakage.length > 0 && (
                                <div className="cfo-leakage-section">
                                    <div className="cfo-leakage-header">
                                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                                        <span>Profit Leakage Warning</span>
                                        <span className="cfo-leakage-count">{leakage.length} spikes</span>
                                    </div>
                                    <div className="cfo-leakage-list">
                                        {leakage.slice(0, 2).map((spike, i) => (
                                            <div key={i} className="cfo-leakage-item">
                                                <div className="cfo-leakage-body">
                                                    <span className="cfo-leakage-msg">{spike.message}</span>
                                                </div>
                                                <div className="cfo-leakage-badge">+{spike.increase_percent}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Metrics Today */}
                    <section className="dashboard-section">
                        <h2 className="section-title-large">
                            <i className="fa-solid fa-chart-line"></i> Your Business Today
                        </h2>
                        <div className="grid cards-3">
                            <div className="card metric-card highlight-card" style={{ borderTop: `4px solid ${healthScore ? getScoreColor(healthScore.score) : 'var(--primary-color)'}` }}>
                                <div className="card-header">
                                    <h3>Financial Health Score</h3>
                                    <div className="card-icon" style={{ background: healthScore ? getScoreBg(healthScore.score) : 'var(--bg-color)', color: healthScore ? getScoreColor(healthScore.score) : 'var(--text-muted)' }}>
                                        <i className="fa-solid fa-heart-pulse"></i>
                                    </div>
                                </div>
                                {healthScore ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '0.5rem 0' }}>
                                            <p className="value" style={{ color: getScoreColor(healthScore.score), fontSize: '2.5rem' }}>{healthScore.score}</p>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>/10</span>
                                        </div>
                                        <p style={{ fontWeight: '700', color: getScoreColor(healthScore.score) }}>{healthScore.status}</p>
                                        <p className="subtitle">{healthScore.message}</p>
                                    </>
                                ) : <p className="subtitle">Calculating health...</p>}
                            </div>

                            <div className="card metric-card">
                                <div className="card-header">
                                    <h3>Cash Flow Tracker</h3>
                                    <div className="card-icon bg-purple"><i className="fa-solid fa-vault"></i></div>
                                </div>
                                <p className="value">{formatMoney(summary.netCash)}</p>
                                <div className="comparison-pill" style={{ background: 'var(--icon-purple-bg)', color: 'var(--icon-purple)' }}>
                                    Runway: <strong>{summary.runway === '∞' ? '∞' : `${summary.runway} Months`}</strong>
                                </div>
                                <p className="subtitle" style={{ marginTop: '0.75rem' }}>Total available liquidity</p>
                            </div>

                            <div className="card metric-card">
                                <div className="card-header">
                                    <h3>Net Profit</h3>
                                    <div className="card-icon bg-green"><i className="fa-solid fa-scale-balanced"></i></div>
                                </div>
                                <p className={`value ${summary.profit >= 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(summary.profit)}</p>
                                <div className="comparison-pill">
                                    vs Prev: <span className={diffClass}>{diff > 0 ? '+' : ''}{formatMoney(diff)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Manage Money */}
                    <section className="dashboard-section">
                        <h2 className="section-title-large">
                            <i className="fa-solid fa-briefcase"></i> Manage Your Money
                        </h2>
                        <div className="grid layout-top-row">
                            <div className="card table-card">
                                <div className="card-header-flex">
                                    <h2 className="card-title" style={{ color: 'var(--success-color)' }}>Money to Receive</h2>
                                </div>
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead><tr><th>Client</th><th>Due</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {receivables.map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.client_name}</td>
                                                    <td className={isOverdue(r.due_date, r.status) ? 'text-danger' : ''}>{formatDate(r.due_date)}</td>
                                                    <td className="text-right text-success">+{formatMoney(r.amount)}</td>
                                                    <td className="text-center">
                                                        {r.status === 'pending' && <button className="btn-text text-success" onClick={() => updateReceivableStatus(r.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deleteReceivable(r.id)}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAddReceivable} className="control-form" style={{marginTop: '1rem'}}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <select 
                                            value={rClientId} 
                                            onChange={e => {
                                                const id = e.target.value;
                                                setRClientId(id);
                                                if (id) {
                                                    const client = clients.find(c => c.id == id);
                                                    if (client) setRClient(client.name);
                                                }
                                            }}
                                            style={{ padding: '8px', fontSize: '0.8rem' }}
                                        >
                                            <option value="">Manual Entry</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {!rClientId && (
                                            <input type="text" placeholder="Client Name" value={rClient} onChange={e => setRClient(e.target.value)} required />
                                        )}
                                    </div>
                                    <input type="number" placeholder="Amt" value={rAmount} onChange={e => setRAmount(e.target.value)} required />
                                    <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} required />
                                    <button type="submit" className="btn-primary" style={{margin: 0}}><i className="fa-solid fa-plus"></i></button>
                                </form>
                            </div>

                            <div className="card table-card">
                                <div className="card-header-flex">
                                    <h2 className="card-title" style={{ color: 'var(--danger-color)' }}>Money to Pay</h2>
                                </div>
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead><tr><th>Vendor</th><th>Due</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {payables.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.vendor_name}</td>
                                                    <td className={isOverdue(p.due_date, p.status) ? 'text-danger' : ''}>{formatDate(p.due_date)}</td>
                                                    <td className="text-right text-danger">-{formatMoney(p.amount)}</td>
                                                    <td className="text-center">
                                                        {p.status === 'pending' && <button className="btn-text text-success" onClick={() => updatePayableStatus(p.id)}><i className="fa-solid fa-check"></i></button>}
                                                        <button className="btn-delete" onClick={() => deletePayable(p.id)}><i className="fa-solid fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <form onSubmit={handleAddPayable} className="control-form" style={{marginTop: '1rem'}}>
                                    <input type="text" placeholder="Vendor" value={pVendor} onChange={e => setPVendor(e.target.value)} required />
                                    <input type="number" placeholder="Amt" value={pAmount} onChange={e => setPAmount(e.target.value)} required />
                                    <input type="date" value={pDate} onChange={e => setPDate(e.target.value)} required />
                                    <button type="submit" className="btn-primary" style={{margin: 0}}><i className="fa-solid fa-plus"></i></button>
                                </form>
                            </div>
                        </div>
                    </section>

                    {/* Action Area */}
                    <section className="dashboard-section">
                        <h2 className="section-title-large">
                            <i className="fa-solid fa-circle-plus"></i> Add & Track
                        </h2>
                        <div className="grid layout-top-row">
                            <div className="card">
                                <h2 className="card-title">New Transaction</h2>
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
                                    <button type="submit" className="btn-primary">Add {type === 'income' ? 'Income' : 'Expense'}</button>
                                </form>
                            </div>

                            <div className="card">
                                <h2 className="card-title">Recent Activity</h2>
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead><tr><th>Date</th><th>Category</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {transactions.slice(0, 15).map(t => (
                                                <tr key={t.id}>
                                                    <td>{formatDate(t.date)}</td>
                                                    <td><span className={`type-badge badge-${t.type}`}>{t.category}</span></td>
                                                    <td className={`text-right ${t.type === 'income' ? 'text-success' : ''}`}>
                                                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                                    </td>
                                                    <td className="text-center"><button className="btn-delete" onClick={() => deleteTransaction(t.id)}><i className="fa-solid fa-trash"></i></button></td>
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

export default FinanceDashboard;
