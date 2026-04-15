import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Database, ShoppingCart, ArrowLeftRight, Crosshair, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const getNavItems = () => {
    const items = [
      { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/assets', icon: <Database size={20} />, label: 'Inventory Assets' },
      { to: '/purchases', icon: <ShoppingCart size={20} />, label: 'Purchases' },
      { to: '/transfers', icon: <ArrowLeftRight size={20} />, label: 'Transfers' },
      { to: '/assignments', icon: <Crosshair size={20} />, label: 'Assignments' },
    ];

    if (user?.role === 'admin') {
      items.push({ to: '/bases', icon: <Shield size={20} />, label: 'Base Management' });
    }

    return items;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Shield color="#f59e0b" size={28} />
          <span>M.A.M.S</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {getNavItems().map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="topbar">
      <div></div>
      <div className="user-info">
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {user?.base ? user.base.name : 'Central Command'}
          </div>
        </div>
        <div className="user-role-badge">
          {user?.role}
        </div>
        <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
};

const Layout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
