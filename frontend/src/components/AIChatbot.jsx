import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        setReply('');
        try {
            const res = await axios.post(`${API_URL}/api/ai/chat`, { message });
            setReply(res.data.reply);
        } catch (err) {
            setReply('Sorry, I could not process that request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-wrapper">
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <span>Asimply AI Assistant</span>
                        <button onClick={() => setIsOpen(false)} className="close-btn">&times;</button>
                    </div>
                    <div className="ai-chat-body">
                        {reply ? (
                            <div className="ai-message reply">{reply}</div>
                        ) : (
                            <div className="ai-placeholder">Ask me about your profit, expenses, or cash flow.</div>
                        )}
                        {loading && <div className="ai-loader">Thinking...</div>}
                    </div>
                    <form onSubmit={handleSend} className="ai-chat-footer">
                        <input 
                            type="text" 
                            placeholder="Type a question..." 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button type="submit" disabled={loading}>
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            )}
            <button className="ai-chat-toggle" onClick={() => setIsOpen(!isOpen)}>
                <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
            </button>
        </div>
    );
};

export default AIChatbot;
