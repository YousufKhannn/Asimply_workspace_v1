import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useContext(AuthContext);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src="/asimplylogo.png" alt="Asimply" />
            </div>
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <p className="nav-section-title">Dashboard Switch</p>
                    <NavLink to="/dashboard/finance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-chart-pie"></i>
                        <span>Finance</span>
                    </NavLink>
                    <NavLink to="/dashboard/crm" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-users-rectangle"></i>
                        <span>CRM</span>
                    </NavLink>
                </div>

                <div className="nav-section" style={{ marginTop: 'auto' }}>
                    <button onClick={logout} className="nav-item logout-btn">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
