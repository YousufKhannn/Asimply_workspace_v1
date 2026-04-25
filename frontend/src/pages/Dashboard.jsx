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

    const TRIAL_LIMIT = 5;
    const isTrialExceeded = !user?.is_paid && (
        transactions.length >= TRIAL_LIMIT || 
        receivables.length > 0 || 
        payables.length > 0
    );
    
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

    const fetchData = async () => {
        try {
            const [txRes, sumRes, expRes, recRes, payRes] = await Promise.all([
                axios.get(`${API_URL}/api/transactions`),
                axios.get(`${API_URL}/api/analytics/dashboard-summary`),
                axios.get(`${API_URL}/api/analytics/expense-breakdown`),
                axios.get(`${API_URL}/api/receivables`),
                axios.get(`${API_URL}/api/payables`)
            ]);
            
            setTransactions(txRes.data);
            setSummary(sumRes.data);
            setExpenseCategories(expRes.data);
            setReceivables(recRes.data);
            setPayables(payRes.data);
            
            generateAlerts(sumRes.data, recRes.data, payRes.data);

            // Redirect if trial exceeded on load
            const exceededOnLoad = !user?.is_paid && (
                txRes.data.length >= TRIAL_LIMIT || 
                recRes.data.length > 0 || 
                payRes.data.length > 0
            );

            if (exceededOnLoad) {
                navigate('/payment');
            }
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
        
        if (isTrialExceeded) {
            navigate('/payment');
            return;
        }

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

        if (isTrialExceeded) {
            navigate('/payment');
            return;
        }

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

        if (isTrialExceeded) {
            navigate('/payment');
            return;
        }

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
