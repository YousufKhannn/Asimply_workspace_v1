import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './PaymentWall.css';

const UPI_ID = '8296342059@ibl';
const UPI_LINK = 'upi://pay?pa=8296342059@ibl&pn=Asimply&am=20&cu=INR';
// We generate the QR via a free public API — no npm package needed
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(UPI_LINK)}&size=220x220&margin=12&format=png`;

const PaymentWall = () => {
    const { markPaid, API_URL } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyUPI = () => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handlePaid = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/payment/verify`);
            markPaid();
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1800);
        } catch (err) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="pw-root">
            <div className="pw-card">

                {/* Logo */}
                <img src="/asimplylogo.png" alt="Asimply" className="pw-logo" />

                {/* Header */}
                <h1 className="pw-title">Unlock Full Access</h1>
                <p className="pw-sub">One-time <strong>₹20</strong> to continue using Asimply</p>

                {/* Steps hint */}
                <div className="pw-steps-hint">
                    <span className="pw-step-pill">1. Scan QR</span>
                    <span className="pw-step-arrow">→</span>
                    <span className="pw-step-pill">2. Pay ₹20</span>
                    <span className="pw-step-arrow">→</span>
                    <span className="pw-step-pill">3. Click "I've Paid"</span>
                </div>

                {/* QR Code */}
                <div className="pw-qr-wrap">
                    <img
                        src={QR_URL}
                        alt="UPI QR Code — Scan to Pay ₹20"
                        className="pw-qr"
                        width={220}
                        height={220}
                    />
                    <p className="pw-qr-label">Scan to Pay ₹20</p>
                </div>

                {/* Divider */}
                <div className="pw-divider"><span>or pay manually</span></div>

                {/* Manual UPI */}
                <div className="pw-upi-box">
                    <div className="pw-upi-row">
                        <span className="pw-upi-label">UPI ID</span>
                        <span className="pw-upi-value">{UPI_ID}</span>
                    </div>
                    <div className="pw-upi-row">
                        <span className="pw-upi-label">Amount</span>
                        <span className="pw-upi-value pw-amount">₹20</span>
                    </div>
                    <button
                        id="copy-upi-btn"
                        className="pw-btn-copy"
                        onClick={handleCopyUPI}
                    >
                        {copied ? '✓ Copied!' : 'Copy UPI ID'}
                    </button>
                </div>

                {/* Error */}
                {error && <p className="pw-error">{error}</p>}

                {/* Success */}
                {success && (
                    <div className="pw-success">
                        <span className="pw-success-icon">✓</span>
                        Access unlocked successfully! Redirecting…
                    </div>
                )}

                {/* CTA */}
                {!success && (
                    <button
                        id="paid-btn"
                        className="pw-btn-paid"
                        onClick={handlePaid}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="pw-spinner" />
                        ) : (
                            "I've Paid"
                        )}
                    </button>
                )}

                <p className="pw-footnote">
                    Secure one-time payment · No subscription · No hidden charges
                </p>
            </div>
        </div>
    );
};

export default PaymentWall;
