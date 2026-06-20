import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { LogOut, Coffee, CheckCircle, Plus, Trash2 } from 'lucide-react';

const FloorPlan = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const currentRole = localStorage.getItem('userRole');
  const [floors, setFloors] = useState([]);
  const [servedOrders, setServedOrders] = useState([]);
  const [newFloorName, setNewFloorName] = useState('');
  const [newTable, setNewTable] = useState({ tableNumber: '', seats: 4 });

  const fetchFloors = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/floors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFloors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServedOrders(data.filter(o => o.status === 'Served'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFloors();
    fetchOrders();

    if (!socket) return;

    const handleUpdate = () => {
      fetchFloors();
      fetchOrders();
    };

    socket.on('table_state_changed', handleUpdate);
    socket.on('order_served', handleUpdate);
    socket.on('analytics_updated', handleUpdate);

    return () => {
      socket.off('table_state_changed', handleUpdate);
      socket.off('order_served', handleUpdate);
      socket.off('analytics_updated', handleUpdate);
    };
  }, [socket]);

  const completeBill = async (e, orderId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'Completed' })
      });
      if (response.ok) {
        fetchFloors();
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('http://localhost:5000/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newFloorName })
      });
      if (res.ok) {
        setNewFloorName('');
        fetchFloors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFloor = async (id) => {
    if (!window.confirm("Delete this floor and ALL its tables?")) return;
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`http://localhost:5000/api/floors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFloors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTable = async (floorId, e) => {
    e.preventDefault();
    if (!newTable.tableNumber.trim()) return;
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch('http://localhost:5000/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newTable, floor: floorId })
      });
      if (res.ok) {
        setNewTable({ tableNumber: '', seats: 4 });
        fetchFloors();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTable = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this table?")) return;
    try {
      const token = localStorage.getItem('userToken');
      const res = await fetch(`http://localhost:5000/api/tables/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFloors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <header className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', margin: '1rem', borderRadius: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Coffee size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Table View</h2>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem 2rem', overflowY: 'auto' }}>
        
        {/* Floor Management Top Bar */}
        {currentRole === 'Admin' && (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Floor & Table Management</h2>
            <form onSubmit={handleCreateFloor} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="New Floor Name (e.g. Ground Floor)" 
                value={newFloorName}
                onChange={e => setNewFloorName(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1, maxWidth: '400px' }}
              />
              <button type="submit" className="pill-btn" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Floor
              </button>
            </form>
          </div>
        )}

        {/* Floors and their Tables */}
        {floors.map(floor => (
          <div key={floor._id} className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{floor.name}</h3>
              {currentRole === 'Admin' && (
                <button onClick={() => handleDeleteFloor(floor._id)} style={{ padding: '0.5rem', color: 'var(--status-red)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} /> Delete Floor
                </button>
              )}
            </div>
            
            {/* Create Table Form */}
            {currentRole === 'Admin' && (
              <form onSubmit={(e) => handleCreateTable(floor._id, e)} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Table #" value={newTable.tableNumber} onChange={e => setNewTable({...newTable, tableNumber: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', width: '120px' }} required />
                <input type="number" placeholder="Seats" value={newTable.seats} onChange={e => setNewTable({...newTable, seats: parseInt(e.target.value)})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100px' }} required min="1" />
                <button type="submit" className="pill-btn" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--text-primary)' }}>
                  <Plus size={18} /> Add Table
                </button>
              </form>
            )}

            {/* Tables Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
              {floor.tables.map(table => {
                const isActive = table.status === 'Active';
                const tableServedOrder = servedOrders.find(o => o.table?._id === table._id);

                return (
                  <div 
                    key={table._id}
                    className="glass-card"
                    onClick={() => !isActive && !tableServedOrder && navigate(`/order/${table._id}`)}
                    style={{ 
                      padding: '2rem 1rem', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: (isActive || tableServedOrder) ? 'default' : 'pointer',
                      borderTop: `6px solid ${isActive ? 'var(--status-green)' : 'var(--status-red)'}`,
                      backgroundColor: isActive ? '#ecfdf5' : 'white',
                      position: 'relative'
                    }}
                  >
                    {currentRole === 'Admin' && (
                      <button 
                        onClick={(e) => handleDeleteTable(e, table._id)} 
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{table.tableNumber}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{table.seats} Seats</span>
                    
                    {tableServedOrder ? (
                      <button 
                        onClick={(e) => completeBill(e, tableServedOrder._id)}
                        className="pill-btn"
                        style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'var(--status-green)' }}
                      >
                        <CheckCircle size={14} /> Complete Bill
                      </button>
                    ) : (
                      <span style={{ 
                        marginTop: '1rem', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '99px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isActive ? 'var(--status-green)' : 'var(--status-red)'
                      }}>
                        {table.status}
                      </span>
                    )}
                  </div>
                );
              })}
              {floor.tables.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No tables on this floor yet.</span>}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default FloorPlan;
