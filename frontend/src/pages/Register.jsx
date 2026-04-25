import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div className="home-view" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="home-content" style={{ marginTop: 0, padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
                <img src="/asimplylogo.png" alt="Asimply Logo" className="home-logo" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Create an Account</h2>
                {error && <div className="alert-box alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}
                
                <form onSubmit={onSubmit} id="transaction-form" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Sign Up</button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
