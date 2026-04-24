// src/features/users/pages/UserListPage.jsx
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

export default function UserListPage() {
  const [agents, setAgents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/agents')
      .then(res => setAgents(res.data ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return agents.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    );
  }, [agents, search]);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Agents</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            All field agents on the platform
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={addBtn}>+ Add Agent</button>
      </div>

      {/* Summary */}
      <div style={grid3}>
        <SummaryCard label="Total Agents"    value={agents.length}                                              color="#2563eb" />
        <SummaryCard label="Total Retailers" value={agents.reduce((s, a) => s + (a.total_retailers ?? 0), 0)}  color="#10b981" />
        <SummaryCard label="Total Loans"     value={agents.reduce((s, a) => s + (a.total_loans ?? 0), 0)}      color="#6366f1" />
      </div>

      {/* Search */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <label style={labelStyle}>Search Agents</label>
        <input
          style={inputStyle}
          placeholder="Name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={empty}>Loading agents...</div>
        ) : error ? (
          <div style={{ ...empty, color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={table}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Retailers</Th>
                <Th>Total Loans</Th>
                <Th>Pending</Th>
                <Th>Active</Th>
                <Th>Joined</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={empty}>No agents found.</td></tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} style={trow}>
                    <td style={{ ...td, fontWeight: '600' }}>{a.name}</td>
                    <td style={{ ...td, color: '#64748b' }}>{a.email}</td>
                    <td style={td}>{a.total_retailers ?? 0}</td>
                    <td style={td}>{a.total_loans ?? 0}</td>
                    <td style={td}><span style={pendingPill}>{a.pending_loans ?? 0}</span></td>
                    <td style={td}><span style={activePill}>{a.active_loans ?? 0}</span></td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: '13px' }}>{a.joined_at ?? '—'}</td>
                    <td style={td}>
                      <button onClick={() => setSelected(a)} style={viewBtn}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Agent Detail Drawer */}
      {selected && (
        <AgentDrawer agent={selected} onClose={() => setSelected(null)} />
      )}

      {/* Add Agent Modal */}
      {showAdd && (
        <AddAgentModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}

    </div>
  );
}

// ── Agent Detail Drawer ────────────────────────────────────────
function AgentDrawer({ agent, onClose }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/agents/${agent.id}`)
      .then(res => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [agent.id]);

  return (
    <>
      <div onClick={onClose} style={backdrop} />
      <div style={drawer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{agent.name}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>{agent.email}</p>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        ) : !detail ? (
          <p style={{ color: '#ef4444' }}>Failed to load agent details.</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>

            <div style={grid2}>
              <MiniStat label="Total Retailers" value={detail.total_retailers} />
              <MiniStat label="Total Loans"     value={detail.total_loans} />
            </div>

            <DrawerSection title={`Retailers (${detail.retailers?.length ?? 0})`}>
              {detail.retailers?.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No retailers yet.</p>
              ) : detail.retailers?.map(r => (
                <div key={r.retailer_code} style={drawerRow}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{r.shop_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.city} · {r.mobile}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </DrawerSection>

            <DrawerSection title={`Recent Loans (${detail.recent_loans?.length ?? 0})`}>
              {detail.recent_loans?.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No loans yet.</p>
              ) : detail.recent_loans?.map(l => (
                <div key={l.loan_code} style={drawerRow}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{l.customer_name}</div>
                    <code style={{ fontSize: '11px', color: '#94a3b8' }}>{l.loan_code}</code>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>
                      ₹{Number(l.loan_amount ?? 0).toLocaleString('en-IN')}
                    </div>
                    <StatusPill status={l.status} />
                  </div>
                </div>
              ))}
            </DrawerSection>

          </div>
        )}
      </div>
    </>
  );
}

// ── Add Agent Modal ────────────────────────────────────────────
function AddAgentModal({ onClose, onCreated }) {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/agents', { method: 'POST', body: JSON.stringify(form) });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={backdrop} />
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Add New Agent</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              style={inputStyle}
              placeholder="agent@utcfinance.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Shared Components ──────────────────────────────────────────
function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>{value ?? 0}</div>
    </div>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      <div style={{ display: 'grid', gap: '10px' }}>{children}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === 'Active' || status === 'active';
  const pending = status === 'Pending' || status === 'pending';
  const bg    = active ? '#d1fae5' : pending ? '#fef3c7' : '#f1f5f9';
  const color = active ? '#065f46' : pending ? '#92400e' : '#475569';
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {status ?? '—'}
    </span>
  );
}

function Th({ children }) {
  return (
    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </th>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const grid2     = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const grid3     = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' };
const card      = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' };
const table     = { width: '100%', borderCollapse: 'collapse' };
const trow      = { borderTop: '1px solid #f1f5f9' };
const td        = { padding: '14px 20px', fontSize: '14px', color: '#1e293b' };
const empty     = { padding: '40px', textAlign: 'center', color: '#94a3b8', display: 'block' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const viewBtn   = { background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#475569' };
const addBtn    = { background: '#2563eb', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#fff' };
const backdrop  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 };
const drawer    = { position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '32px 28px', overflowY: 'auto' };
const modal     = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '420px', background: '#fff', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50, padding: '32px' };
const closeBtn  = { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '700' };
const drawerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px' };
const pendingPill = { background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const activePill  = { background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const submitBtn = { background: '#2563eb', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#fff' };
const cancelBtn = { background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#475569' };