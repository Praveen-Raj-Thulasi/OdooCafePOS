import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { Plus, Minus, ShoppingBag, Receipt, CreditCard, ChevronDown, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CustomerMenu = () => {
  const { tableId } = useParams();
  const socket = useSocket();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState([]);
  const [openTab, setOpenTab] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  // Modals / Tabs
  const [activeView, setActiveView] = useState('menu'); // menu, cart, bill, payment

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  // Alternative suggestion modal state
  const [suggestionModal, setSuggestionModal] = useState(null);

  const getQrSessionId = () => {
    let sid = sessionStorage.getItem(`qrSessionId_${tableId}`);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(`qrSessionId_${tableId}`, sid);
    }
    return sid;
  };

  const fetchData = async () => {
    try {
      const [catRes, prodRes, billRes, tableRes] = await Promise.all([
        fetch(API_URL + '/api/categories'),
        fetch(API_URL + '/api/products'),
        fetch(`${API_URL}/api/payments/bill/${tableId}?qrSessionId=${getQrSessionId()}`),
        fetch(`${API_URL}/api/tables/public/${tableId}`)
      ]);

      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData);
        setProducts(prodData);
        if (catData.length > 0 && !activeCat) setActiveCat(catData[0]._id);
      }

      if (billRes.ok) {
        const billData = await billRes.json();
        setOpenTab(billData);
      }

      if (tableRes.ok) {
        const tData = await tableRes.json();
        setTableInfo(tData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket) return;

    const handleUpdate = () => fetchData();
    const handleVerified = (data) => {
      if (data.tableId === tableId) {
        setPaymentPending(false);
        setPaymentSuccess(true);
      }
    };
    const handleRejected = (data) => {
      if (data.tableId === tableId) {
        setPaymentPending(false);
        setActiveView('payment');
        alert('Your payment could not be verified by the cashier. Please try again or speak to staff.');
      }
    };

    socket.on('table_state_changed', handleUpdate);
    socket.on('order_served', handleUpdate);
    socket.on('payment_verified', handleVerified);
    socket.on('payment_rejected', handleRejected);

    return () => {
      socket.off('table_state_changed', handleUpdate);
      socket.off('order_served', handleUpdate);
      socket.off('payment_verified', handleVerified);
      socket.off('payment_rejected', handleRejected);
    };
  }, [socket, tableId]);

  const filteredProducts = products.filter(p => p.category === activeCat || p.category?._id === activeCat);

  const addToCart = (product, isAlt = false, waitSaved = 0) => {
    setCart(prev => {
      const exists = prev.find(item => item._id === product._id);
      if (exists) {
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        qty: 1,
        isAlternativeAccepted: isAlt || false,
        waitSaved: waitSaved || 0 
      }];
    });
  };

  const handleAddToCartClick = async (product) => {
    const exists = cart.find(item => item._id === product._id);
    if (exists) {
      addToCart(product);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/products/alternatives/${product._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.suggest && data.alternatives && data.alternatives.length > 0) {
          setSuggestionModal({
            originalProduct: product,
            estimatedWaitTime: data.estimatedWaitTime,
            alternatives: data.alternatives
          });
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    addToCart(product);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0)); // Filter out 0 qty
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const submitOrder = async () => {
    if (cart.length === 0) return;
    try {
      const orderPayload = {
        tableId,
        channel: 'QR',
        qrSessionId: getQrSessionId(),
        items: cart.map(item => ({
          product: item._id,
          quantity: item.qty,
          unitPrice: item.price,
          kdsAssigned: item.requiresKitchen !== undefined ? item.requiresKitchen : true
        }))
      };

      const response = await fetch(API_URL + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        setCart([]);
        setActiveView('bill');
        fetchData();
        alert('Order sent to the kitchen!');
      } else if (response.status === 403) {
        alert('Table capacity reached. You cannot place an order.');
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnlinePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await fetch(API_URL + '/api/payments/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, qrSessionId: getQrSessionId() })
      });

      if (response.ok) {
        setIsProcessing(false);
        setPaymentPending(true);
      } else {
        setIsProcessing(false);
        alert('Failed to submit payment claim. Please try again.');
      }
    } catch (err) {
      setIsProcessing(false);
      console.error(err);
    }
  };

  if (paymentPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--sub-bg)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ padding: '2rem', backgroundColor: 'var(--card-bg)', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <div className="spinner" style={{ width: '60px', height: '60px', border: '5px solid #e5e7eb', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Waiting for Verification</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>The cashier is currently verifying your payment. This usually takes just a few seconds!</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--status-green)', color: 'var(--card-bg)', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</h1>
        <h2>Payment Successful!</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Thank you for dining with us. You are all set to go!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--sub-bg)', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <h1 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 800 }}>Cafinity</h1>
        {tableInfo && (
          <div style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.8rem', backgroundColor: tableInfo.isFull ? 'var(--status-red)' : 'var(--highlight-blue)', color: tableInfo.isFull ? '#fff' : 'var(--accent-primary)', borderRadius: '20px' }}>
            Table {tableInfo.tableNumber} • {tableInfo.activeCustomers}/{tableInfo.seats} Filled
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>

        {/* VIEW: MENU */}
        {activeView === 'menu' && (
          <>
            {/* Categories */}
            <div style={{ display: 'flex', overflowX: 'auto', padding: '1rem', gap: '0.75rem', scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCat(cat._id)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '99px',
                    border: 'none',
                    backgroundColor: activeCat === cat._id ? 'var(--accent-primary)' : 'var(--card-bg)',
                    color: activeCat === cat._id ? 'var(--card-bg)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products */}
            <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredProducts.map(product => (
                <div key={product._id} style={{ display: 'flex', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{product.name}</h3>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.2rem' }}>₹{Number(product.price || 0).toFixed(2)}</span>
                  </div>

                  {cart.find(i => i._id === product._id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--hover-bg)', padding: '0.25rem', borderRadius: '99px' }}>
                      <button onClick={() => updateQty(product._id, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><Minus size={16} /></button>
                      <span style={{ fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>{cart.find(i => i._id === product._id).qty}</span>
                      <button onClick={() => updateQty(product._id, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><Plus size={16} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCartClick(product)}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEW: CART */}
        {activeView === 'cart' && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag /> Your Cart</h2>

            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Your cart is empty. Let's add some delicious food!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '1rem', borderRadius: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>₹{(Number(item.price || 0) * item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--hover-bg)', padding: '0.25rem', borderRadius: '99px' }}>
                      <button onClick={() => updateQty(item._id, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                      <span style={{ fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item._id, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax (10%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent-primary)' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={submitOrder}
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '15px', border: 'none', backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem' }}
                >
                  Send Order to Kitchen
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: BILL */}
        {activeView === 'bill' && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Receipt /> My Bill</h2>

            {!openTab || openTab.total === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You have no open tab. Place an order to see your bill here!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '15px', padding: '1.5rem' }}>
                  {openTab.orders.map((order, idx) => (
                    <div key={order._id} style={{ marginBottom: idx === openTab.orders.length - 1 ? 0 : '1.5rem', borderBottom: idx === openTab.orders.length - 1 ? 'none' : '1px dashed #e5e7eb', paddingBottom: idx === openTab.orders.length - 1 ? 0 : '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Order #{order.orderNumber}</span>
                        <span style={{
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          backgroundColor: (order.status === 'Served' || order.status === 'Ready') ? '#dcfce7' : '#fef3c7',
                          color: (order.status === 'Served' || order.status === 'Ready') ? '#166534' : '#92400e'
                        }}>{order.status}</span>
                      </div>

                      {/* Status & Wait Time Display */}
                      {(() => {
                        if (!order.estimatedCompletionTime) return null;
                        
                        const estTime = new Date(order.estimatedCompletionTime);
                        const estTimeStr = estTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isCompleted = order.status === 'Ready' || order.status === 'Served' || order.status === 'Completed';
                        
                        if (isCompleted) {
                          const actualTime = new Date(order.actualCompletionTime || Date.now());
                          const diffMins = Math.floor((actualTime - new Date(order.createdAt)) / 60000);
                          const isLate = actualTime > estTime;
                          
                          if (isLate) {
                            return (
                              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #fecaca' }}>
                                <div style={{ color: '#b91c1c', fontSize: '0.85rem', fontWeight: 500 }}>
                                  ⚠️ Sorry for the wait! It took {diffMins} mins.
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 500 }}>
                                  ✅ Completed in {diffMins} mins!
                                </div>
                              </div>
                            );
                          }
                        } else {
                          const now = new Date();
                          const isDelayed = now > estTime;
                          const waitingMins = Math.floor((now - new Date(order.createdAt)) / 60000);
                          
                          if (isDelayed) {
                            return (
                              <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #fed7aa' }}>
                                <div style={{ color: '#c2410c', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                  ⚠️ Sorry for the delay!
                                </div>
                                <div style={{ color: '#ea580c', fontSize: '0.8rem' }}>
                                  The kitchen is experiencing high workload. You've been waiting {waitingMins} mins. We're working on it!
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                                  ⏱️ Estimated prep time: {order.estimatedWaitTime} mins
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                  Expected around {estTimeStr}
                                </div>
                              </div>
                            );
                          }
                        }
                      })()}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Subtotal: ₹{order.subtotal.toFixed(2)}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: 'var(--highlight-blue)', borderRadius: '15px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800 }}>
                    <span>Total Due</span>
                    <span style={{ color: 'var(--accent-primary)' }}>₹{openTab.total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('payment')}
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '15px', border: 'none', backgroundColor: '#10b981', color: 'var(--card-bg)', fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <CreditCard /> Pay Online Now
                </button>

                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
                  Or you can pay at the cashier or ask a waiter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: PAYMENT FORM */}
        {activeView === 'payment' && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Checkout</h2>
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '15px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                <span>Total Due</span>
                <span style={{ color: 'var(--accent-primary)' }}>₹{openTab.total.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Scan with GPay, PhonePe, or Paytm</h3>
                <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <QRCodeSVG
                    value={`upi://pay?pa=7010496249@nyes&pn=Cafinity&am=${openTab.total.toFixed(2)}&cu=INR`}
                    size={200}
                    level="H"
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Scan the QR code above using any UPI app. Once the payment is complete on your device, click the button below to close your tab.
                </p>
              </div>

              <form onSubmit={handleOnlinePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '15px', border: 'none', backgroundColor: 'var(--status-green)', color: 'var(--card-bg)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isProcessing ? 'Verifying Payment...' : 'I Have Paid'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('bill')}
                  style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Fixed Bottom Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem', zIndex: 20 }}>
        <button
          onClick={() => setActiveView('menu')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', color: activeView === 'menu' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: activeView === 'menu' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
            <span style={{ fontSize: '1.5rem' }}>🍔</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>Menu</span>
        </button>

        <button
          onClick={() => setActiveView('cart')}
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', color: activeView === 'cart' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: activeView === 'cart' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
            <ShoppingBag size={24} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>Cart</span>
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: 0, right: '5px', backgroundColor: 'var(--status-red)', color: 'var(--card-bg)', fontSize: '0.7rem', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('bill')}
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', color: (activeView === 'bill' || activeView === 'payment') ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: (activeView === 'bill' || activeView === 'payment') ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
            <Receipt size={24} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>My Bill</span>
          {openTab && openTab.total > 0 && (
            <span style={{ position: 'absolute', top: 5, right: '10px', width: '10px', height: '10px', backgroundColor: 'var(--status-orange)', borderRadius: '50%' }}></span>
          )}
        </button>
      </nav>

      {/* Alternative Suggestion Modal */}
      {suggestionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(5px)' }}>
          <div className="glass-card" style={{ backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ padding: '2rem 1.5rem', backgroundColor: 'var(--highlight-blue)', textAlign: 'center', position: 'relative' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 10px 25px rgba(99,102,241,0.2)' }}>
                <span style={{ fontSize: '2rem' }}>⚡</span>
              </div>
              <h2 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 800 }}>Faster Option Available</h2>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                The kitchen is a bit busy! Your <strong>{suggestionModal.originalProduct.name}</strong> has an estimated wait time of <strong>{suggestionModal.estimatedWaitTime} mins</strong>.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--sub-bg)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended Alternatives:</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suggestionModal.alternatives.map(alt => (
                  <button 
                    key={alt._id}
                    onClick={() => {
                      const waitSaved = suggestionModal.estimatedWaitTime - alt.estimatedWaitTime;
                      addToCart(alt, true, waitSaved);
                      setSuggestionModal(null);
                    }}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '12px', 
                      border: '1px solid var(--accent-primary)', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(99,102,241,0.1)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{alt.name}</span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {alt.similarityScore}% Match
                        </span>
                      </div>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>₹{Number(alt.price || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700 }}>
                      ⏱️ {alt.estimatedWaitTime} mins
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button 
                  onClick={() => {
                    addToCart(suggestionModal.originalProduct);
                    setSuggestionModal(null);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  No thanks, add {suggestionModal.originalProduct.name} anyway
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default CustomerMenu;
