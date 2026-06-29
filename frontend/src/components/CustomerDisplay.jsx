import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Coffee, ShieldCheck, CreditCard, ShoppingBag, CheckCircle, Sparkles, Utensils } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CustomerDisplay = () => {
  const socket = useSocket();
  const [viewState, setViewState] = useState('IDLE'); // 'IDLE', 'PAYMENT', 'COMPLETE'
  const [cart, setCart] = useState([]);
  const [billDetails, setBillDetails] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  useEffect(() => {
    if (!socket) return;
    const handleCfdUpdate = (newCart) => { setViewState('IDLE'); setCart(newCart); };
    const handleCfdPayment = (bill) => { setViewState('PAYMENT'); setBillDetails(bill); };
    const handleCfdComplete = (data) => {
      setViewState('COMPLETE');
      setSuccessData(data);
      setTimeout(() => {
        setViewState('IDLE');
        setCart([]);
        setBillDetails(null);
        setSuccessData(null);
      }, 10000);
    };

    socket.on('cfd_update', handleCfdUpdate);
    socket.on('cfd_payment', handleCfdPayment);
    socket.on('cfd_complete', handleCfdComplete);

    return () => {
      socket.off('cfd_update', handleCfdUpdate);
      socket.off('cfd_payment', handleCfdPayment);
      socket.off('cfd_complete', handleCfdComplete);
    };
  }, [socket]);

  const displayTotal = viewState === 'PAYMENT' && billDetails ? billDetails.total : total;
  const displaySubtotal = viewState === 'PAYMENT' && billDetails ? billDetails.prePromoTotal / 1.1 : subtotal;
  const displayTax = viewState === 'PAYMENT' && billDetails ? (billDetails.prePromoTotal / 1.1) * 0.1 : tax;
  const displayDiscount = viewState === 'PAYMENT' && billDetails ? billDetails.automatedDiscount : 0;

  const upiId = "pay@cafinity";
  const upiName = "Cafinity";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${displayTotal.toFixed(2)}&cu=INR`;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#0f172a', // Deep slate background
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%)',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
      overflow: 'hidden'
    }}>
      
      {/* Dynamic Background Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 10s infinite alternate ease-in-out' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 12s infinite alternate-reverse ease-in-out' }} />

      {/* Main Content Wrapper */}
      <div style={{ display: 'flex', width: '100%', height: '100%', zIndex: 10, padding: '2rem', gap: '2rem' }}>
        
        {/* Left Panel - Glassmorphic Order Details (75% width) */}
        <div style={{ 
          flex: '0 0 70%', 
          backgroundColor: 'rgba(30, 41, 59, 0.7)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)' }}>
            <div>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <Coffee size={32} color="#818cf8" /> Cafinity
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '1rem', letterSpacing: '0.5px' }}>YOUR CURRENT ORDER</p>
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '99px', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}>
                {cart.reduce((sum, item) => sum + item.qty, 0)} Items
              </div>
            )}
          </div>

          {/* Cart Items Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {viewState === 'COMPLETE' ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', opacity: 0.5 }}>
                <Sparkles size={64} color="#64748b" />
                <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Preparing your next order...</p>
              </div>
            ) : cart.length === 0 && viewState === 'IDLE' ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', opacity: 0.5 }}>
                <ShoppingBag size={64} color="#64748b" />
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 300 }}>Your cart is empty.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ 
                        width: '48px', height: '48px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
                      }}>
                        {item.qty}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.25rem', color: '#f1f5f9', marginBottom: '0.25rem' }}>{item.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>₹{item.price.toFixed(2)} each</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#f8fafc' }}>
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
                
                {viewState === 'PAYMENT' && billDetails && billDetails.orders && billDetails.orders.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', color: '#38bdf8', fontSize: '1rem', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Includes {billDetails.orders.length} previously prepared items.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals Footer */}
          <div style={{ padding: '2rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#94a3b8', fontSize: '1.1rem' }}>
              <span>Subtotal</span>
              <span>₹{displaySubtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#94a3b8', fontSize: '1.1rem' }}>
              <span>Taxes & Fees</span>
              <span>₹{displayTax.toFixed(2)}</span>
            </div>
            {displayDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#34d399', fontSize: '1.1rem', fontWeight: 600 }}>
                <span>Promotional Discount</span>
                <span>-₹{displayDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '2.5rem', fontWeight: 800, color: '#ffffff' }}>
              <span>Total</span>
              <span style={{ color: '#34d399' }}>₹{displayTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Dynamic State (30% width) */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden' }}>
          
          {/* State 1: IDLE */}
          <div style={{ 
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: viewState === 'IDLE' ? 1 : 0, pointerEvents: viewState === 'IDLE' ? 'auto' : 'none', transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: viewState === 'IDLE' ? 'translateY(0)' : 'translateY(20px)',
            textAlign: 'center', padding: '2rem'
          }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '3rem 2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', width: '100%' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)' }}>
                <Utensils size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '2.2rem', margin: '0 0 1rem 0', fontWeight: 800, color: 'white' }}>Welcome</h2>
              <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Please review your order on the screen. Let our staff know if you need any adjustments.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <ShieldCheck size={24} color="#34d399" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Freshly Prepared</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <Sparkles size={24} color="#f472b6" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Premium Ingredients</span>
                </div>
              </div>
            </div>
          </div>

          {/* State 2: PAYMENT */}
          <div style={{ 
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: viewState === 'PAYMENT' ? 1 : 0, pointerEvents: viewState === 'PAYMENT' ? 'auto' : 'none', transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: viewState === 'PAYMENT' ? 'translateY(0)' : 'translateY(20px)',
            padding: '2rem'
          }}>
            <div style={{ 
              backgroundColor: 'white', padding: '3rem 2rem', borderRadius: '24px', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', width: '100%',
              border: '4px solid #4f46e5'
            }}>
              <CreditCard size={48} color="#4f46e5" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '2rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Payment Required</h2>
              <p style={{ fontSize: '1.05rem', color: '#64748b', margin: '0 0 2rem 0' }}>Hand cash to the cashier or scan below</p>
              
              <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '20px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <QRCodeSVG value={upiUrl} size={180} level="H" />
                </div>
                <div style={{ marginTop: '1.5rem', fontWeight: 800, fontSize: '1.8rem', color: '#0f172a' }}>
                  ₹{displayTotal.toFixed(2)}
                </div>
                <div style={{ marginTop: '0.25rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  <ShieldCheck size={16} /> Secure UPI
                </div>
              </div>
            </div>
          </div>

          {/* State 3: COMPLETE */}
          <div style={{ 
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: viewState === 'COMPLETE' ? 1 : 0, pointerEvents: viewState === 'COMPLETE' ? 'auto' : 'none', transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: viewState === 'COMPLETE' ? 'scale(1)' : 'scale(0.9)',
            textAlign: 'center', padding: '2rem'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4rem 2rem', borderRadius: '24px', 
              border: '1px solid rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(10px)', width: '100%'
            }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}>
                <CheckCircle size={60} color="white" />
              </div>
              <h1 style={{ fontSize: '2.5rem', color: '#34d399', margin: '0 0 1rem 0', fontWeight: 800 }}>Success!</h1>
              <p style={{ fontSize: '1.2rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                Payment received successfully. Thank you for dining with us!
              </p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Global Animations defined inline */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default CustomerDisplay;
