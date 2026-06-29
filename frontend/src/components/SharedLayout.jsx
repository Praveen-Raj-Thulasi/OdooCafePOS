import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Grid, Coffee, Navigation, LogOut, FileText, Utensils, Tag, Zap, Users } from 'lucide-react';
import VerificationAlerts from './VerificationAlerts';

const SharedLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = sessionStorage.getItem('userRole');

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    navigate('/login');
  };

  // Define sidebar links based on role
  const getNavLinks = () => {
    if (currentRole === 'Admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/employees', label: 'Employee Management', icon: <Users size={20} /> },
        { path: '/floor', label: 'Floor Plan', icon: <Grid size={20} /> },
        { path: '/kds', label: 'KDS Monitor', icon: <Coffee size={20} /> },
        { path: '/servant', label: 'Servant Monitor', icon: <Navigation size={20} /> },
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
        { path: '/menu-manager', label: 'Menu Management', icon: <Utensils size={20} /> },
        { path: '/marketing', label: 'Marketing', icon: <Tag size={20} /> },
      ];
    }
    if (currentRole === 'Cashier') {
      return [
        { path: '/floor', label: 'Floor Plan', icon: <Grid size={20} /> },
      ];
    }
    return []; // Kitchen and Servant don't get a sidebar, they just get their full screen views.
  };

  const navLinks = getNavLinks();

  // If role is Kitchen or Servant, don't show sidebar, just render full screen
  if (currentRole === 'Kitchen' || currentRole === 'Servant') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="responsive-layout">
      {/* Sidebar */}
      <aside className="glass-card" style={{ width: '250px', margin: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Cafinity
            <Coffee size={24} strokeWidth={2.5} />
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{currentRole} Workspace</span>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {navLinks.map(link => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? 'var(--card-bg)' : 'var(--text-primary)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                {link.icon}
                {link.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1.5rem 1rem' }}>
          <button onClick={handleLogout} className="pill-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--status-red)', border: '1px solid var(--status-red)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>

      {/* Global Verification Alerts */}
      <VerificationAlerts />
    </div>
  );
};

export default SharedLayout;
