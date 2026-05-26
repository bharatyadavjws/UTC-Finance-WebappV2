import React, { useEffect, useState, useMemo } from 'react'
import { authService } from '../../../services/authService'

const API_BASE = 'http://127.0.0.1:8000/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${authService.getToken()}` },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Request failed')
  return json
}

const EMPTY_FORM = { shop_name: '', owner_name: '', mobile: '', alternate_mobile: '', email: '', gst_number: '', pan_number: '', address_line_1: '', address_line_2: '', city: '', state: '', pincode: '' }

function validateForm(f) {
  const e = {}
  if (!f.shop_name.trim()) e.shop_name = 'Required'
  if (!f.owner_name.trim()) e.owner_name = 'Required'
  if (!f.mobile.trim()) e.mobile = 'Required'
  else if (!/^\d{10}$/.test(f.mobile)) e.mobile = 'Must be 10 digits'
  if (f.alternate_mobile && !/^\d{10}$/.test(f.alternate_mobile)) e.alternate_mobile = 'Must be 10 digits'
  if (!f.city.trim()) e.city = 'Required'
  if (!f.state.trim()) e.state = 'Required'
  if (!f.pincode.trim()) e.pincode = 'Required'
  else if (!/^\d{6}$/.test(f.pincode)) e.pincode = 'Must be 6 digits'
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Invalid email'
  return e
}

