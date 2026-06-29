import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle, Navigation, LogOut, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';

const ServantPortal = () => {
  const socket = useSocket();
  const { addNotification } = useNotification();
  
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [activeTables, setActiveTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [openBill, setOpenBill] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const navigate = useNavigate();
  const currentRole = sessionStorage.getItem('userRole');

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    navigate('/login');
  };

  const fetchActiveTables = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch(API_URL + '/api/floors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const floors = await response.json();
        const active = [];
        floors.forEach(f => {
          f.tables.forEach(t => {
            if (t.status === 'Active') {
              active.push(t);
            }
          });
        });
        setActiveTables(active);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingDeliveries = async () => {
    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch(API_URL + '/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const orders = await response.json();
        const readyOrders = orders.filter(o => o.status === 'Ready');
        if (readyOrders.length > 0) {
          setActiveDelivery({
            _id: readyOrders[0]._id,
            orderId: readyOrders[0].orderNumber,
            tableNumber: readyOrders[0].table?.tableNumber || 'QR'
          });
        } else {
          setActiveDelivery(null);
        }
      }
    } catch (err) {
      console.error('Error fetching pending deliveries:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActiveTables();
    fetchPendingDeliveries();

    if (!socket) return;

    const handleNewDelivery = (data) => {
      addNotification(`New Delivery: Table ${data.tableNumber}`, 'info');
      fetchPendingDeliveries();
    };

    socket.on('kitchen_ready', handleNewDelivery);
    socket.on('table_state_changed', fetchActiveTables);

    return () => {
      socket.off('kitchen_ready', handleNewDelivery);
      socket.off('table_state_changed', fetchActiveTables);
    };
  }, [socket, addNotification]);

  const markDelivered = async () => {
    if (!activeDelivery) return;

    try {
      const token = sessionStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/orders/${activeDelivery._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'Served' })
      });

      if (response.ok) {
        addNotification(`Successfully delivered to Table ${activeDelivery.tableNumber}`, 'success');
        fetchPendingDeliveries(); // Fetch the next one if it exists!
      }
    } catch (error) {
      console.error('Error marking delivered:', error);
    }
  };

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    try {
      const res = await fetch(`${API_URL}/api/payments/bill/${table._id}`);
      if (res.ok) {
        const billData = await res.json();
        if (billData.orders && billData.orders.length > 0) {
          setOpenBill(billData);
          setIsPaymentOpen(true);
        } else {
          addNotification('This table has no unpaid orders.', 'info');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleBill = async (paymentDetails) => {
    if (!selectedTable) return;
    try {
      const response = await fetch(API_URL + '/api/payments/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable._id,
          paymentMethod: paymentDetails.method, // Uses 'Servant' or 'Cash'/'Card' depending on how it's overridden
          appliedDiscount: paymentDetails.appliedDiscount,
          couponCode: paymentDetails.couponCode
        })
      });

      if (response.ok) {
        addNotification(`Table ${selectedTable.tableNumber} bill settled!`, 'success');
        setIsPaymentOpen(false);
        setOpenBill(null);
        setSelectedTable(null);
        fetchActiveTables();
      } else {
        alert('Failed to settle bill.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sleek Top Navigation */}
      <header style={{ 
        backgroundColor: 'var(--card-bg)', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', borderRadius: '10px' }}>
            <Navigation size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>Servant Portal</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cafinity Staff</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '10px', height: '10px', borderRadius: '50%', 
              backgroundColor: activeDelivery ? 'var(--status-orange)' : 'var(--status-green)',
              boxShadow: activeDelivery ? '0 0 10px var(--status-orange)' : '0 0 10px var(--status-green)'
            }}></div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeDelivery ? 'Busy (Delivering)' : 'Available'}
            </span>
          </div>
          {currentRole !== 'Admin' && (
            <button onClick={handleLogout} style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ef4444', 
              backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 500 
            }}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Delivery Section */}
        <section>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Task</h3>
          
          {!activeDelivery ? (
            <div style={{ 
              backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '4rem 2rem', 
              textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px dashed #e2e8f0' 
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>☕</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Active Deliveries</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You will be pinged when an order is ready in the kitchen.</p>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '2.5rem', 
              textAlign: 'center', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.15)', 
              border: '2px solid var(--status-orange)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', backgroundColor: 'var(--status-orange)' }}></div>
              
              <div style={{ display: 'inline-flex', padding: '1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--status-orange)' }}>
                <Navigation size={48} />
              </div>
              
              <h1 style={{ fontSize: '4rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 800 }}>
                Table {activeDelivery.tableNumber}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.25rem' }}>
                Order <strong>#{activeDelivery.orderId}</strong> is ready for delivery.
              </p>

              <button 
                onClick={markDelivered}
                style={{ 
                  width: '100%', maxWidth: '400px', margin: '0 auto', padding: '1.25rem', fontSize: '1.2rem', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', 
                  backgroundColor: 'var(--status-green)', color: 'var(--card-bg)', border: 'none', borderRadius: '15px',
                  fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <CheckCircle size={24} /> Mark as Served
              </button>
            </div>
          )}
        </section>

        {/* Active Tables / Billing Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Take Payment</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '99px', border: '1px solid var(--border-color)' }}>
              {activeTables.length} Active {activeTables.length === 1 ? 'Table' : 'Tables'}
            </span>
          </div>

          {activeTables.length === 0 ? (
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '15px', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>There are no active tables to collect payment from.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {activeTables.map(table => (
                <button 
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    border: '1px solid var(--border-color)',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--status-green)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--status-green)' }}></div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                    <DollarSign size={24} color="var(--status-green)" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Table {table.tableNumber}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Collect Payment</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        total={openBill ? openBill.total : 0} 
        prePromoTotal={openBill ? openBill.prePromoTotal : 0}
        automatedDiscount={openBill ? openBill.automatedDiscount : 0}
        appliedPromotion={openBill ? openBill.appliedPromotion : null}
        onComplete={(details) => handleSettleBill({ ...details, method: 'Servant' })} 
      />
    </div>
  );
};

export default ServantPortal;
