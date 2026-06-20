import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KDS = () => {
  const socket = useSocket();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/kds/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    if (!socket) return;

    const handleUpdate = (data) => {
      if (data && data.orderNumber) addNotification(`Kitchen Update: ${data.orderNumber}`, 'warning');
      fetchTickets();
    };

    socket.on('new_kitchen_ticket', handleUpdate);
    socket.on('kds_refresh_needed', handleUpdate);

    return () => {
      socket.off('new_kitchen_ticket', handleUpdate);
      socket.off('kds_refresh_needed', handleUpdate);
    };
  }, [socket, addNotification]);

  const advanceOrder = async (id, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'Pending') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else return;

    try {
      const token = localStorage.getItem('userToken');
      await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (nextStatus === 'Ready') {
        addNotification('Order marked as Ready for Delivery!', 'success');
      }
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const Column = ({ title, status, color }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
      <h2 style={{ padding: '1rem', borderBottom: `3px solid ${color}`, marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
        {orders.filter(o => o.status === status).map(order => (
          <div key={order._id} onClick={() => advanceOrder(order._id, status)} className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: `6px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{order.orderNumber}</span>
              <span style={{ backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.9rem', fontWeight: 600 }}>Tbl {order.table?.tableNumber || 'QR'}</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 500 }}>
                {order.items && order.items.map(item => (
                  <li key={item._id}>{item.quantity}x {item.product?.name}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', backgroundColor: 'var(--bg-color)' }}>{order.channel}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: order.minutesWaiting > 10 ? 'var(--status-red)' : 'inherit' }}>
                <Clock size={16} /> {order.minutesWaiting} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ padding: '1rem 2rem', margin: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, color: 'var(--accent-primary)' }}>Kitchen Display System</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Sorting by: Dynamic Priority Matrix</span>
          <button onClick={handleLogout} className="pill-btn" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', color: 'var(--status-red)', border: '1px solid var(--status-red)' }}>
            <LogOut size={16} style={{ marginRight: '5px' }} /> Logout
          </button>
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1, gap: '1rem', padding: '0 1rem 1rem 1rem', overflow: 'hidden' }}>
        <Column title="Pending (Tap to Prepare)" status="Pending" color="var(--status-red)" />
        <Column title="Preparing (Tap to Ready)" status="Preparing" color="var(--status-orange)" />
      </div>
    </div>
  );
};

export default KDS;
