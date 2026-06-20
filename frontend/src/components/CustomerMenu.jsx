import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { Mic, MicOff, ShoppingBag, Plus, Minus } from 'lucide-react';

const mockProducts = [
  { id: 'p1', name: 'Latte Art Special', category: 'c1', price: 5.50, image: '/cafe_latte.png' },
  { id: 'p2', name: 'Espresso', category: 'c1', price: 3.00 },
  { id: 'p3', name: 'Croissant', category: 'c2', price: 4.20 },
  { id: 'p4', name: 'Avocado Toast', category: 'c3', price: 9.50 },
];

const CustomerMenu = () => {
  const { tableId } = useParams();
  const socket = useSocket();
  const { addNotification } = useNotification();
  const [cart, setCart] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Voice AI Logic
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setTranscript(text);
      
      // Super basic NLP matching for hackathon
      let addedSomething = false;
      mockProducts.forEach(product => {
        const productName = product.name.toLowerCase();
        // Check if spoken text contains a product name (e.g. "latte", "espresso")
        if (text.includes(productName.split(' ')[0])) { 
          addToCart(product);
          addedSomething = true;
        }
      });

      if (addedSomething) {
        addNotification(`Added items from voice: "${text}"`, 'success');
      } else {
        addNotification(`Couldn't find items matching: "${text}"`, 'warning');
      }
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    // Expose toggle globally for the button
    window.toggleVoice = () => {
      if (isListening) recognition.stop();
      else recognition.start();
    };

    return () => recognition.abort();
  }, [isListening, addNotification]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const placeOrder = () => {
    if (cart.length === 0) return;
    
    if (socket) {
      // Fake placing order to backend
      socket.emit('order_created', { orderNumber: `QR-${Math.floor(Math.random()*1000)}` });
      socket.emit('new_kitchen_ticket', { tableId, orderNumber: `QR-${Math.floor(Math.random()*1000)}` });
    }
    
    setCart([]);
    addNotification('Order placed successfully! The kitchen is preparing your food.', 'success');
  };

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      
      {/* Hero Header */}
      <div style={{ height: '250px', backgroundImage: 'url(/cafe_interior.png)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        <div style={{ position: 'relative', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Odoo Cafe</h1>
          <p style={{ opacity: 0.9, fontSize: '1.2rem', margin: '0.5rem 0 0 0' }}>Table {tableId}</p>
        </div>
      </div>

      {/* Voice Assistant Banner */}
      <div style={{ margin: '1rem', padding: '1.5rem', backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-float)' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Voice Ordering</h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Tap the mic and say "I want a Latte"</p>
          {transcript && <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic', fontSize: '0.85rem' }}>"{transcript}"</p>}
        </div>
        <button 
          onClick={() => window.toggleVoice && window.toggleVoice()}
          style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', backgroundColor: 'white', color: isListening ? 'var(--status-red)' : 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
        >
          {isListening ? <span className="pulse-dot" style={{ width: '20px', height: '20px', backgroundColor: 'var(--status-red)', borderRadius: '50%' }}></span> : <Mic size={28} />}
        </button>
      </div>

      {/* Product List */}
      <div style={{ padding: '1rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Our Menu</h2>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {mockProducts.map(product => (
            <div key={product.id} className="glass-card" style={{ display: 'flex', padding: '1rem', gap: '1rem', alignItems: 'center' }}>
              {product.image ? (
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', backgroundColor: '#f3f4f6' }} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{product.name}</h4>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${product.price.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => addToCart(product)}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-color)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Plus size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Overlay */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '1.5rem', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', boxShadow: '0 -10px 25px rgba(0,0,0,0.05)', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <ShoppingBag size={20} color="var(--accent-primary)" />
              <span>{cart.reduce((s, i) => s + i.qty, 0)} Items</span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${total.toFixed(2)}</span>
          </div>
          <button onClick={placeOrder} className="pill-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            Send Order to Kitchen
          </button>
        </div>
      )}

    </div>
  );
};

export default CustomerMenu;
