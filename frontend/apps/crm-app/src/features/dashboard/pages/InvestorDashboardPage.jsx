import React, { useEffect, useState } from 'react';
import { loanService } from '../../../services/loanService';

const statusColors = {
    active:    'bg-blue-100 text-blue-700',
    disbursed: 'bg-purple-100 text-purple-700',
    overdue:   'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
  };

export default function InvestorDashboardPage() {
  const [stats, setStats]   = useState(null);
  const [loans, setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await loanService.getLoans();
        const all = res.data || [];

        const totalDeployed   = all.reduce((s, l) => s + parseFloat(l.loan_amount || 0), 0);
        const totalRepaid     = all.reduce((s, l) => s + parseFloat(l.total_repaid  || 0), 0);
        const activeLoans = all.filter(l => l.status?.toLowerCase() === 'active' || l.status?.toLowerCase() === 'disbursed').length;
        const overdueLoans = all.filter(l => l.status?.toLowerCase() === 'overdue').length;
        const completedLoans = all.filter(l => l.status?.toLowerCase() === 'completed').length;

        setStats({ totalDeployed, totalRepaid, activeLoans, overdueLoans, completedLoans, total: all.length });
        setLoans(all);
      } catch (err) {
        console.error('Failed to load investor data', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Investor Portfolio</h1>
      <p className="text-gray-500 text-sm mb-6">Read-only view of your deployed capital and loan performance</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Deployed" value={`₹${stats.totalDeployed.toLocaleString('en-IN')}`} color="border-blue-500" />
          <StatCard label="Total Repaid"   value={`₹${stats.totalRepaid.toLocaleString('en-IN')}`}   color="border-green-500" />
          <StatCard label="Active Loans"   value={stats.activeLoans}    color="border-purple-500" />
          <StatCard label="Overdue Loans"  value={stats.overdueLoans}   color="border-red-500" />
          <StatCard label="Completed"      value={stats.completedLoans} color="border-gray-400" />
        </div>
      )}

      {/* Loan Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">
          All Loans ({loans.length})
        </div>
        {loans.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No loan data available.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Loan #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-right">Loan Amount</th>
                <th className="px-4 py-3 text-right">EMI</th>
                <th className="px-4 py-3 text-right">Repaid</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{loan.loan_code}</td>
                  <td className="px-4 py-3 font-medium">{loan.customer_name}</td>
                  <td className="px-4 py-3 text-right">₹{parseFloat(loan.loan_amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">₹{parseFloat(loan.emi_amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                    ₹{parseFloat(loan.total_repaid || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[loan.status] || 'bg-gray-100 text-gray-500'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {loan.created_at ? new Date(loan.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${color}`}>
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}