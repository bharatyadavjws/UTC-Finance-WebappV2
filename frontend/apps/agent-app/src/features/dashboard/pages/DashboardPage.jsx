import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboardServices';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await dashboardService.getStats();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <div style={{ padding: '100px 20px', textAlign: 'center' }}>Loading dashboard...</div>;

  const { stats, recent_loans } = data || {};

  const cardStyle = {
    background: '#fff',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const labelStyle = { fontSize: '13px', color: '#6b7280', fontWeight: '600' };
  const valueStyle = { fontSize: '24px', fontWeight: '800', color: '#111827' };

  return (
    <div style={{ padding: '100px 16px 120px', background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '20px' }}>Dashboard</h1>

        {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={cardStyle}>
            <div style={labelStyle}>Retailers</div>
            <div style={valueStyle}>{stats.total_retailers}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Total Loans</div>
            <div style={valueStyle}>{stats.total_loans}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Pending</div>
            <div style={{ ...valueStyle, color: '#f57f17' }}>{stats.pending_loans}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Active</div>
            <div style={{ ...valueStyle, color: '#1b5e20' }}>{stats.active_loans}</div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '24px', background: '#111827', color: '#fff' }}>
          <div style={{ ...labelStyle, color: '#9ca3af' }}>Total Disbursed</div>
          <div style={{ ...valueStyle, color: '#fff', fontSize: '32px' }}>
            ₹ {stats.total_disbursed.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Recent Applications */}
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Recent Loans</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          {recent_loans.map(loan => (
            <div key={loan.loan_code} onClick={() => navigate('/loans')} style={{ ...cardStyle, cursor: 'pointer', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{loan.customer_name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{loan.loan_code}</div>
                </div>
                <div style={{ 
                  padding: '4px 10px', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  background: loan.status === 'Pending' ? '#fff8e1' : '#e8f5e9',
                  color: loan.status === 'Pending' ? '#f57f17' : '#1b5e20'
                }}>
                  {loan.status}
                </div>
              </div>
            </div>
          ))}
          {recent_loans.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No recent activity.</div>}
        </div>

      </div>
    </div>
  );
}
