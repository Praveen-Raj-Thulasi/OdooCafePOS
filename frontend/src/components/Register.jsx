import { API_URL } from '../config';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, User, Mail, Lock, Briefcase } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rootPassword, setRootPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(API_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'Admin', rootPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        sessionStorage.setItem('userToken', data.token);
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('userName', data.name);
        
        if (data.role === 'Admin') navigate('/dashboard');
        else if (data.role === 'Cashier') navigate('/floor');
        else if (data.role === 'Kitchen') navigate('/kds');
        else if (data.role === 'Servant') navigate('/servant');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to backend server.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--sub-bg)' }}>
      
      {/* Left Branding Side */}
      <div style={{ 
        flex: 1, 
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("/bg-cafe-new.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--card-bg)',
        padding: '3rem',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ display: 'inline-flex', padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '50%', marginBottom: '2rem', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <Coffee size={72} color="white" />
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '4rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Cafinity
          </h1>
          <p style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '1.35rem', lineHeight: '1.6', opacity: 0.95, margin: 0, textShadow: '0 2px 5px rgba(0,0,0,0.5)', fontWeight: 300 }}>
            Join the team. Sign up to start managing orders, tracking tables, and serving joy.
          </p>
        </div>
      </div>

      {/* Right Register Side */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        backgroundColor: '#f4f4f5',
        position: 'relative'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          backgroundColor: 'var(--card-bg)', 
          padding: '3.5rem 3rem', 
          borderRadius: '24px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontSize: '2rem', fontWeight: 700, color: '#18181b', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>Create Account</h2>
            <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '1rem', color: '#71717a', margin: 0 }}>Register to access the cafe system.</p>
          </div>
          
          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={20} color="#a1a1aa" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ 
                    width: '100%', padding: '1.1rem 1rem 1.1rem 3.5rem', borderRadius: '16px', 
                    border: '2px solid transparent', fontSize: '1rem', outline: 'none', 
                    boxSizing: 'border-box', backgroundColor: '#f4f4f5', color: '#27272a',
                    transition: 'all 0.2s ease', fontFamily: '"Inter", sans-serif'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#d4d4d8'; e.target.style.backgroundColor = 'var(--card-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#f4f4f5'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="#a1a1aa" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ 
                    width: '100%', padding: '1.1rem 1rem 1.1rem 3.5rem', borderRadius: '16px', 
                    border: '2px solid transparent', fontSize: '1rem', outline: 'none', 
                    boxSizing: 'border-box', backgroundColor: '#f4f4f5', color: '#27272a',
                    transition: 'all 0.2s ease', fontFamily: '"Inter", sans-serif'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#d4d4d8'; e.target.style.backgroundColor = 'var(--card-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#f4f4f5'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Create Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color="#a1a1aa" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    width: '100%', padding: '1.1rem 1rem 1.1rem 3.5rem', borderRadius: '16px', 
                    border: '2px solid transparent', fontSize: '1rem', outline: 'none', 
                    boxSizing: 'border-box', backgroundColor: '#f4f4f5', color: '#27272a',
                    transition: 'all 0.2s ease', fontFamily: '"Inter", sans-serif'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#d4d4d8'; e.target.style.backgroundColor = 'var(--card-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#f4f4f5'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Access Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color="#ef4444" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  placeholder="Root Admin Key Required" 
                  value={rootPassword}
                  onChange={(e) => setRootPassword(e.target.value)}
                  required
                  style={{ 
                    width: '100%', padding: '1.1rem 1rem 1.1rem 3.5rem', borderRadius: '16px', 
                    border: '2px solid transparent', fontSize: '1rem', outline: 'none', 
                    boxSizing: 'border-box', backgroundColor: '#fef2f2', color: '#991b1b',
                    transition: 'all 0.2s ease', fontFamily: '"Inter", sans-serif'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#fca5a5'; e.target.style.backgroundColor = 'var(--card-bg)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.backgroundColor = '#fef2f2'; }}
                />
              </div>
            </div>
            
            <button type="submit" style={{ 
              width: '100%', padding: '1.1rem', fontSize: '1.05rem', fontWeight: 600,
              backgroundColor: 'var(--accent-primary)', color: 'var(--card-bg)', border: 'none', 
              borderRadius: '99px', marginTop: '1rem', cursor: 'pointer',
              transition: 'all 0.2s ease', fontFamily: '"Montserrat", sans-serif', letterSpacing: '0.5px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)'; }}
            >
              Sign Up
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In here</Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile responsiveness embedded styles */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="minHeight: '100vh'"] {
            flex-direction: column !important;
          }
          div[style*="flex: 1"] {
            padding: 2rem !important;
          }
          h1 {
            font-size: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
