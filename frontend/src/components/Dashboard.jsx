import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { DollarSign, Activity, Users, Coffee, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalTables: 10,
    activeOrders: 0,
    revenueToday: 0,
    completedOrdersToday: 0,
    salesData: [],
    popularItems: []
  });

  const [employees, setEmployees] = useState([]);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', password: '', role: 'Cashier' });
  const [empError, setEmpError] = useState('');
  const [empSuccess, setEmpSuccess] = useState('');

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchEmployees();
    
    if (!socket) return;

    const handleUpdate = () => fetchAnalytics();

    socket.on('order_created', handleUpdate);
    socket.on('analytics_updated', handleUpdate);
    socket.on('table_state_changed', handleUpdate);
    socket.on('kitchen_ready', handleUpdate);
    socket.on('order_served', handleUpdate);

    return () => {
      socket.off('order_created', handleUpdate);
      socket.off('analytics_updated', handleUpdate);
      socket.off('table_state_changed', handleUpdate);
      socket.off('kitchen_ready', handleUpdate);
      socket.off('order_served', handleUpdate);
    };
  }, [socket]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setEmpError('');
    setEmpSuccess('');
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newEmp)
      });
      
      const data = await response.json();
      if (response.ok) {
        setEmpSuccess('Employee created successfully!');
        setNewEmp({ name: '', email: '', password: '', role: 'Cashier' });
        fetchEmployees();
      } else {
        setEmpError(data.message || 'Failed to create employee');
      }
    } catch (error) {
      setEmpError('Cannot connect to server');
    }
  };

  const MetricCard = ({ title, value, icon, color }) => (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `6px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>{title}</h3>
        <div style={{ padding: '0.5rem', backgroundColor: `${color}15`, borderRadius: '10px', color: color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '2rem', overflowY: 'auto' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Command Center</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Live Operational Dashboard • Auto-syncing via WebSockets</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <MetricCard 
          title="Revenue Today" 
          value={`$${metrics.revenueToday.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
          icon={<DollarSign size={24} />} 
          color="var(--status-green)" 
        />
        <MetricCard 
          title="Active Orders" 
          value={metrics.activeOrders} 
          icon={<Activity size={24} />} 
          color="var(--accent-primary)" 
        />
        <MetricCard 
          title="Completed Orders Today" 
          value={metrics.completedOrdersToday} 
          icon={<Coffee size={24} />} 
          color="var(--status-orange)" 
        />
        <MetricCard 
          title="Total Tables" 
          value={metrics.totalTables} 
          icon={<Users size={24} />} 
          color="var(--status-red)" 
        />
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Sales Area Chart */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Sales Revenue (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 300 }}>
            {metrics.salesData && metrics.salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Popular Items Pie Chart */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Popular Items</h3>
          <div style={{ width: '100%', height: 220, position: 'relative' }}>
            {metrics.popularItems && metrics.popularItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.popularItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.popularItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading chart data...</div>
            )}
          </div>
            
          {/* Custom Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem', padding: '0 1rem' }}>
              {metrics.popularItems?.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      {/* Employee Management Section */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Employee Management</h2>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Create Employee Form */}
          <div style={{ flex: '1 1 300px', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '15px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Add New Employee</h3>
            {empError && <div style={{ color: 'var(--status-red)', marginBottom: '1rem', fontSize: '0.9rem' }}>{empError}</div>}
            {empSuccess && <div style={{ color: 'var(--status-green)', marginBottom: '1rem', fontSize: '0.9rem' }}>{empSuccess}</div>}
            
            <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={newEmp.name}
                onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                required 
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={newEmp.email}
                onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                required 
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={newEmp.password}
                onChange={e => setNewEmp({...newEmp, password: e.target.value})}
                required 
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <select 
                value={newEmp.role}
                onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              >
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Servant">Servant</option>
              </select>
              <button type="submit" className="pill-btn" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add Employee
              </button>
            </form>
          </div>

          {/* Employee List */}
          <div style={{ flex: '2 1 400px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Active Staff Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {employees.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No employees found.</div>
              ) : (
                employees.map(emp => (
                  <div key={emp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                    </div>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      color: 'var(--accent-primary)'
                    }}>
                      {emp.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
