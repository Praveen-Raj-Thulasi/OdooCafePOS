import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, BarChart3, TrendingUp, Package, Tag, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Reports = () => {
  const [reportType, setReportType] = useState('monthly'); // Default to monthly for better trends
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Advanced Filters
  const [channelFilter, setChannelFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  
  // Available filter options
  const [availableProducts, setAvailableProducts] = useState([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Dashboard State
  const [dashboardData, setDashboardData] = useState({
    summary: { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
    salesTrend: [],
    topProducts: [],
    topCategories: [],
    topOrders: [],
    rawOrders: []
  });

  useEffect(() => {
    // Fetch filter metadata (Products)
    const fetchMetadata = async () => {
      try {
        const token = sessionStorage.getItem('userToken');
        const res = await fetch(API_URL + '/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableProducts(data);
        }
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };
    fetchMetadata();
  }, []);

  const fetchAnalytics = async () => {
    setIsGenerating(true);
    setMessage('');
    
    try {
      const token = sessionStorage.getItem('userToken');
      let url = `${API_URL}/api/analytics/reports?type=${reportType}&channel=${channelFilter}&product=${productFilter}`;
      
      if (reportType === 'custom') {
        if (!startDate || !endDate) {
          setIsGenerating(false);
          return;
        }
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else if (reportType === 'daily' && targetDate) {
        url += `&date=${targetDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const data = await response.json();
      setDashboardData(data);
      
      if (data.rawOrders.length === 0) {
        setMessage('No data found for this period and filter criteria.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error fetching analytics.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (reportType !== 'custom') {
      fetchAnalytics();
    }
  }, [reportType, channelFilter, productFilter, targetDate]);

  const downloadCSV = () => {
    if (dashboardData.rawOrders.length === 0) return;

    const headers = ['Order ID', 'Date', 'Time', 'Channel', 'Total Amount', 'Items'];
    const rows = dashboardData.rawOrders.map(order => {
      const date = new Date(order.updatedAt).toLocaleDateString();
      const time = new Date(order.updatedAt).toLocaleTimeString();
      const itemsString = order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Unknown'}`).join(' | ') || '';
      
      return [
        order.orderNumber,
        date,
        time,
        order.channel,
        order.total.toFixed(2),
        `"${itemsString}"`
      ].join(',');
    });
    
    // Add Grand Total row at the end
    rows.push(`,,,,Total:,${dashboardData.summary.totalRevenue.toFixed(2)}`);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cafinity_Report_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (dashboardData.rawOrders.length === 0) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Cafinity - Sales Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${reportType.toUpperCase()}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    // Summary Metrics
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary Metrics:", 14, 50);
    doc.setFontSize(10);
    doc.text(`Total Orders: ${dashboardData.summary.totalOrders}`, 14, 58);
    doc.text(`Total Revenue: Rs. ${dashboardData.summary.totalRevenue.toFixed(2)}`, 14, 64);
    doc.text(`Average Order Value: Rs. ${dashboardData.summary.averageOrderValue.toFixed(2)}`, 14, 70);

    // Orders Table
    if (dashboardData.rawOrders.length > 0) {
      doc.setFontSize(12);
      doc.text("Orders Breakdown:", 14, 85);
      
      const orderBody = dashboardData.rawOrders.map(o => [
        o.orderNumber,
        new Date(o.updatedAt).toLocaleDateString(),
        o.channel,
        `Rs. ${o.total.toFixed(2)}`
      ]);
      
      // Add Grand Total Row
      orderBody.push(['', '', 'Grand Total:', `Rs. ${dashboardData.summary.totalRevenue.toFixed(2)}`]);

      autoTable(doc, {
        startY: 90,
        head: [['Order ID', 'Date', 'Channel', 'Total Amount']],
        body: orderBody,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: 'bold' },
        didParseCell: function(data) {
          if (data.row.index === orderBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [16, 185, 129]; // Green for total
          }
        }
      });
    }

    doc.save(`Cafinity_Dashboard_Report_${new Date().getTime()}.pdf`);
  };

  const { summary, salesTrend, topProducts, topCategories, topOrders } = dashboardData;

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Reports and Analytics</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Real-time sales insights and performance metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={downloadCSV} disabled={summary.totalOrders === 0} className="pill-btn" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', opacity: summary.totalOrders === 0 ? 0.5 : 1 }}>
            <FileText size={18} /> CSV
          </button>
          <button onClick={downloadPDF} disabled={summary.totalOrders === 0} className="pill-btn" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: summary.totalOrders === 0 ? 0.5 : 1 }}>
            <Download size={18} /> PDF
          </button>
        </div>
      </header>

      {/* Advanced Filters Panel */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-end', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            <Calendar size={14} /> Period
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--hover-bg)', padding: '0.25rem', borderRadius: '8px' }}>
            {['daily', 'weekly', 'monthly', 'custom'].map(type => (
              <button 
                key={type}
                onClick={() => setReportType(type)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  backgroundColor: reportType === type ? 'var(--card-bg)' : 'transparent',
                  color: reportType === type ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: reportType === type ? 600 : 400, boxShadow: reportType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'capitalize', fontSize: '0.85rem'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {reportType === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            </div>
            <button onClick={fetchAnalytics} className="pill-btn" style={{ padding: '0.5rem 1rem' }}>Apply</button>
          </div>
        )}

        {reportType === 'daily' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Select Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        )}

        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            <Filter size={14} /> Session / Channel
          </label>
          <select 
            value={channelFilter} 
            onChange={e => setChannelFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--card-bg)' }}
          >
            <option value="All">All Channels</option>
            <option value="Cashier">Cashier POS</option>
            <option value="QR">QR Code (Table)</option>
            <option value="Waitstaff">Waitstaff App</option>
          </select>
        </div>

        <div style={{ minWidth: '180px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            <Package size={14} /> Product
          </label>
          <select 
            value={productFilter} 
            onChange={e => setProductFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--card-bg)' }}
          >
            <option value="All">All Products</option>
            {availableProducts.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {message && <div style={{ color: 'var(--status-orange)', fontWeight: 500 }}>{message}</div>}

      {isGenerating ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>
      ) : (
        <>
          {/* Compact Summary Bar */}
          <div className="glass-card flex-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'var(--card-bg)', borderLeft: '4px solid var(--status-green)', marginBottom: '1.5rem', gap: '1.5rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period Summary</h3>
              <div className="flex-wrap" style={{ gap: '2rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Orders: <span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{summary.totalOrders}</span></span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Average Order Value: <span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>₹{summary.averageOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 500 }}>Total Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-green)', lineHeight: 1 }}>
                ₹{summary.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>
          </div>

          <div className="responsive-charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Top Products Table */}
            <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', overflowX: 'auto' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
                <BarChart3 size={18} /> Top Products (By Revenue)
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Product Name</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Qty Sold</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length > 0 ? topProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.quantity}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-green)' }}>₹{p.revenue.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No products sold in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Top Orders Table */}
            <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', overflowX: 'auto' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>
                <FileText size={18} /> Top Orders (Highest Value)
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Order No.</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Channel</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topOrders.length > 0 ? topOrders.map((o, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{o.id}</td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{o.date}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--hover-bg)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {o.channel}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>₹{o.total.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
