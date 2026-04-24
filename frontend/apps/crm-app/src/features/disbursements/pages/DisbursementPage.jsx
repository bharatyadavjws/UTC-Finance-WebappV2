// src/features/disbursements/pages/DisbursementPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { authService } from '../../../services/authService';

const API_BASE = 'http://127.0.0.1:8000/api';

function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authService.getToken()}`,
      ...options.headers,
    },
  }).then(async r => {
    const json = await r.json();
    if (!r.ok) throw new Error(json.message || 'Request failed');
    return json;
  });
}

const STATUS_FLOW = {
  Pending:    { next: 'Disbursed', label: 'Mark Disbursed', bg: '#dbeafe', color: '#1e40af' },
  Disbursed:  { next: 'Active',    label: 'Mark Active',    bg: '#d1fae5', color: '#065f46' },
  Active:     { next: null,        label: null,             bg: null,      color: null       },
};

export default function DisbursementPage() {
  const [loans, setLoans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [retailerFilter, setRetailerFilter] = useState('ALL');
  const [statusFilter, setStatus] = useState('Pending');
  const [updating, setUpdating]   = useState(null);
  const [msg, setMsg]             = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/loans')
      .then(res => setLoans(Array.isArray(res.data) ? res.data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Get unique retailers for filter dropdown
  const retailers = useMemo(() => {
    const names = [...new Set(loans.map(l => l.retailer_name).filter(Boolean))];
    return names.sort();
  }, [loans]);

  // Only show loans relevant to disbursement workflow
  const disbursementLoans = useMemo(() => {
    return loans.filter(l =>
      ['Pending', 'Disbursed', 'Active'].includes(l.status)
    );
  }, [loans]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return disbursementLoans.filter(l => {
      const matchSearch =
        l.loan_code?.toLowerCase().includes(q) ||
        l.customer_name?.toLowerCase().includes(q) ||
        l.retailer_name?.toLowerCase().includes(q) ||
        l.agent_name?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'ALL' || l.status === statusFilter;
      const matchRetailer =
        retailerFilter === 'ALL' || l.retailer_name === retailerFilter;
      return matchSearch && matchStatus && matchRetailer;
    });
  }, [disbursementLoans, search, statusFilter, retailerFilter]);

  // Summary counts
  const summary = useMemo(() => ({
    pending:   disbursementLoans.filter(l => l.status === 'Pending').length,
    disbursed: disbursementLoans.filter(l => l.status === 'Disbursed').length,
    active:    disbursementLoans.filter(l => l.status === 'Active').length,
    total_pending_amount: disbursementLoans
      .filter(l => l.status === 'Pending')
      .reduce((s, l) => s + Number(l.net_disbursement ?? l.loan_amount ?? 0), 0),
  }), [disbursementLoans]);

  const handleStatusChange = async (loan, newStatus) => {
    if (!window.confirm(
      `Change "${loan.customer_name}" (${loan.loan_code}) to ${newStatus}?`
    )) return;

    setUpdating(loan.loan_code);
    setMsg('');
    try {
      await apiFetch(`/loans/${loan.loan_code}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMsg(`${loan.loan_code} → ${newStatus}`);
      setTimeout(() => setMsg(''), 3000);
      load();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Disbursement Panel</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Manage loan disbursement status retailer-wise
          </p>
        </div>
        {msg && (
          <span style={{
            background: msg.startsWith('Error') ? '#fee2e2' : '#d1fae5',
            color: msg.startsWith('Error') ? '#991b1b' : '#065f46',
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600'
          }}>
            {msg}
          </span>
        )}
      </div>

      {/* Summary */}
      <div style={grid3}>
        <SummaryCard
          label="Pending Disbursement"
          value={summary.pending}
          color="#f59e0b"
          sub={`₹${Number(summary.total_pending_amount).toLocaleString('en-IN')} to disburse`}
          onClick={() => setStatus('Pending')}
          active={statusFilter === 'Pending'}
        />
        <SummaryCard
          label="Disbursed"
          value={summary.disbursed}
          color="#2563eb"
          sub="Awaiting activation"
          onClick={() => setStatus('Disbursed')}
          active={statusFilter === 'Disbursed'}
        />
        <SummaryCard
          label="Active"
          value={summary.active}
          color="#10b981"
          sub="Fully active loans"
          onClick={() => setStatus('Active')}
          active={statusFilter === 'Active'}
        />
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={labelStyle}>Search</label>
          <input
            style={inputStyle}
            placeholder="Loan code, customer, retailer, agent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Retailer</label>
          <select style={inputStyle} value={retailerFilter} onChange={e => setRetailerFilter(e.target.value)}>
            <option value="ALL">All Retailers</option>
            {retailers.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All</option>
            <option value="Pending">Pending</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Active">Active</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={empty}>Loading loans...</div>
        ) : error ? (
          <div style={{ ...empty, color: '#ef4444' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={empty}>No loans found for this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <Th>Loan Code</Th>
                  <Th>Customer</Th>
                  <Th>Retailer</Th>
                  <Th>Agent</Th>
                  <Th>Loan Amount</Th>
                  <Th>Net Disburse</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(loan => {
                  const flow = STATUS_FLOW[loan.status];
                  return (
                    <tr key={loan.loan_code} style={trow}>
                      <td style={td}>
                        <code style={{ fontSize: '12px' }}>{loan.loan_code}</code>
                      </td>
                      <td style={{ ...td, fontWeight: '600' }}>{loan.customer_name}</td>
                      <td style={td}>{loan.retailer_name ?? '—'}</td>
                      <td style={{ ...td, color: '#64748b' }}>{loan.agent_name ?? '—'}</td>
                      <td style={td}>
                        ₹{Number(loan.loan_amount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ ...td, fontWeight: '700', color: '#2563eb' }}>
                        ₹{Number(loan.net_disbursement ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td style={td}><StatusPill status={loan.status} /></td>
                      <td style={td}>
                        {flow?.next ? (
                          <button
                            disabled={updating === loan.loan_code}
                            onClick={() => handleStatusChange(loan, flow.next)}
                            style={{
                              background: flow.bg,
                              color: flow.color,
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 14px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {updating === loan.loan_code ? '...' : flow.label}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────
function SummaryCard({ label, value, color, sub, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        padding: '20px 24px',
        borderRadius: '16px',
        border: `2px solid ${active ? color : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Pending:   { bg: '#fef3c7', color: '#92400e' },
    Disbursed: { bg: '#dbeafe', color: '#1e40af' },
    Active:    { bg: '#d1fae5', color: '#065f46' },
    Rejected:  { bg: '#fee2e2', color: '#991b1b' },
    Closed:    { bg: '#f1f5f9', color: '#475569' },
  };
  const s = map[status] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {status ?? '—'}
    </span>
  );
}

function Th({ children }) {
  return (
    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const grid3      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' };
const card       = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' };
const table      = { width: '100%', borderCollapse: 'collapse' };
const trow       = { borderTop: '1px solid #f1f5f9' };
const td         = { padding: '13px 16px', fontSize: '14px', color: '#1e293b' };
const empty      = { padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' };