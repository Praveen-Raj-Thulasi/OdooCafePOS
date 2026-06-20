import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('order_created', (data) => {
      addNotification(`New order placed: ${data.orderNumber}`, 'info');
    });

    socket.on('new_kitchen_ticket', (data) => {
      addNotification(`Kitchen received order for Table ${data.tableId}`, 'warning');
    });

    socket.on('kitchen_ticket_completed', (data) => {
      addNotification(`Order ${data.orderId} is ready!`, 'success');
    });

    socket.on('payment_completed', (data) => {
      addNotification(`Payment received for Order ${data.orderId}`, 'success');
    });

    return () => {
      socket.off('order_created');
      socket.off('new_kitchen_ticket');
      socket.off('kitchen_ticket_completed');
      socket.off('payment_completed');
    };
  }, [socket]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Toast Container */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map(notif => (
          <div key={notif.id} className={`toast toast-${notif.type} glass-card slide-in`} style={{ padding: '1rem 1.5rem', minWidth: '250px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notif.type === 'success' && <span style={{ color: 'var(--status-green)' }}>✅</span>}
            {notif.type === 'warning' && <span style={{ color: 'var(--status-orange)' }}>🔥</span>}
            {notif.type === 'info' && <span style={{ color: 'var(--accent-primary)' }}>ℹ️</span>}
            <span style={{ fontWeight: 500 }}>{notif.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
