import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header / Nav */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/asimplylogo.png" alt="Asimply" style={{ height: '48px' }} />
                </div>
                <Link to="/login" style={{
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                    Login
                </Link>
            </header>

            {/* Main Content (Centered) */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: '800',
                    lineHeight: '1.15',
                    marginBottom: '1.5rem',
                    letterSpacing: '-1px',
                    color: '#0f172a'
                }}>
                    Know where your business money is going
                </h1>
                
                <p style={{
                    fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                    color: '#64748b',
                    lineHeight: '1.6',
                    marginBottom: '3rem',
                    maxWidth: '600px'
                }}>
                    Track your cash, profit, and expenses in one place. No complexity. Just clarity.
                </p>
                
                <button 
                    onClick={() => navigate('/login')}
                    style={{
                        backgroundColor: '#E99B28', // Asimply accent
                        color: '#ffffff',
                        border: 'none',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s',
                        boxShadow: '0 4px 14px rgba(233, 155, 40, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d38b21'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E99B28'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Start Workspace
                </button>
            </main>
        </div>
    );
};

export default LandingPage;
