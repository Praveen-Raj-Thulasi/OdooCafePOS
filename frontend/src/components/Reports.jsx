import React, { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const generateReport = async () => {
    setIsGenerating(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('userToken');
      let url = `http://localhost:5000/api/analytics/reports?type=${reportType}`;
      
      if (reportType === 'custom') {
        if (!startDate || !endDate) {
          setMessage('Please select both start and end dates.');
          setIsGenerating(false);
          return;
        }
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const orders = await response.json();
      
      if (orders.length === 0) {
        setMessage('No completed orders found for this time period.');
        setIsGenerating(false);
        return;
      }

      downloadCSV(orders);
      setMessage(`Successfully downloaded report with ${orders.length} orders.`);
    } catch (err) {
      console.error(err);
      setMessage('Error generating report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = (orders) => {
    // Define CSV Headers
    const headers = ['Order ID', 'Date', 'Time', 'Table', 'Channel', 'Total Amount ($)', 'Items'];
    
    // Map order data into CSV rows
    const rows = orders.map(order => {
      const date = new Date(order.updatedAt).toLocaleDateString();
      const time = new Date(order.updatedAt).toLocaleTimeString();
      const table = order.table ? `T${order.table.tableNumber}` : 'N/A';
      const itemsString = order.items.map(i => `${i.quantity}x ${i.product?.name || 'Unknown'}`).join(' | ');
      
      return [
        order._id,
        date,
        time,
        table,
        order.channel,
        order.total.toFixed(2),
        `"${itemsString}"` // Wrapped in quotes to handle commas inside the string
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create Blob and Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${reportType}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Sales Reports</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Export and download historical sales data</p>
      </header>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => setReportType('daily')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb', cursor: 'pointer',
              backgroundColor: reportType === 'daily' ? 'var(--accent-primary)' : 'white',
              color: reportType === 'daily' ? 'white' : 'var(--text-primary)',
              fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            Daily Report
          </button>
          <button 
            onClick={() => setReportType('weekly')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb', cursor: 'pointer',
              backgroundColor: reportType === 'weekly' ? 'var(--accent-primary)' : 'white',
              color: reportType === 'weekly' ? 'white' : 'var(--text-primary)',
              fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            Weekly Report
          </button>
          <button 
            onClick={() => setReportType('custom')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb', cursor: 'pointer',
              backgroundColor: reportType === 'custom' ? 'var(--accent-primary)' : 'white',
              color: reportType === 'custom' ? 'white' : 'var(--text-primary)',
              fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            Custom Range
          </button>
        </div>

        {reportType === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
              />
            </div>
          </div>
        )}

        {message && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '8px', 
            backgroundColor: message.includes('Success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.includes('Success') ? 'var(--status-green)' : 'var(--status-red)'
          }}>
            {message}
          </div>
        )}

        <button 
          onClick={generateReport}
          disabled={isGenerating}
          className="pill-btn" 
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: isGenerating ? 0.7 : 1 }}
        >
          <Download size={22} />
          {isGenerating ? 'Generating CSV...' : 'Download CSV Report'}
        </button>

      </div>
    </div>
  );
};

export default Reports;
