import { useEffect, useState } from "react";
import { crmService } from "../../services/crmService";

export default function CommissionTrackerPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await crmService.getCommissions();
      setCommissions(res.data.data || []);
    } catch (err) {
      console.error("Failed to load commissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  const filtered = commissions.filter(c => {
    const matchesStatus = filter === "all" || c.commission_status === filter;
    const matchesSearch = search === "" ||
      c.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.loan_number?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPendingPayout = commissions
    .filter(c => c.commission_status === "pending_payout")
    .reduce((s, c) => s + parseFloat(c.commission_amount || 0), 0);

  const totalPaid = commissions
    .filter(c => c.commission_status === "paid")
    .reduce((s, c) => s + parseFloat(c.commission_amount || 0), 0);

  const totalCommission = totalPendingPayout + totalPaid;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Commission Tracker</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Agent commissions — auto-calculated per loan</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ ...card, borderLeft: '4px solid #2563eb' }}>
          <div style={statLabel}>Total Commissions</div>
          <div style={{ ...statValue, color: '#2563eb' }}>₹{totalCommission.toLocaleString('en-IN')}</div>
          <div style={statSub}>Pending + Paid</div>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
          <div style={statLabel}>Pending Payout</div>
          <div style={{ ...statValue, color: '#f59e0b' }}>₹{totalPendingPayout.toLocaleString('en-IN')}</div>
          <div style={statSub}>Loans not yet disbursed</div>
        </div>
        <div style={{ ...card, borderLeft: '4px solid #10b981' }}>
          <div style={statLabel}>Paid Out</div>
          <div style={{ ...statValue, color: '#10b981' }}>₹{totalPaid.toLocaleString('en-IN')}</div>
          <div style={statSub}>Disbursed loans</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={labelStyle}>Search</label>
          <input
            style={inputStyle}
            placeholder="Search by agent or loan number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending_payout', label: 'Pending Payout' },
            { key: 'paid', label: 'Paid Out' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                padding: '9px 18px', borderRadius: '8px',
                border: filter === s.key ? 'none' : '1px solid #e2e8f0',
                background: filter === s.key ? '#2563eb' : '#fff',
                color: filter === s.key ? '#fff' : '#475569',
                cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={empty}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={empty}>No commissions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Loan #', 'Agent', 'Retailer', 'Loan Amount', 'Commission (2%)', 'Status', 'Disbursed On'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={trow}>
                    <td style={{ ...td, fontFamily: 'monospace', color: '#2563eb', fontWeight: '600' }}>{c.loan_number}</td>
                    <td style={{ ...td, fontWeight: '600' }}>{c.agent_name || '—'}</td>
                    <td style={{ ...td, color: '#64748b' }}>{c.retailer_name || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>₹{parseFloat(c.loan_amount).toLocaleString('en-IN')}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                      ₹{parseFloat(c.commission_amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        background: c.commission_status === 'paid' ? '#d1fae5' : '#fef3c7',
                        color: c.commission_status === 'paid' ? '#065f46' : '#92400e',
                      }}>
                        {c.commission_status === 'paid' ? 'Paid Out' : 'Pending Payout'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center', color: '#64748b' }}>
                      {c.disbursed_at ? new Date(c.disbursed_at).toLocaleDateString('en-IN') : '—'}
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

const card      = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' };
const statLabel = { fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' };
const statValue = { fontSize: '28px', fontWeight: '800' };
const statSub   = { fontSize: '12px', color: '#94a3b8', marginTop: '4px' };
const table     = { width: '100%', borderCollapse: 'collapse' };
const trow      = { borderTop: '1px solid #f1f5f9' };
const th        = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td        = { padding: '13px 16px', fontSize: '14px', color: '#1e293b' };
const empty     = { padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' };
