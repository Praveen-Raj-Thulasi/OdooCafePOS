import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, total, onComplete }) => {
  const [method, setMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');
  
  if (!isOpen) return null;

  const handleNumpad = (num) => {
    // If it's a decimal and we already have one, ignore
    if (num === '.' && tendered.includes('.')) return;
    setTendered(prev => prev + num);
  };

  const handleBackspace = () => {
    setTendered(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setTendered('');
  };

  const setExact = () => {
    setTendered(total.toString());
  };

  const numTendered = parseFloat(tendered) || 0;
  const change = Math.max(0, numTendered - total);
  const isValid = method !== 'Cash' || numTendered >= total;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', height: '600px', backgroundColor: 'var(--bg-color)', borderRadius: '20px', display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Summary & Payment Methods */}
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Payment</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X size={24} color="var(--text-secondary)" /></button>
          </div>

          <div style={{ padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '15px', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Due</div>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>${total.toFixed(2)}</div>
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Payment Method</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => { setMethod('Cash'); setTendered(''); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'Cash' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'Cash' ? '#eef2ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Banknote size={28} color={method === 'Cash' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'Cash' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Cash</span>
            </button>
            <button 
              onClick={() => { setMethod('Card'); setTendered(total.toString()); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'Card' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'Card' ? '#eef2ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={28} color={method === 'Card' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'Card' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Card</span>
            </button>
            <button 
              onClick={() => { setMethod('Digital'); setTendered(total.toString()); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'Digital' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'Digital' ? '#eef2ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={28} color={method === 'Digital' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'Digital' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Digital</span>
            </button>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={() => onComplete({ method, tendered: numTendered, change })}
              disabled={!isValid}
              className="pill-btn" 
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isValid ? 1 : 0.5 }}
            >
              <CheckCircle size={24} /> Confirm Payment
            </button>
          </div>
        </div>

        {/* Right Side: Numpad (Only active for Cash) */}
        <div style={{ width: '350px', padding: '2rem', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tendered</span>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>${tendered ? numTendered.toFixed(2) : '0.00'}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '1rem', backgroundColor: change > 0 ? '#ecfdf5' : 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Change</span>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: change > 0 ? 'var(--status-green)' : 'var(--text-primary)' }}>${change.toFixed(2)}</span>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
              <button 
                key={num}
                onClick={() => handleNumpad(num.toString())}
                disabled={method !== 'Cash'}
                style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  fontSize: '1.5rem', 
                  fontWeight: 600, 
                  cursor: method === 'Cash' ? 'pointer' : 'not-allowed',
                  opacity: method === 'Cash' ? 1 : 0.5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {num}
              </button>
            ))}
            <button 
              onClick={handleBackspace}
              disabled={method !== 'Cash'}
              style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 600, cursor: method === 'Cash' ? 'pointer' : 'not-allowed', opacity: method === 'Cash' ? 1 : 0.5 }}
            >
              ⌫
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button 
              onClick={handleClear}
              disabled={method !== 'Cash'}
              style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 600, cursor: method === 'Cash' ? 'pointer' : 'not-allowed', opacity: method === 'Cash' ? 1 : 0.5 }}
            >
              Clear
            </button>
            <button 
              onClick={setExact}
              disabled={method !== 'Cash'}
              style={{ padding: '1rem', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: method === 'Cash' ? 'pointer' : 'not-allowed', opacity: method === 'Cash' ? 1 : 0.5 }}
            >
              Exact Cash
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
