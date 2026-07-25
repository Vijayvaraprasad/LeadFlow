import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          ⚡ LeadFlow
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            👥 Leads
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              ⚙️ Users
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <h4>{user?.name || 'User'}</h4>
              <p>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-icon btn-ghost" title="Logout">
            🚪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
        
        <footer className="footer">
          <p>Built for Digital Heroes Training Task | <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">digitalheroesco.com</a></p>
        </footer>
      </main>
    </div>
  );
};
