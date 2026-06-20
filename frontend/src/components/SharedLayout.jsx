import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Grid, Coffee, Navigation, LogOut, FileText } from 'lucide-react';

const SharedLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Define sidebar links based on role
  const getNavLinks = () => {
    if (currentRole === 'Admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/floor', label: 'Floor Plan', icon: <Grid size={20} /> },
        { path: '/kds', label: 'KDS Monitor', icon: <Coffee size={20} /> },
        { path: '/servant', label: 'Servant Monitor', icon: <Navigation size={20} /> },
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="glass-card" style={{ width: '250px', margin: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-primary)' }}>Odoo Cafe</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{currentRole} Workspace</span>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navLinks.map(link => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-primary)',
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
          <button onClick={handleLogout} className="pill-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'white', color: 'var(--status-red)', border: '1px solid var(--status-red)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default SharedLayout;
