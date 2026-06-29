import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

const QRGenerator = () => {
  const { tableId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tableNumber = searchParams.get('number') || tableId.substring(0, 4);

  // The URL the customer will scan
  const menuUrl = `${window.location.origin}/menu/${tableId}`;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: 'var(--hover-bg)',
      padding: '2rem'
    }}>
      <div 
        id="printable-qr"
        className="glass-card" 
        style={{ 
          padding: '4rem', 
          backgroundColor: 'var(--card-bg)', 
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-primary)', fontSize: '3rem' }}>Cafinity</h1>
        <p style={{ margin: '0 0 3rem 0', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Scan to order & pay</p>
        
        <div style={{ padding: '2rem', border: '4px solid var(--accent-primary)', borderRadius: '20px', display: 'inline-block' }}>
          <QRCodeSVG 
            value={menuUrl} 
            size={300} 
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
            includeMargin={false}
          />
        </div>

        <h2 style={{ marginTop: '3rem', fontSize: '2.5rem', color: 'var(--text-primary)' }}>Table {tableNumber}</h2>
      </div>

      <button 
        onClick={() => window.print()}
        className="pill-btn"
        style={{ 
          marginTop: '3rem', 
          padding: '1rem 3rem', 
          fontSize: '1.2rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem' 
        }}
      >
        <Printer size={24} /> Print QR Code
      </button>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-qr, #printable-qr * {
              visibility: visible;
            }
            #printable-qr {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              box-shadow: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default QRGenerator;
