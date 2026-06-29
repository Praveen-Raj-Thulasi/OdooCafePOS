import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const SessionManager = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingCash, setStartingCash] = useState(0);
  const [actualEndingCash, setActualEndingCash] = useState('');
  
  const [error, setError] = useState('');

  const fetchSessionStatus = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      
      // Fetch Active
      const activeRes = await fetch(API_URL + '/api/sessions/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveSession(data);
      } else {
        setActiveSession(null);
      }

      // Fetch Past
      const pastRes = await fetch(API_URL + '/api/sessions/past', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pastRes.ok) {
        const pastData = await pastRes.json();
        setPastSessions(pastData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessionStatus();
  }, []);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = sessionStorage.getItem('userToken');
      const res = await fetch(API_URL + '/api/sessions/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ startingCash: Number(startingCash) })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to open session');
      }
      
      await fetchSessionStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseSession = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = sessionStorage.getItem('userToken');
      const res = await fetch(API_URL + '/api/sessions/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ actualEndingCash: Number(actualEndingCash) })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to close session');
      }
      
      setActualEndingCash('');
      await fetchSessionStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Register Status...</div>;

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Register & End of Day</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage POS sessions and close out cash drawers.</p>
      </header>

      {error && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontWeight: 600 }}>{error}</div>}

      {!activeSession ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--card-bg)', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#10b981' }}>
            <PlayCircle size={64} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Register is Closed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You cannot take orders until a new session is opened.</p>
          
          <form onSubmit={handleOpenSession}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Starting Cash (₹)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={startingCash} 
                onChange={(e) => setStartingCash(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1.1rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <button type="submit" className="pill-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <PlayCircle size={20} /> Open Register
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'var(--card-bg)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--status-orange)' }}>
              <Clock size={24} /> Active Session: {activeSession.sessionNumber}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Opened At</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(activeSession.openedAt).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Revenue</span>
                <span style={{ fontWeight: 600, color: '#10b981', fontSize: '1.2rem' }}>₹{activeSession.currentMetrics?.totalRevenue.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Orders</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeSession.currentMetrics?.totalOrders}</span>
              </div>
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Payment Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Starting Cash</span><span>₹{activeSession.startingCash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Cash Sales</span><span style={{ color: '#10b981' }}>+ ₹{activeSession.currentMetrics?.cashPayments.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span>Card/UPI Sales</span><span>₹{(activeSession.currentMetrics?.cardPayments + activeSession.currentMetrics?.upiPayments).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', paddingTop: '0.5rem' }}>
                <span>Expected Drawer Cash</span><span>₹{activeSession.currentMetrics?.expectedEndingCash.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'var(--card-bg)', borderLeft: '4px solid #ef4444' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
              <StopCircle size={24} /> Close Register (Z-Report)
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Count the physical cash in your drawer and enter it below to close the shift.</p>
            
            <form onSubmit={handleCloseSession}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Actual Cash in Drawer (₹)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={actualEndingCash} 
                  onChange={(e) => setActualEndingCash(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1.1rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>
              
              {actualEndingCash !== '' && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Discrepancy:</span>
                  <span style={{ fontWeight: 700, color: (Number(actualEndingCash) - activeSession.currentMetrics?.expectedEndingCash) < 0 ? '#ef4444' : '#10b981' }}>
                    ₹{(Number(actualEndingCash) - activeSession.currentMetrics?.expectedEndingCash).toFixed(2)}
                  </span>
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <CheckCircle size={20} /> Submit & Close Day
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Past Sessions Table */}
      <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'var(--card-bg)', marginTop: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Recent Sessions</h3>
        {pastSessions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No closed sessions found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Session ID</th>
                <th style={{ padding: '1rem' }}>Opened</th>
                <th style={{ padding: '1rem' }}>Closed</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Cash Diff</th>
              </tr>
            </thead>
            <tbody>
              {pastSessions.map(s => {
                const diff = s.actualEndingCash - s.expectedEndingCash;
                return (
                  <tr key={s._id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{s.sessionNumber}</td>
                    <td style={{ padding: '1rem' }}>{new Date(s.openedAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>{s.closedAt ? new Date(s.closedAt).toLocaleString() : '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>₹{s.metricsSnapshot?.totalRevenue.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: diff < 0 ? '#ef4444' : '#10b981' }}>
                      {diff > 0 ? '+' : ''}₹{diff.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
