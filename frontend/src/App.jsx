import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import PaymentWall from './pages/PaymentWall';

// Requires login
const PrivateRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="loader-view" style={{display: 'flex'}}><div className="spinner"></div></div>;
    return user ? children : <Navigate to="/login" />;
};

// Already logged in & paid → skip payment wall
const PaymentRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="loader-view" style={{display: 'flex'}}><div className="spinner"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (user.is_paid) return <Navigate to="/dashboard" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/payment"
                        element={
                            <PaymentRoute>
                                <PaymentWall />
                            </PaymentRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
