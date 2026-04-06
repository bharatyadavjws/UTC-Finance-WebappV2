import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#fff',
          borderRadius: '20px',
          padding: '32px 28px',
          border: '1px solid #dbe2ea',
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#111827',
              marginBottom: '4px',
            }}
          >
            UTC Finance
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Agent Portal — Sign in to continue
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fdecea',
              color: '#b71c1c',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '14px',
              marginBottom: '16px',
              border: '1px solid #f5c2c7',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@utcfinance.com"
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#9ca3af' : '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          UTC Finance Pvt. Ltd. — Agent App
        </div>
      </div>
    </div>
  );
}