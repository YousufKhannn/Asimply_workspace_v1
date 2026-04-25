import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!email || !password) {
            setError('Please fill in all fields.');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return false;
        }
        return true;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            const result = await login(email, password);
            // PaidRoute in App.jsx will redirect to /payment if not paid
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid email or password');
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-split-layout">
            <div className="auth-left">
                <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    <p style={{ color: '#E99B28', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Asimply</p>
                    <h1>Know where your<br />business money is going</h1>
                    <p>Track profit, expenses, and cash flow in one place. No complexity. Just clarity.</p>
                </div>
            </div>
            
            <div className="auth-right">
                <div className="auth-form-container">
                    <div style={{ marginBottom: '2rem' }}>
                        <img 
                            src="/asimplylogo.png" 
                            alt="Asimply" 
                            style={{ 
                                maxWidth: '160px', 
                                width: 'auto', 
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block'
                            }} 
                        />
                    </div>
                    <h2 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '700' }}>Welcome back</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Enter your details to access your workspace.</p>
                    
                    {error && <div className="alert-box alert-danger" style={{ marginBottom: '1.5rem', padding: '0.85rem' }}>{error}</div>}
                    
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Email</label>
                            <input 
                                type="email" 
                                placeholder="name@company.com"
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0, color: 'var(--text-main)' }}>Password</label>
                                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</a>
                            </div>
                            <div className="password-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', height: '48px', fontSize: '1rem' }} disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    
                    <div className="auth-footer-link">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
