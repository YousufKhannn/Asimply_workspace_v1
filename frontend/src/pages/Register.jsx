import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const calculateStrength = (pass) => {
        if (pass.length === 0) return 0;
        if (pass.length < 6) return 33;
        if (pass.length < 10) return 66;
        return 100;
    };
    
    const strength = calculateStrength(password);
    const getStrengthColor = () => {
        if (strength === 33) return 'var(--danger-color)';
        if (strength === 66) return '#E99B28'; // Warning/Medium
        return 'var(--success-color)';
    };

    const validateForm = () => {
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
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
            await register(name, email, password);
            // Will land on dashboard; trial/payment logic handles the rest
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'User already exists or registration failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-split-layout">
            <div className="auth-left">
                <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    <p style={{ color: '#E99B28', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Asimply</p>
                    <h1>Start tracking your<br />business cash flow</h1>
                    <p>Join Asimply to gain instant clarity on your finances, monitor expenses, and predict your runway.</p>
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
                    <h2 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '700' }}>Create an Account</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Sign up to set up your workspace.</p>
                    
                    {error && <div className="alert-box alert-danger" style={{ marginBottom: '1.5rem', padding: '0.85rem' }}>{error}</div>}
                    
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Full Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. John Doe"
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                        </div>

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
                            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Password</label>
                            <div className="password-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Create a strong password"
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            
                            {password.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${strength}%`, height: '100%', backgroundColor: getStrengthColor(), transition: 'all 0.3s ease' }}></div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                                        {strength === 33 ? 'Weak' : (strength === 66 ? 'Medium' : 'Strong')}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', height: '48px', fontSize: '1rem' }} disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    
                    <div className="auth-footer-link">
                        Already have an account? <Link to="/login">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
