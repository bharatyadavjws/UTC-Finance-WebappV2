import React, { useEffect, useMemo, useState } from 'react'
import { loanService } from '../../../services/loanService'
import { useNavigate } from 'react-router-dom';

function LoanListPage() {
  const [loans, setLoans] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate();

  useEffect(() => {
    let active = true

    async function loadLoans() {
      try {
        setLoading(true)
        setError('')
        const response = await loanService.getLoans()

        if (!active) return

        const rows = Array.isArray(response?.data) ? response.data : []

        setLoans(Array.isArray(rows) ? rows : [])
      } catch (err) {
        if (!active) return
        setError(err.message || 'Failed to load loans.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLoans()

    return () => {
      active = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    return loans.filter((row) => {
      const loanCode = String(row.loan_code || row.loanCode || '').toLowerCase()
      const customer = String(row.customer_name || row.customer || '').toLowerCase()
      const retailer = String(row.retailer_name || row.shop_name || row.retailer || '').toLowerCase()
      const agent = String(row.agent_name || row.agent || '').toLowerCase()
      const status = String(row.status || '').trim()

      const q = search.toLowerCase()

      const matchesSearch =
        loanCode.includes(q) ||
        customer.includes(q) ||
        retailer.includes(q) ||
        agent.includes(q)

      const matchesStatus =
        statusFilter === 'ALL' ? true : status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [loans, search, statusFilter])

  const summary = useMemo(() => {
    return {
      total: loans.length,
      pending: loans.filter((item) => String(item.status || '').toLowerCase() === 'pending').length,
      approved: loans.filter((item) => String(item.status || '').toLowerCase() === 'approved').length,
      active: loans.filter((item) => String(item.status || '').toLowerCase() === 'active').length,
    }
  }, [loans])

  return (
    <section className="page-section loan-page">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Loans</h2>
          <p className="page-subtitle">
            View and manage all loan records from the live system.
          </p>
        </div>
      </div>

      <div className="crm-card loan-summary-grid">
        <div className="loan-summary-item">
          <span className="crm-card__label">Total Loans</span>
          <strong className="crm-card__value">{summary.total}</strong>
        </div>
        <div className="loan-summary-item">
          <span className="crm-card__label">Pending</span>
          <strong className="crm-card__value">{summary.pending}</strong>
        </div>
        <div className="loan-summary-item">
          <span className="crm-card__label">Approved</span>
          <strong className="crm-card__value">{summary.approved}</strong>
        </div>
        <div className="loan-summary-item">
          <span className="crm-card__label">Active</span>
          <strong className="crm-card__value">{summary.active}</strong>
        </div>
      </div>

      <div className="crm-card loan-filter-card">
        <div className="loan-filter-grid">
          <div>
            <label className="crm-field-label">Search</label>
            <input
              className="crm-text-input"
              type="text"
              placeholder="Search by loan, customer, retailer, or agent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="crm-field-label">Status</label>
            <select
              className="crm-select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="crm-card loan-table-card">
        {loading ? (
          <div className="loan-table__empty">Loading loans...</div>
        ) : error ? (
          <div className="loan-table__empty">{error}</div>
        ) : (
          <div className="loan-table-wrap">
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Loan Code</th>
                  <th>Customer</th>
                  <th>Retailer</th>
                  <th>Agent</th>
                  <th>Loan Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="loan-table__empty">
                      No loans found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={row.loan_code || index} onClick={() => navigate(`/loans/${row.loan_code}`)} style={{ cursor: 'pointer' }}>
                      <td>{row.loan_code || row.loanCode || '-'}</td>
                      <td>{row.customer_name || '-'}</td>
                      <td>{row.retailer_name || row.shop_name || '-'}</td>
                      <td>{row.agent_name || '-'}</td>
                      <td>{formatMoney(row.loan_amount || row.amount || 0)}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(row.status)}`}>
                          {row.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function getStatusClass(status) {
  const value = String(status || '').toLowerCase()

  if (value === 'approved' || value === 'active') return 'status-pill--approved'
  if (value === 'disbursed') return 'status-pill--disbursed'
  if (value === 'rejected') return 'status-pill--rejected'
  return 'status-pill--pending'
}

export default LoanListPage