import { useEffect, useState } from "react";
import { crmService } from "../../services/crmService";

export default function DisbursementPanelPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await crmService.getApprovedLoans();
      setLoans(res.data.data || []);
    } catch (err) {
      console.error("Failed to load loans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const markAsDisbursed = async (id) => {
    setProcessing(id);
    try {
      await crmService.disburseLoan(id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to disburse loan.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Disbursement Panel</h1>
      <p className="text-gray-500 text-sm mb-6">Approved loans ready for disbursement</p>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No approved loans pending disbursement.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Loan #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-left">Retailer</th>
                <th className="px-4 py-3 text-right">Loan Amount</th>
                <th className="px-4 py-3 text-right">Commission (2%)</th>
                <th className="px-4 py-3 text-center">Applied On</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">
                    {loan.loan_number || loan.loan_code}
                  </td>
                  <td className="px-4 py-3">{loan.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{loan.agent_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{loan.retailer_name || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ₹{parseFloat(loan.loan_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                    ₹{(parseFloat(loan.loan_amount) * 0.02).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {new Date(loan.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => markAsDisbursed(loan.id)}
                      disabled={processing === loan.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition"
                    >
                      {processing === loan.id ? "Processing..." : "Mark Disbursed"}
                    </button>
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