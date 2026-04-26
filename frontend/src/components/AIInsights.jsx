import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AIInsights = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/ai/insights`);
                setInsights(res.data.insights || []);
            } catch (err) {
                console.error('AI Insights error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) return (
        <div className="ai-insights-card loading">
            <div className="ai-glow-spinner"></div>
            <span>Generating AI Insights...</span>
        </div>
    );

    if (insights.length === 0) return (
        <div className="ai-insights-card">
            <div className="ai-header">
                <i className="fa-solid fa-sparkles ai-icon"></i>
                <h3>AI Strategic Insights</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing your data... check back soon for strategic tips.</p>
        </div>
    );

    return (
        <div className="ai-insights-card">
            <div className="ai-header">
                <i className="fa-solid fa-sparkles ai-icon"></i>
                <h3>AI Strategic Insights</h3>
            </div>
            <ul className="ai-list">
                {insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                ))}
            </ul>
        </div>
    );
};

export default AIInsights;
