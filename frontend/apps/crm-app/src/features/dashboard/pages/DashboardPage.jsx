// src/features/dashboard/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { isUtcTeam, user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [recentLoans, setRecent] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('utc_crm_token')}`,
        'Accept': 'application/json',
      }
    })
    .then(r => r.json())
    .then(json => {
      setStats(json.data?.stats ?? {});
      setRecent(json.data?.recent_loans ?? []);
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#94a3b8' }}>Loading dashboard...</div>;

  return (
    <div style={{ display: 'grid', gap: '32px' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
          Welcome back, {user.name}
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      {isUtcTeam ? <UtcStats stats={stats} /> : <InvestorStats stats={stats} />}

      {/* Recent Loans Table */}
      <RecentLoans loans={recentLoans} />

    </div>
  );
}

// ── UTC Team Stats ─────────────────────────────────────────────
function UtcStats({ stats }) {
  return (
    <div style={grid4}>
      <StatCard
        label="Total Loans"
        value={stats?.total_loans ?? 0}
        color="#2563eb"
        sub="All time"
      />
      <StatCard
        label="Pending Approval"
        value={stats?.pending_loans ?? 0}
        color="#f59e0b"
        sub="Awaiting action"
      />
      <StatCard
        label="Active Loans"
        value={stats?.active_loans ?? 0}
        color="#10b981"
        sub="Currently running"
      />
      <StatCard
        label="Total Disbursed"
        value={`₹${Number(stats?.total_disbursed ?? 0).toLocaleString('en-IN')}`}
        color="#6366f1"
        sub="Approved + Active"
      />
      <StatCard
        label="Total Retailers"
        value={stats?.total_retailers ?? 0}
        color="#0891b2"
        sub="Onboarded"
      />
      <StatCard
        label="Total Agents"
        value={stats?.total_agents ?? 0}
        color="#7c3aed"
        sub="On platform"
      />
    </div>
  );
}

// ── Investor Stats ─────────────────────────────────────────────
function InvestorStats({ stats }) {
  return (
    <div style={grid3}>
      <StatCard label="My Investment"      value={`₹${Number(stats?.investment ?? 0).toLocaleString('en-IN')}`}    color="#2563eb" />
      <StatCard label="Returns Received"   value={`₹${Number(stats?.returns ?? 0).toLocaleString('en-IN')}`}       color="#10b981" />
      <StatCard label="Next Expected"      value={`₹${Number(stats?.next_return ?? 0).toLocaleString('en-IN')}`}   color="#6366f1" />
    </div>
  );
}

// ── Recent Loans Table ─────────────────────────────────────────
function RecentLoans({ loans }) {
  const navigate = useNavigate();

  return (
    <div style={card}>
      <div style={cardHeader}>
        <span style={{ fontWeight: '700', fontSize: '15px' }}>Recent Loan Applications</span>
        <button onClick={() => navigate('/loans')} style={viewAllBtn}>View All →</button>
      </div>
      <table style={table}>
        <thead>
          <tr style={thead}>
            <th style={th}>Loan Code</th>
            <th style={th}>Customer</th>
            <th style={th}>EMI Amount</th>
            <th style={th}>Date</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {loans.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No recent loans</td></tr>
          ) : (
            loans.map(loan => (
              <tr
                key={loan.loan_code}
                style={trow}
                onClick={() => navigate(`/loans/${loan.loan_code}`)}
              >
                <td style={td}><code style={{ fontSize: '13px' }}>{loan.loan_code}</code></td>
                <td style={td}>{loan.customer_name}</td>
                <td style={td}>₹{Number(loan.emi_amount ?? 0).toLocaleString('en-IN')}</td>
                <td style={td}>{loan.created_at
                  ? new Date(loan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
                </td>
                <td style={td}><StatusPill status={loan.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={statCard}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '30px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    approved:  { bg: '#d1fae5', color: '#065f46' },
    active:    { bg: '#dbeafe', color: '#1e40af' },
    rejected:  { bg: '#fee2e2', color: '#991b1b' },
    closed:    { bg: '#f1f5f9', color: '#475569' },
  };
  const key = (status ?? '').toLowerCase();
  const style = map[key] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: style.bg, color: style.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {status ?? 'Unknown'}
    </span>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const grid4    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' };
const grid3    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' };
const statCard = { background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const card     = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' };
const viewAllBtn = { background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', fontSize: '13px' };
const table    = { width: '100%', borderCollapse: 'collapse' };
const thead    = { background: '#f8fafc' };
const th       = { padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const trow     = { borderTop: '1px solid #f1f5f9', cursor: 'pointer' };
const td       = { padding: '14px 24px', fontSize: '14px', color: '#1e293b' };