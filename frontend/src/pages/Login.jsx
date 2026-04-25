import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
        }
    };

    return (
        <div className="home-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="home-content" style={{ marginTop: 0, padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
                <img src="/asimplylogo.png" alt="Asimply Logo" className="home-logo" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Sign In to Workspace</h2>
                {error && <div className="alert-box alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}
                
                <form onSubmit={onSubmit} id="transaction-form" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
