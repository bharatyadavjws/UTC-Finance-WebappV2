// src/features/retailers/pages/RetailerListPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { authService } from '../../../services/authService';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchRetailers() {
  const res = await fetch(`${API_BASE}/retailers`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authService.getToken()}`,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to load retailers');
  return json.data ?? [];
}

export default function RetailerListPage() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [selected, setSelected]   = useState(null); // for detail drawer

  useEffect(() => {
    fetchRetailers()
      .then(setRetailers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return retailers.filter(r => {
      const q = search.toLowerCase();
      const matchSearch =
        r.shop_name?.toLowerCase().includes(q) ||
        r.owner_name?.toLowerCase().includes(q) ||
        r.mobile?.includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [retailers, search, statusFilter]);

  const summary = useMemo(() => ({
    total:    retailers.length,
    active:   retailers.filter(r => r.status === 'Active').length,
    inactive: retailers.filter(r => r.status === 'Inactive').length,
  }), [retailers]);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Retailers</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
          All onboarded retailers across all agents
        </p>
      </div>

      {/* Summary Cards */}
      <div style={grid3}>
        <SummaryCard label="Total Retailers" value={summary.total}    color="#2563eb" />
        <SummaryCard label="Active"          value={summary.active}   color="#10b981" />
        <SummaryCard label="Inactive"        value={summary.inactive} color="#94a3b8" />
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={labelStyle}>Search</label>
          <input
            style={inputStyle}
            placeholder="Shop name, owner, mobile, city, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={empty}>Loading retailers...</div>
        ) : error ? (
          <div style={{ ...empty, color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={table}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <Th>Code</Th>
                <Th>Shop Name</Th>
                <Th>Owner</Th>
                <Th>Mobile</Th>
                <Th>City</Th>
                <Th>State</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={empty}>No retailers found.</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} style={trow}>
                    <td style={td}><code style={{ fontSize: '12px', color: '#64748b' }}>{r.id}</code></td>
                    <td style={{ ...td, fontWeight: '600' }}>{r.shop_name ?? '—'}</td>
                    <td style={td}>{r.owner_name ?? '—'}</td>
                    <td style={td}>{r.mobile ?? '—'}</td>
                    <td style={td}>{r.city ?? '—'}</td>
                    <td style={td}>{r.state ?? '—'}</td>
                    <td style={td}><StatusPill status={r.status} /></td>
                    <td style={td}>
                      <button onClick={() => setSelected(r)} style={viewBtn}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <RetailerDrawer retailer={selected} onClose={() => setSelected(null)} />
      )}

    </div>
  );
}

// ── Retailer Detail Drawer ─────────────────────────────────────
function RetailerDrawer({ retailer: r, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
      />
      {/* Panel */}
      <div style={drawer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{r.shop_name}</h2>
            <code style={{ fontSize: '12px', color: '#94a3b8' }}>{r.id}</code>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <DrawerSection title="Basic Info">
            <DRow label="Owner"    value={r.owner_name} />
            <DRow label="Mobile"   value={r.mobile} />
            <DRow label="Alt Mobile" value={r.alternate_mobile} />
            <DRow label="Email"    value={r.email} />
            <DRow label="Status"   value={<StatusPill status={r.status} />} />
          </DrawerSection>

          <DrawerSection title="Business Details">
            <DRow label="GST Number" value={r.gst_number} />
            <DRow label="PAN Number" value={r.pan_number} />
          </DrawerSection>

          <DrawerSection title="Address">
            <DRow label="Address Line 1" value={r.address_line_1} />
            <DRow label="Address Line 2" value={r.address_line_2} />
            <DRow label="City"    value={r.city} />
            <DRow label="State"   value={r.state} />
            <DRow label="Pincode" value={r.pincode} />
          </DrawerSection>

          <DrawerSection title="Meta">
            <DRow label="Joined" value={r.created_at
              ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
            />
          </DrawerSection>
        </div>
      </div>
    </>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      <div style={{ display: 'grid', gap: '10px' }}>{children}</div>
    </div>
  );
}

function DRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: '600', color: '#1e293b' }}>{value ?? '—'}</span>
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────
function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === 'Active';
  return (
    <span style={{
      background: active ? '#d1fae5' : '#f1f5f9',
      color: active ? '#065f46' : '#64748b',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
    }}>
      {status ?? '—'}
    </span>
  );
}

function Th({ children }) {
  return <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</th>;
}

// ── Styles ─────────────────────────────────────────────────────
const grid3    = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' };
const card     = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' };
const table    = { width: '100%', borderCollapse: 'collapse' };
const trow     = { borderTop: '1px solid #f1f5f9' };
const td       = { padding: '14px 20px', fontSize: '14px', color: '#1e293b' };
const empty    = { padding: '40px', textAlign: 'center', color: '#94a3b8', display: 'block' };
const viewBtn  = { background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#475569' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const drawer   = { position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '32px 28px', overflowY: 'auto' };
const closeBtn = { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '700' };