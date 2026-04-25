import { useNavigate } from 'react-router-dom';
import '../landing.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleCTA = () => navigate('/register');
    const handleLogin = () => navigate('/login');

    return (
        <div className="lp-root">

            {/* ── NAV ── */}
            <nav className="lp-nav" role="navigation" aria-label="Main navigation">
                <div className="lp-container lp-nav-inner">
                    <img src="/asimplylogo.png" alt="Asimply" className="lp-logo" />
                    <div className="lp-nav-actions">
                        <button
                            id="nav-login-btn"
                            className="lp-btn-ghost"
                            onClick={handleLogin}
                        >
                            Login
                        </button>
                        <button
                            id="nav-cta-btn"
                            className="lp-btn-primary"
                            onClick={handleCTA}
                        >
                            Start Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="lp-hero" aria-label="Hero section">
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
                                id="hero-primary-cta"
                                className="lp-btn-primary lp-btn-lg"
                                onClick={handleCTA}
                            >
                                Start Free Workspace
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                            <button
                                id="hero-demo-cta"
                                className="lp-btn-outline lp-btn-lg"
                                onClick={handleLogin}
                            >
                                View Demo
                            </button>
                        </div>
                        <p className="lp-trust-line">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                            Built for business owners who want clarity, not complexity
                        </p>
                    </div>

                    {/* Right – Real Dashboard Preview */}
                    <div className="lp-hero-right">
                        <div className="lp-dashboard-card">
                            <div className="lp-mock-header">
                                <span className="lp-mock-dot red" aria-hidden="true" />
                                <span className="lp-mock-dot yellow" aria-hidden="true" />
                                <span className="lp-mock-dot green-dot" aria-hidden="true" />
                                <span className="lp-mock-title">Asimply Dashboard</span>
                                <span className="lp-mock-live-badge">● LIVE</span>
                            </div>

                            {/* Metric Cards */}
                            <div className="lp-mock-metrics">
                                <div className="lp-mock-metric">
                                    <span className="lp-mock-label">Net Profit</span>
                                    <span className="lp-mock-value">$12,450</span>
                                    <span className="lp-mock-tag lp-tag-green">▲ 18%</span>
                                </div>
                                <div className="lp-mock-metric">
                                    <span className="lp-mock-label">Cash Flow</span>
                                    <span className="lp-mock-value">$8,200</span>
                                    <span className="lp-mock-tag lp-tag-blue">Healthy</span>
                                </div>
                                <div className="lp-mock-metric">
                                    <span className="lp-mock-label">Pending</span>
                                    <span className="lp-mock-value">$3,100</span>
                                    <span className="lp-mock-tag lp-tag-orange">2 due</span>
                                </div>
                            </div>

                            {/* Mini Bar Chart */}
                            <div className="lp-mock-chart">
                                <span className="lp-mock-chart-label">Monthly Revenue</span>
                                <div className="lp-bars">
                                    {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                                        <div key={i} className="lp-bar-wrap">
                                            <div
                                                className="lp-bar"
                                                style={{ height: `${h}%` }}
                                                aria-hidden="true"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Transaction Table */}
                            <div className="lp-mock-table">
                                <div className="lp-mock-row lp-mock-header-row">
                                    <span>Description</span>
                                    <span>Type</span>
                                    <span>Amount</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span className="lp-row-desc">Client Invoice #42</span>
                                    <span className="lp-tag-income">Income</span>
                                    <span className="lp-val-green">+$4,500</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span className="lp-row-desc">Office Supplies</span>
                                    <span className="lp-tag-expense">Expense</span>
                                    <span className="lp-val-red">-$320</span>
                                </div>
                                <div className="lp-mock-row">
                                    <span className="lp-row-desc">SaaS Revenue</span>
                                    <span className="lp-tag-income">Income</span>
                                    <span className="lp-val-green">+$2,100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST MICRO SECTION ── */}
            <section className="lp-trust" aria-label="Trust indicators">
                <div className="lp-container lp-trust-inner">
                    <div className="lp-trust-item">
                        <div className="lp-trust-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span>No accounting knowledge needed</span>
                    </div>
                    <div className="lp-trust-divider" aria-hidden="true" />
                    <div className="lp-trust-item">
                        <div className="lp-trust-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <span>Setup in under 2 minutes</span>
                    </div>
                    <div className="lp-trust-divider" aria-hidden="true" />
                    <div className="lp-trust-item">
                        <div className="lp-trust-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                        </div>
                        <span>Works on mobile</span>
                    </div>
                </div>
            </section>

            {/* ── WHAT YOU GET ── */}
            <section className="lp-features" id="features" aria-label="Features">
                <div className="lp-container">
                    <p className="lp-section-eyebrow">What you get</p>
                    <h2 className="lp-section-title">Everything you need.<br />Nothing you don't.</h2>
                    <div className="lp-features-grid">

                        <div className="lp-feature-card" id="feature-profit">
                            <div className="lp-feature-icon lp-icon-profit" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                            </div>
                            <h3 className="lp-feature-title">Profit Clarity</h3>
                            <p className="lp-feature-desc">See your exact profit instantly</p>
                        </div>

                        <div className="lp-feature-card" id="feature-cashflow">
                            <div className="lp-feature-icon lp-icon-cash" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <h3 className="lp-feature-title">Cash Flow Tracking</h3>
                            <p className="lp-feature-desc">Know where your money is coming and going</p>
                        </div>

                        <div className="lp-feature-card" id="feature-payments">
                            <div className="lp-feature-icon lp-icon-pending" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </div>
                            <h3 className="lp-feature-title">Pending Payments</h3>
                            <p className="lp-feature-desc">Track who owes you and what you owe</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="lp-how" id="how-it-works" aria-label="How it works">
                <div className="lp-container">
                    <p className="lp-section-eyebrow">How it works</p>
                    <h2 className="lp-section-title">Up and running in minutes.</h2>
                    <div className="lp-steps">

                        <div className="lp-step">
                            <div className="lp-step-num" aria-hidden="true">1</div>
                            <div className="lp-step-content">
                                <h3>Add income &amp; expenses</h3>
                                <p>Log your transactions quickly with just a few taps.</p>
                            </div>
                        </div>

                        <div className="lp-step-connector" aria-hidden="true" />

                        <div className="lp-step">
                            <div className="lp-step-num" aria-hidden="true">2</div>
                            <div className="lp-step-content">
                                <h3>Track receivables &amp; payables</h3>
                                <p>See who owes you and what bills are coming.</p>
                            </div>
                        </div>

                        <div className="lp-step-connector" aria-hidden="true" />

                        <div className="lp-step">
                            <div className="lp-step-num" aria-hidden="true">3</div>
                            <div className="lp-step-content">
                                <h3>See your real profit instantly</h3>
                                <p>Your dashboard updates live — always accurate.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="lp-cta" aria-label="Call to action">
                <div className="lp-container lp-cta-inner">
                    <h2 className="lp-cta-headline">Stop guessing.<br />Start knowing.</h2>
                    <p className="lp-cta-sub">Takes less than 2 minutes</p>
                    <button
                        id="footer-cta-btn"
                        className="lp-btn-primary lp-btn-lg lp-btn-cta"
                        onClick={handleCTA}
                    >
                        Start Free Workspace
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer" role="contentinfo">
                <div className="lp-container lp-footer-inner">
                    <img src="/asimplylogo.png" alt="Asimply" className="lp-footer-logo" />
                    <p className="lp-footer-copy">© {new Date().getFullYear()} Asimply. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
