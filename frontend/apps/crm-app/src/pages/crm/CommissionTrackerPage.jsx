
import { useEffect, useState } from "react";
import { crmService } from "../../services/crmService";

const statusColors = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-yellow-100 text-yellow-700",
};

export default function CommissionTrackerPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | paid | unpaid
  const [search, setSearch] = useState("");
  const [marking, setMarking] = useState(null);

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

  useEffect(() => {
    fetchCommissions();
  }, []);

  const markPaid = async (id) => {
    setMarking(id);
    try {
      await crmService.markCommissionPaid(id);
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, commission_status: "paid" } : c))
      );
    } catch (err) {
      alert("Failed to mark as paid.");
    } finally {
      setMarking(null);
    }
  };

  const filtered = commissions.filter((c) => {
    const matchesStatus = filter === "all" || c.commission_status === filter;
    const matchesSearch =
      search === "" ||
      c.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.loan_number?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalUnpaid = commissions
    .filter((c) => c.commission_status === "unpaid")
    .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);

  const totalPaid = commissions
    .filter((c) => c.commission_status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Commission Tracker</h1>
      <p className="text-gray-500 text-sm mb-6">Manage and track agent commissions per loan</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Commissions</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            ₹{(totalPaid + totalUnpaid).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Paid Out</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Pending Payout</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            ₹{totalUnpaid.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by agent or loan number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          {["all", "paid", "unpaid"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No commissions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Loan #</th>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-left">Retailer</th>
                <th className="px-4 py-3 text-right">Loan Amount</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Disbursed On</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">
                    {c.loan_number}
                  </td>
                  <td className="px-4 py-3">{c.agent_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.retailer_name || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{parseFloat(c.loan_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    ₹{parseFloat(c.commission_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusColors[c.commission_status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.commission_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {c.disbursed_at
                      ? new Date(c.disbursed_at).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.commission_status === "unpaid" ? (
                      <button
                        onClick={() => markPaid(c.id)}
                        disabled={marking === c.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition"
                      >
                        {marking === c.id ? "Saving..." : "Mark Paid"}
                      </button>
                    ) : (
                      <span className="text-green-500 text-xs font-medium">✓ Paid</span>
                    )}
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