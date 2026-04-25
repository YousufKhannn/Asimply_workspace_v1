import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            let token = localStorage.getItem('token');
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await axios.get(`${API_URL}/api/auth/profile`);
                    setUser(res.data);
                } catch (err) {
                    console.error(err);
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
    };

    const register = async (name, email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // Called after the user clicks "I've Paid" and backend confirms
    const markPaid = () => {
        setUser(prev => prev ? { ...prev, is_paid: true } : prev);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, markPaid, API_URL }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
