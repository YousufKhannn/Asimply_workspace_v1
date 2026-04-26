import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
