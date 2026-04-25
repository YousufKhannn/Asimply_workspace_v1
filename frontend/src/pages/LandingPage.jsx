import { useNavigate } from 'react-router-dom';
import '../landing.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="lp-root">
            {/* ── NAV ── */}
            <nav className="lp-nav">
                <div className="lp-container lp-nav-inner">
                    <img src="/asimplylogo.png" alt="Asimply" className="lp-logo" />
                    <div className="lp-nav-actions">
                        <button
                            className="lp-btn-ghost"
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </button>
                        <button
                            className="lp-btn-primary"
                            onClick={() => navigate('/login')}
                        >
                            Start Workspace
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="lp-hero">
                <div className="lp-container lp-hero-inner">
                    {/* Left */}
                    <div className="lp-hero-left">
                        <span className="lp-badge">Financial clarity for business owners</span>
                        <h1 className="lp-hero-headline">
                            Know where your<br />
                            <span className="lp-accent-text">business money</span> is going
                        </h1>
                        <p className="lp-hero-sub">
                            Track profit, expenses, cash flow, and pending payments in one simple dashboard.
                        </p>
                        <div className="lp-hero-cta">
                            <button
                                className="lp-btn-primary lp-btn-lg"
                                onClick={() => navigate('/login')}
                            >
                                Start Workspace
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                            <button
                                className="lp-btn-outline lp-btn-lg"
                                onClick={() => navigate('/login')}
                            >
                                View Demo
                            </button>
                        </div>
                    </div>

                    {/* Right – Dashboard Preview */}
                    <div className="lp-hero-right">
                        <div className="lp-dashboard-card">
                            {/* Mini dashboard mockup */}
                            <div className="lp-mock-header">
                                <span className="lp-mock-dot red" />
                                <span className="lp-mock-dot yellow" />
                                <span className="lp-mock-dot green" />
                                <span className="lp-mock-title">Asimply Dashboard</span>
                            </div>
                            <div className="lp-mock-metrics">
                                <div className="lp-mock-metric lp-metric-profit">
                                    <span className="lp-mock-label">Net Profit</span>
                                    <span className="lp-mock-value">$12,450</span>
                                    <span className="lp-mock-tag green">+18%</span>
                                </div>
                                <div className="lp-mock-metric lp-metric-cashflow">
                                    <span className="lp-mock-label">Cash Flow</span>
                                    <span className="lp-mock-value">$8,200</span>
                                    <span className="lp-mock-tag blue">Healthy</span>
                                </div>
                                <div className="lp-mock-metric lp-metric-pending">
                                    <span className="lp-mock-label">Pending</span>
                                    <span className="lp-mock-value">$3,100</span>
                                    <span className="lp-mock-tag orange">2 due</span>
                                </div>
                            </div>
                            <div className="lp-mock-table">
                                <div className="lp-mock-row header">
                                    <span>Description</span>
                                    <span>Type</span>
                                    <span>Amount</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span>Client Invoice #42</span>
                                    <span className="lp-tag-income">Income</span>
                                    <span className="lp-val-green">+$4,500</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span>Office Supplies</span>
                                    <span className="lp-tag-expense">Expense</span>
                                    <span className="lp-val-red">-$320</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span>Freelancer Payment</span>
                                    <span className="lp-tag-expense">Expense</span>
                                    <span className="lp-val-red">-$1,200</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span>SaaS Revenue</span>
                                    <span className="lp-tag-income">Income</span>
                                    <span className="lp-val-green">+$2,100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST STRIP ── */}
            <section className="lp-trust">
                <div className="lp-container">
                    <p className="lp-trust-headline">Built for business owners who want clarity, not complexity</p>
                    <div className="lp-trust-pills">
                        <div className="lp-pill">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            No accounting knowledge needed
                        </div>
                        <div className="lp-pill">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Setup in 2 minutes
                        </div>
                        <div className="lp-pill">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                            Works on mobile
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="lp-features" id="features">
                <div className="lp-container">
                    <h2 className="lp-section-label">Features</h2>
                    <h3 className="lp-section-title">Everything you need.<br />Nothing you don't.</h3>
                    <div className="lp-features-grid">
                        <div className="lp-feature-card">
                            <div className="lp-feature-icon lp-icon-profit">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                            </div>
                            <h4 className="lp-feature-title">Profit Clarity</h4>
                            <p className="lp-feature-desc">See your exact profit instantly — no formulas, no spreadsheets.</p>
                        </div>
                        <div className="lp-feature-card">
                            <div className="lp-feature-icon lp-icon-cash">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <h4 className="lp-feature-title">Cash Flow Tracking</h4>
                            <p className="lp-feature-desc">Know where money is coming from and where it's going — in real time.</p>
                        </div>
                        <div className="lp-feature-card">
                            <div className="lp-feature-icon lp-icon-pending">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <h4 className="lp-feature-title">Pending Payments</h4>
                            <p className="lp-feature-desc">Track exactly who owes you and what you owe — never miss a payment.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="lp-how" id="how-it-works">
                <div className="lp-container">
                    <h2 className="lp-section-label">How It Works</h2>
                    <h3 className="lp-section-title">Up and running in minutes.</h3>
                    <div className="lp-steps">
                        <div className="lp-step">
                            <div className="lp-step-num">1</div>
                            <div className="lp-step-content">
                                <h4>Add income &amp; expenses</h4>
                                <p>Log your transactions quickly with just a few taps.</p>
                            </div>
                        </div>
                        <div className="lp-step-connector" />
                        <div className="lp-step">
                            <div className="lp-step-num">2</div>
                            <div className="lp-step-content">
                                <h4>Track receivables &amp; payables</h4>
                                <p>See who owes you and what bills are pending.</p>
                            </div>
                        </div>
                        <div className="lp-step-connector" />
                        <div className="lp-step">
                            <div className="lp-step-num">3</div>
                            <div className="lp-step-content">
                                <h4>Get instant financial clarity</h4>
                                <p>Your dashboard updates live — profit, flow, and alerts.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="lp-cta">
                <div className="lp-container lp-cta-inner">
                    <h2 className="lp-cta-headline">Stop guessing.<br />Start knowing.</h2>
                    <p className="lp-cta-sub">Takes less than 2 minutes to set up.</p>
                    <button
                        className="lp-btn-primary lp-btn-lg lp-btn-white"
                        onClick={() => navigate('/login')}
                    >
                        Start Workspace
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer-inner">
                    <img src="/asimplylogo.png" alt="Asimply" className="lp-footer-logo" />
                    <p className="lp-footer-copy">© {new Date().getFullYear()} Asimply. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
