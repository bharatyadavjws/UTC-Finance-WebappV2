import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../../services/loanService';

function useViewport() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: width < 768 };
}

function statusColor(status) {
  switch (status) {
    case 'Active':    return { bg: '#e8f5e9', color: '#1b5e20' };
    case 'Blocked':   return { bg: '#fdecea', color: '#b71c1c' };
    case 'Pending':   return { bg: '#fff8e1', color: '#f57f17' };
    case 'Closed':    return { bg: '#f3f4f6', color: '#374151' };
    default:          return { bg: '#f3f4f6', color: '#374151' };
  }
}

function inr(val) {
  return `₹ ${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function LoanListPage() {
  const navigate       = useNavigate();
  const { isMobile }   = useViewport();
  const [loans,        setLoans]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    async function fetchLoans() {
      try {
        setLoading(true);
        setError('');
        const response = await loanService.getLoans();
        setLoans(response.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load loans');
      } finally {
        setLoading(false);
      }
    }
    fetchLoans();
  }, []);

  const STATUS_OPTIONS = ['All', 'Pending', 'Active', 'Closed', 'Blocked'];

  const filtered = loans.filter((loan) => {
    const matchSearch =
      !searchTerm.trim() ||
      loan.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loan_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.retailer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer_phone?.includes(searchTerm);

    const matchStatus =
      statusFilter === 'All' || loan.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const pagePadding = isMobile ? '88px 16px 110px' : '110px 32px 120px';

  return (
    <div style={{ padding: pagePadding, background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '32px' : '42px', fontWeight: '800', color: '#111827', marginBottom: '6px', lineHeight: 1.1 }}>
              Loans
            </h1>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>
              All loan applications submitted by you.
            </p>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
            Total: {loans.length}
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name, phone, loan code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              background: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: statusFilter === s ? 'none' : '1px solid #d1d5db',
                  background: statusFilter === s ? '#111827' : '#fff',
                  color: statusFilter === s ? '#f9fafb' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading loans...
          </div>
        )}

        {error && (
          <div style={{ background: '#fdecea', color: '#b71c1c', padding: '14px', borderRadius: '10px', border: '1px solid #f5c2c7', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: '16px', background: '#fff' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
              No loans found
            </div>
            <div style={{ fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search or filter.'
                : 'Start a loan from the Retailers page.'}
            </div>
          </div>
        )}

        {/* Loan Cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filtered.map((loan) => {
              const sc = statusColor(loan.status);
              return (
                <div
                  key={loan.loan_code}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: isMobile ? '14px' : '18px',
                    background: '#ffffff',
                  }}
                  >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        {loan.loan_code} • {loan.created_at}
                      </div>
                      <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#111827', lineHeight: 1.1, marginBottom: '4px' }}>
                        {loan.customer_name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {loan.customer_phone}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: sc.bg,
                        color: sc.color,
                        alignSelf: 'flex-start',
                      }}
                    >
                      {loan.status}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                      gap: '12px',
                      marginTop: '16px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      border: '1px solid #f3f4f6',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Device</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {loan.item_name || '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Item Value</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {inr(loan.item_value)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Loan Amount</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {inr(loan.loan_amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Monthly EMI</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a73e8' }}>
                        {inr(loan.emi_amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Net Disbursement</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {inr(loan.net_disbursement)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Plan</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {loan.plan_label || '-'} • {loan.plan_months} months
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>First EMI</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {loan.first_emi_date || '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Last EMI</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {loan.last_repayment_date || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Footer row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '14px',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Retailer: <strong style={{ color: '#374151' }}>{loan.retailer_code}</strong>
                      {loan.device_type && (
                        <span
                          style={{
                            marginLeft: '10px',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: loan.device_type === 'IOS' ? '#eff6ff' : '#f0fdf4',
                            color: loan.device_type === 'IOS' ? '#1d4ed8' : '#15803d',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {loan.device_type}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/loans/${loan.loan_code}`)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          background: '#fff',
                          color: '#111827',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}