export default function RetailerListPage() {
  const [retailers, setRetailers] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignAgentIds, setAssignAgentIds] = useState([])
  const [assignMsg, setAssignMsg] = useState('')

  useEffect(() => {
    Promise.all([apiFetch('/retailers'), apiFetch('/agents')])
      .then(([rRes, aRes]) => { setRetailers(rRes.data ?? []); setAgents(aRes.data ?? []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => retailers.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = r.shop_name?.toLowerCase().includes(q) || r.owner_name?.toLowerCase().includes(q) || r.mobile?.includes(q) || r.city?.toLowerCase().includes(q) || r.retailer_code?.toLowerCase().includes(q)
    return matchSearch && (statusFilter === 'ALL' || r.status === statusFilter)
  }), [retailers, search, statusFilter])

  const summary = useMemo(() => ({
    total: retailers.length,
    active: retailers.filter(r => r.status === 'Active').length,
    inactive: retailers.filter(r => r.status === 'Inactive').length,
    unassigned: retailers.filter(r => !r.assigned_agents?.length).length,
  }), [retailers])

  function refreshRetailer(updated) {
    setRetailers(prev => prev.map(r => r.id === updated.id ? updated : r))
    if (selected?.id === updated.id) setSelected(updated)
  }

  async function handleCreate(form) {
    const data = await apiFetch('/retailers', { method: 'POST', body: JSON.stringify(form) })
    setRetailers(prev => [data.data, ...prev])
    setShowCreate(false)
  }

  async function handleStatusToggle(retailer) {
    const newStatus = retailer.status === 'Active' ? 'Inactive' : 'Active'
    const data = await apiFetch(`/retailers/${retailer.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
    refreshRetailer(data.data)
  }

  async function handleAssign(retailerId) {
    try {
      setAssigning(true); setAssignMsg('')
      const data = await apiFetch(`/retailers/${retailerId}/assign`, { method: 'POST', body: JSON.stringify({ agent_ids: assignAgentIds }) })
      refreshRetailer(data.data); setAssignMsg('Agents updated successfully.')
    } catch (e) { setAssignMsg(e.message) }
    finally { setAssigning(false) }
  }

  function openDetail(retailer) {
    setSelected(retailer)
    setAssignAgentIds(retailer.assigned_agents?.map(a => a.id) ?? [])
    setAssignMsg('')
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Retailers</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>All onboarded retailers across the platform</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={primaryBtn}>+ Add Retailer</button>
      </div>

      <div style={grid4}>
        <SummaryCard label="Total" value={summary.total} color="#2563eb" />
        <SummaryCard label="Active" value={summary.active} color="#10b981" />
        <SummaryCard label="Inactive" value={summary.inactive} color="#94a3b8" />
        <SummaryCard label="Unassigned" value={summary.unassigned} color="#f59e0b" />
      </div>

      <div style={{ ...card, padding: '20px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={labelStyle}>Search</label>
          <input style={inputStyle} placeholder="Shop, owner, mobile, city, code..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? <div style={empty}>Loading retailers...</div>
        : error ? <div style={{ ...empty, color: '#ef4444' }}>{error}</div>
        : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <Th>Code</Th><Th>Shop Name</Th><Th>Owner</Th><Th>Mobile</Th><Th>City</Th><Th>Assigned Agents</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={empty}>No retailers found.</td></tr>
                : filtered.map(r => (
                  <tr key={r.id} style={trow}>
                    <td style={td}><code style={{ fontSize: '12px', color: '#64748b' }}>{r.retailer_code}</code></td>
                    <td style={{ ...td, fontWeight: '600' }}>{r.shop_name}</td>
                    <td style={td}>{r.owner_name}</td>
                    <td style={td}>{r.mobile}</td>
                    <td style={td}>{r.city}</td>
                    <td style={td}>
                      {r.assigned_agents?.length
                        ? r.assigned_agents.map(a => <span key={a.id} style={agentTag}>{a.name}</span>)
                        : <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>Unassigned</span>}
                    </td>
                    <td style={td}><StatusPill status={r.status} /></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openDetail(r)} style={viewBtn}>View</button>
                        <button onClick={() => handleStatusToggle(r)} style={{ ...viewBtn, color: r.status === 'Active' ? '#dc2626' : '#10b981' }}>
                          {r.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <RetailerDrawer retailer={selected} agents={agents} assignAgentIds={assignAgentIds} setAssignAgentIds={setAssignAgentIds} assigning={assigning} assignMsg={assignMsg} onAssign={() => handleAssign(selected.id)} onClose={() => setSelected(null)} />}
      {showCreate && <CreateRetailerDrawer onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

function CreateRetailerDrawer({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const v = validateForm(form)
    if (Object.keys(v).length) { setErrors(v); return }
    try { setSaving(true); setErr(''); await onCreate(form) }
    catch (ex) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div onClick={onClose} style={backdrop} />
      <div style={drawer}>
        <div style={drawerHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Add Retailer</h2>
          <button onClick={onClose} style={closeBtn}>x</button>
        </div>
        {err && <div style={errBox}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <Field label="Shop Name *" name="shop_name" form={form} errors={errors} onChange={handleChange} />
          <Field label="Owner Name *" name="owner_name" form={form} errors={errors} onChange={handleChange} />
          <Field label="Mobile *" name="mobile" form={form} errors={errors} onChange={handleChange} type="tel" />
          <Field label="Alternate Mobile" name="alternate_mobile" form={form} errors={errors} onChange={handleChange} type="tel" />
          <Field label="Email" name="email" form={form} errors={errors} onChange={handleChange} type="email" />
          <Field label="GST Number" name="gst_number" form={form} errors={errors} onChange={handleChange} />
          <Field label="PAN Number" name="pan_number" form={form} errors={errors} onChange={handleChange} />
          <Field label="Address Line 1" name="address_line_1" form={form} errors={errors} onChange={handleChange} />
          <Field label="Address Line 2" name="address_line_2" form={form} errors={errors} onChange={handleChange} />
          <Field label="City *" name="city" form={form} errors={errors} onChange={handleChange} />
          <Field label="State *" name="state" form={form} errors={errors} onChange={handleChange} />
          <Field label="Pincode *" name="pincode" form={form} errors={errors} onChange={handleChange} type="tel" />
          <button type="submit" disabled={saving} style={{ ...primaryBtn, width: '100%', marginTop: '8px' }}>
            {saving ? 'Creating...' : 'Create Retailer'}
          </button>
        </form>
      </div>
    </>
  )
}

function RetailerDrawer({ retailer: r, agents, assignAgentIds, setAssignAgentIds, assigning, assignMsg, onAssign, onClose }) {
  function toggleAgent(id) {
    setAssignAgentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  return (
    <>
      <div onClick={onClose} style={backdrop} />
      <div style={drawer}>
        <div style={drawerHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{r.shop_name}</h2>
            <code style={{ fontSize: '12px', color: '#94a3b8' }}>{r.retailer_code}</code>
          </div>
          <button onClick={onClose} style={closeBtn}>x</button>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <DrawerSection title="Basic Info">
            <DRow label="Owner" value={r.owner_name} />
            <DRow label="Mobile" value={r.mobile} />
            <DRow label="Alt Mobile" value={r.alternate_mobile} />
            <DRow label="Email" value={r.email} />
            <DRow label="Status" value={<StatusPill status={r.status} />} />
          </DrawerSection>
          <DrawerSection title="Business Details">
            <DRow label="GST Number" value={r.gst_number} />
            <DRow label="PAN Number" value={r.pan_number} />
            </DrawerSection>
          <DrawerSection title="Address">
            <DRow label="Line 1" value={r.address_line_1} />
            <DRow label="Line 2" value={r.address_line_2} />
            <DRow label="City" value={r.city} />
            <DRow label="State" value={r.state} />
            <DRow label="Pincode" value={r.pincode} />
          </DrawerSection>
          <DrawerSection title="Assign Agents">
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>
              Select agents to assign this retailer to. Uncheck to remove.
            </p>
            {agents.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>No agents available.</p>
            ) : (
              <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {agents.map(agent => (
                  <label key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${assignAgentIds.includes(agent.id) ? '#2563eb' : '#e2e8f0'}`, background: assignAgentIds.includes(agent.id) ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                    <input type="checkbox" checked={assignAgentIds.includes(agent.id)} onChange={() => toggleAgent(agent.id)} style={{ accentColor: '#2563eb' }} />
                    {agent.name}
                  </label>
                ))}
              </div>
            )}
            {assignMsg && (
              <p style={{ fontSize: '13px', color: assignMsg.toLowerCase().includes('success') ? '#065f46' : '#dc2626', background: assignMsg.toLowerCase().includes('success') ? '#d1fae5' : '#fee2e2', padding: '8px 12px', borderRadius: '8px', margin: '8px 0 0' }}>
                {assignMsg}
              </p>
            )}
            <button onClick={onAssign} disabled={assigning} style={{ ...primaryBtn, width: '100%', marginTop: '12px', opacity: assigning ? 0.7 : 1, cursor: assigning ? 'not-allowed' : 'pointer' }}>
              {assigning ? 'Saving...' : 'Save Agent Assignment'}
            </button>
          </DrawerSection>
          <DrawerSection title="Meta">
            <DRow label="Joined" value={r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          </DrawerSection>
        </div>
      </div>
    </>
  )
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      <div style={{ display: 'grid', gap: '10px' }}>{children}</div>
    </div>
  )
}

function DRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: '600', color: '#1e293b' }}>{value ?? '—'}</span>
    </div>
  )
}

function Field({ label, name, form, errors, onChange, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input name={name} type={type} value={form[name]} onChange={onChange} style={{ ...inputStyle, borderColor: errors[name] ? '#ef4444' : '#e2e8f0' }} />
      {errors[name] && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors[name]}</div>}
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
    </div>
  )
}

function StatusPill({ status }) {
  const active = status === 'Active'
  return (
    <span style={{ background: active ? '#d1fae5' : '#f1f5f9', color: active ? '#065f46' : '#64748b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {status ?? '—'}
    </span>
  )
}

function Th({ children }) {
  return <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</th>
}

const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }
const card = { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }
const tableStyle = { width: '100%', borderCollapse: 'collapse' }
const trow = { borderTop: '1px solid #f1f5f9' }
const td = { padding: '14px 20px', fontSize: '14px', color: '#1e293b' }
const empty = { padding: '40px', textAlign: 'center', color: '#94a3b8', display: 'block' }
const viewBtn = { background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#475569' }
const primaryBtn = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' }
const backdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }
const drawer = { position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '32px 28px', overflowY: 'auto' }
const drawerHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }
const closeBtn = { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '700' }
const agentTag = { display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', marginRight: '4px' }
const errBox = { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }
