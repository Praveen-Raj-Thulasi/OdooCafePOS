import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle, Navigation, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServantPortal = () => {
  const socket = useSocket();
  const { addNotification } = useNotification();
  
  const [activeDelivery, setActiveDelivery] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('kitchen_ready', (data) => {
      // For this hackathon demo, if we are AVAILABLE, we take the first 'kitchen_ready' ticket.
      setActiveDelivery(prev => {
        if (!prev) {
          addNotification(`New Delivery: Table ${data.tableNumber}`, 'info');
          return data;
        }
        return prev; // We are busy
      });
    });

    return () => {
      socket.off('kitchen_ready');
    };
  }, [socket, addNotification]);

  const markDelivered = async () => {
    if (!activeDelivery) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/orders/${activeDelivery._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'Served' })
      });

      if (response.ok) {
        addNotification(`Successfully delivered to Table ${activeDelivery.tableNumber}`, 'success');
        setActiveDelivery(null); // Back to AVAILABLE
      }
    } catch (error) {
      console.error('Error marking delivered:', error);
    }
  };

  return (
    <div style={{ height: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-card" style={{ padding: '1.5rem', margin: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-primary)' }}>Servant Portal</h2>
        <div>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginRight: '1rem' }}>Status: <strong style={{ color: activeDelivery ? 'var(--status-orange)' : 'var(--status-green)' }}>{activeDelivery ? 'BUSY' : 'AVAILABLE'}</strong></span>
          <button onClick={handleLogout} className="pill-btn" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'white', color: 'var(--status-red)', border: '1px solid var(--status-red)' }}>
            <LogOut size={16} style={{ marginRight: '5px' }} /> Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {!activeDelivery ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☕</div>
            <h3>You are currently Available.</h3>
            <p>Waiting for the kitchen to mark an order Ready...</p>
          </div>
        ) : (
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center', borderTop: '6px solid var(--status-orange)' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--status-orange)' }}>
              <Navigation size={48} />
            </div>
            
            <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Table {activeDelivery.tableNumber}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Order #{activeDelivery.orderId} is ready for delivery.
            </p>

            <button 
              onClick={markDelivered}
              className="pill-btn" 
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--status-green)' }}
            >
              <CheckCircle size={24} /> Mark Served
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ServantPortal;
