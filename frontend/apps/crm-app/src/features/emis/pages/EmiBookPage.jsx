// src/features/emis/pages/EmiBookPage.jsx
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

export default function EmiBookPage() {
  const [emis, setEmis]         = useState([]);
  const [summary, setSummary]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [marking, setMarking]   = useState(null); // emi id being updated

  const load = () => {
    setLoading(true);
    apiFetch('/emis')
      .then(res => {
        setEmis(res.data?.emis ?? []);
        setSummary(res.data?.summary ?? {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return emis.filter(e => {
      const q = search.toLowerCase();
      const matchSearch =
        e.loan_code?.toLowerCase().includes(q) ||
        e.customer_name?.toLowerCase().includes(q) ||
        e.agent_name?.toLowerCase().includes(q) ||
        e.retailer_name?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'ALL' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [emis, search, statusFilter]);

  const handleMarkPaid = async (emi) => {
    if (!window.confirm(`Mark EMI #${emi.installment_number} for ${emi.customer_name} as Paid?`)) return;
    setMarking(emi.id);
    try {
      await apiFetch(`/emis/${emi.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paid' }),
      });
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setMarking(null);
    }
  };

  const handleMarkOverdue = async (emi) => {
    setMarking(emi.id);
    try {
      await apiFetch(`/emis/${emi.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'overdue' }),
      });
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setMarking(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>EMI Book</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
          All EMI installments across all loans
        </p>
      </div>

      {/* Summary Cards */}
      <div style={grid4}>
        <SummaryCard
          label="Total EMIs"
          value={summary.total ?? 0}
          color="#2563eb"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending ?? 0}
          color="#f59e0b"
          sub={`₹${Number(summary.total_pending_amount ?? 0).toLocaleString('en-IN')}`}
        />
        <SummaryCard
          label="Collected"
          value={summary.paid ?? 0}
          color="#10b981"
          sub={`₹${Number(summary.total_collected ?? 0).toLocaleString('en-IN')}`}
        />
        <SummaryCard
          label="Overdue"
          value={summary.overdue ?? 0}
          color="#ef4444"
        />
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={labelStyle}>Search</label>
          <input
            style={inputStyle}
            placeholder="Loan code, customer, agent, retailer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={empty}>Loading EMI book...</div>
        ) : error ? (
          <div style={{ ...empty, color: '#ef4444' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={empty}>
            {emis.length === 0
              ? 'No EMI schedules generated yet. Go to a loan and generate its EMI schedule first.'
              : 'No EMIs match your filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <Th>#</Th>
                  <Th>Loan Code</Th>
                  <Th>Customer</Th>
                  <Th>Agent</Th>
                  <Th>Retailer</Th>
                  <Th>Due Date</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Paid On</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={trow}>
                    <td style={{ ...td, color: '#94a3b8', fontSize: '13px' }}>{e.installment_number}</td>
                    <td style={td}><code style={{ fontSize: '12px' }}>{e.loan_code}</code></td>
                    <td style={{ ...td, fontWeight: '600' }}>{e.customer_name}</td>
                    <td style={{ ...td, color: '#64748b' }}>{e.agent_name}</td>
                    <td style={{ ...td, color: '#64748b' }}>{e.retailer_name}</td>
                    <td style={{ ...td, color: e.status === 'overdue' ? '#ef4444' : '#1e293b', fontWeight: e.status === 'overdue' ? '700' : '400' }}>
                      {e.due_date}
                    </td>
                    <td style={{ ...td, fontWeight: '700' }}>
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={td}><StatusPill status={e.status} /></td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: '13px' }}>{e.paid_at ?? '—'}</td>
                    <td style={td}>
                      {e.status !== 'paid' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={marking === e.id}
                            onClick={() => handleMarkPaid(e)}
                            style={paidBtn}
                          >
                            {marking === e.id ? '...' : 'Mark Paid'}
                          </button>
                          {e.status !== 'overdue' && (
                            <button
                              disabled={marking === e.id}
                              onClick={() => handleMarkOverdue(e)}
                              style={overdueBtn}
                            >
                              Overdue
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────
function SummaryCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    paid:    { bg: '#d1fae5', color: '#065f46' },
    overdue: { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {status}
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
const grid4      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' };
const card       = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' };
const table      = { width: '100%', borderCollapse: 'collapse' };
const trow       = { borderTop: '1px solid #f1f5f9' };
const td         = { padding: '13px 16px', fontSize: '14px', color: '#1e293b' };
const empty      = { padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const paidBtn    = { background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const overdueBtn = { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };