import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import PaymentModal from './PaymentModal';

const OrderView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [catRes, prodRes] = await Promise.all([
          fetch('http://localhost:5000/api/categories', { headers }),
          fetch('http://localhost:5000/api/products', { headers })
        ]);
        
        if (catRes.ok && prodRes.ok) {
          const catData = await catRes.json();
          const prodData = await prodRes.json();
          
          setCategories(catData);
          setProducts(prodData);
          if (catData.length > 0) setActiveCat(catData[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => p.category === activeCat || p.category?._id === activeCat);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item._id === product._id);
      if (exists) {
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const submitOrder = async (paymentDetails) => {
    try {
      const token = localStorage.getItem('userToken');
      
      const orderPayload = {
        tableId,
        channel: 'Cashier',
        items: cart.map(item => ({
          product: item._id,
          quantity: item.qty,
          unitPrice: item.price,
          kdsAssigned: item.kdsAssigned !== undefined ? item.kdsAssigned : true
        }))
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        addNotification('Order sent to Kitchen successfully!', 'success');
        navigate('/floor');
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/floor')} className="glass-card" style={{ padding: '0.75rem', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0 }}>Add Items to Order</h2>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button 
              key={cat._id} 
              onClick={() => setActiveCat(cat._id)}
              className="glass-card"
              style={{ 
                padding: '0.75rem 1.5rem', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: activeCat === cat._id ? (cat.color || 'var(--accent-primary)') : 'white',
                color: activeCat === cat._id ? 'white' : 'var(--text-primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {filteredProducts.map(product => (
            <div 
              key={product._id} 
              className="glass-card" 
              onClick={() => addToCart(product)}
              style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{product.name}</h4>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '1.2rem' }}>${product.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ width: '380px', margin: '1.5rem 1.5rem 1.5rem 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0 }}>Current Order</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {cart.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>Cart is empty</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => updateQty(item._id, -1)} style={{ padding: '0.25rem', borderRadius: '5px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)} style={{ padding: '0.25rem', borderRadius: '5px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}><Plus size={14} /></button>
                    <button onClick={() => removeItem(item._id)} style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--status-red)', marginLeft: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0 0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <button className="pill-btn" onClick={handleCheckout} disabled={cart.length === 0} style={{ width: '100%', padding: '1rem', opacity: cart.length === 0 ? 0.5 : 1 }}>
            Checkout & Send to Kitchen
          </button>
        </div>
      </div>
      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        total={total} 
        onComplete={submitOrder} 
      />
    </div>
  );
};

export default OrderView;
