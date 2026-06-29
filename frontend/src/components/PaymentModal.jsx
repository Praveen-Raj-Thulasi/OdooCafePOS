import { API_URL } from '../config';
import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PaymentModal = ({ isOpen, onClose, total, prePromoTotal = 0, automatedDiscount = 0, appliedPromotion = null, onComplete }) => {
  const [method, setMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  
  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate?code=${couponCodeInput}`);
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || 'Invalid coupon');
        setAppliedCoupon(null);
        setDiscountAmount(0);
        return;
      }
      
      setAppliedCoupon(data);
      let calcDiscount = 0;
      if (data.discountType === 'percent') {
        calcDiscount = (total * data.discountValue) / 100;
      } else {
        calcDiscount = data.discountValue;
      }
      
      const maxDiscount = total * 0.30;
      if (calcDiscount > maxDiscount) {
        setDiscountAmount(maxDiscount);
        setCouponError(`Discount capped at 30% (₹${maxDiscount.toFixed(2)})`);
      } else {
        setDiscountAmount(calcDiscount);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput('');
    setCouponError('');
  };

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

  // setExact was removed inline

  const finalTotal = Math.max(0, total - discountAmount);
  const numTendered = parseFloat(tendered) || 0;
  const change = Math.max(0, numTendered - finalTotal);
  const isValid = method !== 'Cash' || numTendered >= finalTotal;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', minHeight: '600px', maxHeight: '95vh', backgroundColor: 'var(--bg-color)', borderRadius: '20px', display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Summary & Payment Methods */}
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', backgroundColor: 'var(--card-bg)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Payment</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X size={24} color="var(--text-secondary)" /></button>
          </div>

          <div style={{ padding: '2rem', backgroundColor: 'var(--sub-bg)', borderRadius: '15px', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Due</div>
            
            {automatedDiscount > 0 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Cart Total: <span style={{ textDecoration: 'line-through' }}>₹{prePromoTotal.toFixed(2)}</span>
                <br />
                <span style={{ color: 'var(--status-orange)' }}>
                  Auto-Promo ({appliedPromotion}): -₹{automatedDiscount.toFixed(2)}
                </span>
              </div>
            )}

            {discountAmount > 0 ? (
              <>
                <div style={{ fontSize: '1.5rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{total.toFixed(2)}</div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--status-green)' }}>₹{finalTotal.toFixed(2)}</div>
                <div style={{ fontSize: '1rem', color: 'var(--status-green)', marginTop: '0.5rem' }}>Manual Discount: ₹{discountAmount.toFixed(2)}</div>
              </>
            ) : (
              <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{total.toFixed(2)}</div>
            )}
          </div>

          {/* Coupon Section */}
          <div style={{ marginBottom: '2rem' }}>
            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--highlight-green)', borderRadius: '10px', border: '1px solid var(--border-green)' }}>
                <div>
                  <div style={{ color: 'var(--status-green)', fontWeight: 600 }}>Coupon "{appliedCoupon.code}" applied!</div>
                  {couponError && <div style={{ color: 'var(--status-orange)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{couponError}</div>}
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: 'var(--status-red)', border: '1px solid #fecaca', fontWeight: 600, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Coupon Code" 
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Apply
                  </button>
                </div>
                {couponError && <div style={{ color: 'var(--status-red)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{couponError}</div>}
              </>
            )}
          </div>


          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Payment Method</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => { setMethod('Cash'); setTendered(''); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'Cash' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'Cash' ? 'var(--highlight-blue)' : 'var(--card-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Banknote size={28} color={method === 'Cash' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'Cash' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Cash</span>
            </button>
            <button 
              onClick={() => { setMethod('Card'); setTendered(finalTotal.toString()); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'Card' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'Card' ? 'var(--highlight-blue)' : 'var(--card-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={28} color={method === 'Card' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'Card' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Card</span>
            </button>
            <button 
              onClick={() => { setMethod('UPI'); setTendered(finalTotal.toString()); }}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px', border: method === 'UPI' ? '2px solid var(--accent-primary)' : '1px solid #e5e7eb', backgroundColor: method === 'UPI' ? 'var(--highlight-blue)' : 'var(--card-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={28} color={method === 'UPI' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, color: method === 'UPI' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>UPI Scan</span>
            </button>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={() => onComplete({ method, tendered: numTendered, change, appliedDiscount: discountAmount, couponCode: appliedCoupon?.code })}
              disabled={!isValid}
              className="pill-btn" 
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isValid ? 1 : 0.5 }}
            >
              <CheckCircle size={24} /> Confirm Payment
            </button>
          </div>
        </div>

        {/* Right Side: Dynamic content based on method */}
        <div style={{ width: '350px', padding: '2rem', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sub-bg)', alignItems: 'center', justifyContent: 'center' }}>
          
          {method === 'UPI' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Scan with any UPI App</h3>
              <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <QRCodeSVG 
                  value={`upi://pay?pa=7010496249@nyes&pn=Cafinity&am=${finalTotal.toFixed(2)}&cu=INR`} 
                  size={200} 
                  level="H" 
                />
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Amount: <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>₹{finalTotal.toFixed(2)}</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                Wait for the customer to complete payment on their device before clicking Confirm.
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tendered</span>
                <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>₹{tendered ? tendered : '0.00'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '1rem', backgroundColor: change > 0 ? 'var(--highlight-green)' : 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Change</span>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: change > 0 ? 'var(--status-green)' : 'var(--text-primary)' }}>₹{change.toFixed(2)}</span>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleNumpad(num.toString())}
                    disabled={method !== 'Cash'}
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border-color)', 
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
                  style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 600, cursor: method === 'Cash' ? 'pointer' : 'not-allowed', opacity: method === 'Cash' ? 1 : 0.5 }}
                >
                  Clear
                </button>
                <button 
                  onClick={() => setTendered(finalTotal.toString())}
                  disabled={method !== 'Cash'}
                  style={{ padding: '1rem', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: method === 'Cash' ? 'pointer' : 'not-allowed', opacity: method === 'Cash' ? 1 : 0.5 }}
                >
                  Exact Cash
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
