import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboardServices';
import { retailerService } from '../../../services/retailerService';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retailers, setRetailers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [result, retailerResult] = await Promise.all([
          dashboardService.getStats(),
          retailerService.getRetailers(),
        ]);
        setData(result);
        setRetailers(retailerResult.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <div style={{ padding: '100px 20px', textAlign: 'center' }}>Loading dashboard...</div>;

  const { stats } = data || {};

  const filteredRetailers = retailers.filter(r =>
    r.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Stats Grid — 4 KPIs only */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
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

        {/* Retailer List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Retailers</h2>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>{filteredRetailers.length} found</span>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by shop, owner or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            fontSize: '14px',
            marginBottom: '14px',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Retailer Cards */}
        <div style={{ display: 'grid', gap: '10px' }}>
          {filteredRetailers.map(retailer => {
            const isBlocked = retailer.status === 'Blocked';
            return (
              <div
                key={retailer.id}
                style={{
                  ...cardStyle,
                  padding: '14px 16px',
                  opacity: isBlocked ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{retailer.shop_name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{retailer.owner_name} · {retailer.city}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{retailer.mobile}</div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: isBlocked ? '#fdecea' : '#e8f5e9',
                    color: isBlocked ? '#b71c1c' : '#1b5e20',
                    whiteSpace: 'nowrap',
                  }}>
                    {retailer.status}
                  </div>
                </div>
                <button
                  disabled={isBlocked}
                  onClick={() => !isBlocked && navigate('/loans/create', { state: { retailer } })}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    background: isBlocked ? '#e5e7eb' : '#0f9d58',
                    color: isBlocked ? '#9ca3af' : '#fff',
                  }}
                >
                  {isBlocked ? 'Retailer Blocked' : 'Start Loan'}
                </button>
              </div>
            );
          })}
          {filteredRetailers.length === 0 && (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No retailers found.</div>
          )}
        </div>

      </div>
    </div>
  );
}
