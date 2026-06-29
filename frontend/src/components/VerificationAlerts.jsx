import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { ShieldAlert, Check, X } from 'lucide-react';

const VerificationAlerts = () => {
  const socket = useSocket();
  const [verifications, setVerifications] = useState([]);
  const currentRole = sessionStorage.getItem('userRole');

  const fetchVerifications = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch(API_URL + '/api/payments/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVerifications(data);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  useEffect(() => {
    // Only Admin and Cashier need to see these
    if (currentRole !== 'Admin' && currentRole !== 'Cashier') return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVerifications();
    
    if (!socket) return;

    const handleVerificationUpdate = () => fetchVerifications();

    socket.on('payment_claim_raised', handleVerificationUpdate);
    socket.on('payment_verified', handleVerificationUpdate);
    socket.on('payment_rejected', handleVerificationUpdate);

    return () => {
      socket.off('payment_claim_raised', handleVerificationUpdate);
      socket.off('payment_verified', handleVerificationUpdate);
      socket.off('payment_rejected', handleVerificationUpdate);
    };
  }, [socket, currentRole]);

  if (verifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '450px',
      width: '100%'
    }}>
      {verifications.map(v => (
        <div key={v.tableId} style={{ 
          backgroundColor: '#fffbe1', 
          border: '1px solid #fde047', 
          borderRadius: '15px', 
          padding: '1.25rem', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#fef08a', color: '#a16207', borderRadius: '12px' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#854d0e', fontSize: '1.1rem' }}>Payment Verification</h3>
              <p style={{ margin: 0, color: '#a16207', fontSize: '0.9rem', lineHeight: '1.4' }}>
                <strong>Table {v.tableNumber}</strong> claims they paid <strong>₹{v.amount.toFixed(2)}</strong> via UPI. Please check your bank app.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button 
              onClick={async () => {
                const token = sessionStorage.getItem('userToken');
                await fetch(API_URL + '/api/payments/settle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ tableId: v.tableId, paymentMethod: 'Online' })
                });
                fetchVerifications();
              }}
              style={{ padding: '0.75rem', backgroundColor: '#16a34a', color: 'var(--card-bg)', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Check size={18} /> Approve
            </button>
            <button 
              onClick={async () => {
                const token = sessionStorage.getItem('userToken');
                await fetch(API_URL + '/api/payments/reject', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ tableId: v.tableId })
                });
                fetchVerifications();
              }}
              style={{ padding: '0.75rem', backgroundColor: '#ef4444', color: 'var(--card-bg)', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <X size={18} /> Reject
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VerificationAlerts;
