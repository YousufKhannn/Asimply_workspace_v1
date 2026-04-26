import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CRMDashboard = () => {
    const { user } = useContext(AuthContext);

    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedLead, setSelectedLead] = useState(null);
    const [activities, setActivities] = useState([]);
    const [newActivity, setNewActivity] = useState({ note: '', next_follow_up_date: '' });

    // Form states
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', company_name: '', source: '' });
    
    const [showDealForm, setShowDealForm] = useState(false);
    const [newDeal, setNewDeal] = useState({ lead_id: '', name: '', value: '', stage: 'new', expected_close_date: '' });

    useEffect(() => {
        fetchCRMData();
    }, []);

    const fetchCRMData = async () => {
        setLoading(true);
        try {
            const [leadsRes, dealsRes, clientsRes] = await Promise.all([
                axios.get(`${API_URL}/api/crm/leads`),
                axios.get(`${API_URL}/api/crm/deals`),
                axios.get(`${API_URL}/api/crm/clients`)
            ]);
            setLeads(leadsRes.data);
            setDeals(dealsRes.data);
            setClients(clientsRes.data);
        } catch (err) {
            console.error('Error fetching CRM data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async (leadId) => {
        try {
            const res = await axios.get(`${API_URL}/api/crm/activities/${leadId}`);
            setActivities(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        fetchActivities(lead.id);
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/crm/leads`, newLead);
            setNewLead({ name: '', phone: '', email: '', company_name: '', source: '' });
            setShowLeadForm(false);
            fetchCRMData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDeal = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/crm/deals`, newDeal);
            setNewDeal({ lead_id: '', name: '', value: '', stage: 'new', expected_close_date: '' });
            setShowDealForm(false);
            fetchCRMData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/crm/activities`, { ...newActivity, lead_id: selectedLead.id });
            setNewActivity({ note: '', next_follow_up_date: '' });
            fetchActivities(selectedLead.id);
        } catch (err) {
            console.error(err);
        }
    };

    const updateDealStage = async (dealId, newStage) => {
        try {
            await axios.put(`${API_URL}/api/crm/deals/${dealId}`, { stage: newStage });
            fetchCRMData();
        } catch (err) {
            console.error(err);
        }
    };

    const STAGES = ['new', 'contacted', 'interested', 'closed'];

    const formatMoney = (amt) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR'
        }).format(amt);
    };

    if (loading) return <div className="loader-view"><div className="spinner"></div><p>Loading CRM...</p></div>;

    return (
        <div className="dashboard-content">
            <header className="content-header">
                <div className="header-info">
                    <h1>CRM Dashboard</h1>
                    <p>Manage your pipeline and grow your business</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setShowLeadForm(true)} style={{ width: 'auto', padding: '0.6rem 1.2rem' }}>
                        <i className="fa-solid fa-user-plus"></i> New Lead
                    </button>
                    <button className="btn-primary" onClick={() => setShowDealForm(true)} style={{ width: 'auto', padding: '0.6rem 1.2rem', background: 'var(--primary-color)' }}>
                        <i className="fa-solid fa-file-invoice-dollar"></i> New Deal
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                {/* Section 1: Overview */}
                <section className="dashboard-section">
                    <div className="grid cards-3">
                        <div className="card metric-card">
                            <div className="card-header">
                                <h3>Total Leads</h3>
                                <div className="card-icon bg-blue"><i className="fa-solid fa-users"></i></div>
                            </div>
                            <p className="value">{leads.length}</p>
                            <p className="subtitle">Potential customers</p>
                        </div>
                        <div className="card metric-card">
                            <div className="card-header">
                                <h3>Active Deals</h3>
                                <div className="card-icon bg-orange"><i className="fa-solid fa-briefcase"></i></div>
                            </div>
                            <p className="value">{deals.filter(d => d.stage !== 'closed').length}</p>
                            <p className="subtitle">In pipeline</p>
                        </div>
                        <div className="card metric-card highlight-card">
                            <div className="card-header">
                                <h3>Closed Deals Value</h3>
                                <div className="card-icon bg-green"><i className="fa-solid fa-check-double"></i></div>
                            </div>
                            <p className="value text-success">
                                {formatMoney(deals.filter(d => d.stage === 'closed').reduce((sum, d) => sum + parseFloat(d.value), 0))}
                            </p>
                            <p className="subtitle">Revenue generated</p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Pipeline (Kanban) */}
                <section className="dashboard-section">
                    <h2 className="section-title-large">
                        <i className="fa-solid fa-layer-group"></i> Sales Pipeline
                    </h2>
                    <div className="kanban-board">
                        {STAGES.map(stage => (
                            <div key={stage} className="kanban-column">
                                <div className="kanban-header">
                                    <h3 style={{ color: stage === 'closed' ? 'var(--success-color)' : 'inherit' }}>{stage}</h3>
                                    <span className="column-count">{deals.filter(d => d.stage === stage).length}</span>
                                </div>
                                <div className="kanban-cards">
                                    {deals.filter(d => d.stage === stage).map(deal => (
                                        <div key={deal.id} className="deal-card">
                                            <h4>{deal.name}</h4>
                                            <p className="subtitle">{deal.lead_name}</p>
                                            <div className="deal-meta">
                                                <span className="deal-value">{formatMoney(deal.value)}</span>
                                                <div className="deal-actions">
                                                    {stage !== 'closed' && (
                                                        <select 
                                                            onChange={(e) => updateDealStage(deal.id, e.target.value)}
                                                            value={stage}
                                                            style={{ padding: '4px', fontSize: '0.7rem' }}
                                                        >
                                                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: Leads & Clients Integrated */}
                <section className="dashboard-section">
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Leads Table */}
                        <div className="card table-card">
                            <h2 className="card-title">Recent Leads</h2>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead><tr><th>Name</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {leads.slice(0, 10).map(lead => (
                                            <tr key={lead.id} className={selectedLead?.id === lead.id ? 'active-row' : ''}>
                                                <td><strong>{lead.name}</strong><br/><small>{lead.company_name}</small></td>
                                                <td><span className={`type-badge status-${lead.status}`}>{lead.status}</span></td>
                                                <td><button className="btn-text" onClick={() => handleSelectLead(lead)}>Details</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Activities for selected lead */}
                        {selectedLead ? (
                            <div className="card table-card">
                                <h2 className="card-title">Activities: {selectedLead.name}</h2>
                                <div className="activities-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                                    {activities.map(act => (
                                        <div key={act.id} className="activity-item" style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: 0 }}>{act.note}</p>
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                {new Date(act.created_at).toLocaleDateString()} 
                                                {act.next_follow_up_date && ` | Follow-up: ${new Date(act.next_follow_up_date).toLocaleDateString()}`}
                                            </small>
                                        </div>
                                    ))}
                                    {activities.length === 0 && <p className="empty-state">No activities recorded yet.</p>}
                                </div>
                                <form onSubmit={handleAddActivity} className="control-form">
                                    <input type="text" placeholder="Add a note..." value={newActivity.note} onChange={e => setNewActivity({...newActivity, note: e.target.value})} required />
                                    <input type="date" value={newActivity.next_follow_up_date} onChange={e => setNewActivity({...newActivity, next_follow_up_date: e.target.value})} />
                                    <button type="submit" className="btn-primary" style={{margin: 0}}><i className="fa-solid fa-paper-plane"></i></button>
                                </form>
                            </div>
                        ) : (
                            <div className="card table-card highlight-card">
                                <h2 className="card-title" style={{ color: 'var(--accent-color)' }}>
                                    <i className="fa-solid fa-gem"></i> Premium Clients (Finance Linked)
                                </h2>
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead><tr><th>Client</th><th className="text-right">Revenue</th><th className="text-right">Pending</th></tr></thead>
                                        <tbody>
                                            {clients.map(client => (
                                                <tr key={client.id}>
                                                    <td><strong>{client.name}</strong></td>
                                                    <td className="text-right text-success">{formatMoney(client.total_revenue)}</td>
                                                    <td className="text-right text-danger">{formatMoney(client.pending_amount)}</td>
                                                </tr>
                                            ))}
                                            {clients.length === 0 && (
                                                <tr><td colSpan="3" className="text-center subtitle">No clients yet. Close a deal to see them here!</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Modals / Forms */}
            {showLeadForm && (
                <div className="modal-overlay" onClick={() => setShowLeadForm(false)}>
                    <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', margin: 'auto' }}>
                        <h2>Add New Lead</h2>
                        <form onSubmit={handleAddLead}>
                            <div className="form-group"><label>Name</label><input type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} required /></div>
                            <div className="form-group"><label>Company</label><input type="text" value={newLead.company_name} onChange={e => setNewLead({...newLead, company_name: e.target.value})} /></div>
                            <div className="form-group"><label>Email</label><input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} /></div>
                            <div className="form-group"><label>Phone</label><input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} /></div>
                            <div className="form-group"><label>Source</label><input type="text" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} /></div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn-primary">Create Lead</button>
                                <button type="button" className="btn-toggle" onClick={() => setShowLeadForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDealForm && (
                <div className="modal-overlay" onClick={() => setShowDealForm(false)}>
                    <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', margin: 'auto' }}>
                        <h2>Add New Deal</h2>
                        <form onSubmit={handleAddDeal}>
                            <div className="form-group">
                                <label>Lead</label>
                                <select value={newDeal.lead_id} onChange={e => setNewDeal({...newDeal, lead_id: e.target.value})} required>
                                    <option value="">Select a lead</option>
                                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company_name})</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Deal Name</label><input type="text" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} required /></div>
                            <div className="form-group"><label>Value (INR)</label><input type="number" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})} required /></div>
                            <div className="form-group"><label>Expected Close</label><input type="date" value={newDeal.expected_close_date} onChange={e => setNewDeal({...newDeal, expected_close_date: e.target.value})} /></div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn-primary">Create Deal</button>
                                <button type="button" className="btn-toggle" onClick={() => setShowDealForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    z-index: 2000;
                    padding: 2rem;
                }
                .content-header {
                    padding: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    border-bottom: 1px solid var(--border-color);
                }
                .status-new { background: var(--icon-blue-bg); color: var(--icon-blue); }
                .status-contacted { background: var(--icon-purple-bg); color: var(--icon-purple); }
                .status-interested { background: var(--icon-orange-bg); color: var(--icon-orange); }
                .status-closed { background: var(--success-bg); color: var(--success-color); }
                .active-row { background: var(--bg-color); }
            `}</style>
        </div>
    );
};

export default CRMDashboard;
