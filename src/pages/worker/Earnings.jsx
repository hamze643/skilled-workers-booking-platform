import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

export default function WorkerEarnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select(
        "id, service_title, total_amount, scheduled_date, client:client_id(id,full_name), completed_at",
      )
      .eq("worker_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, [user]);

  const filterByPeriod = (bks) => {
    const now = new Date();
    if (period === "this_month") {
      return bks.filter((b) => {
        const d = new Date(b.completed_at || b.scheduled_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }
    if (period === "last_month") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return bks.filter((b) => {
        const d = new Date(b.completed_at || b.scheduled_date);
        return (
          d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
        );
      });
    }
    if (period === "this_year") {
      return bks.filter(
        (b) =>
          new Date(b.completed_at || b.scheduled_date).getFullYear() ===
          now.getFullYear(),
      );
    }
    return bks;
  };

  const filtered = filterByPeriod(bookings);
  const total = filtered.reduce((s, b) => s + (b.total_amount || 0), 0);
  const avg = filtered.length ? total / filtered.length : 0;

  // Monthly breakdown
  const monthlyMap = {};
  bookings.forEach((b) => {
    const d = new Date(b.completed_at || b.scheduled_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    if (!monthlyMap[key]) monthlyMap[key] = { label, amount: 0, jobs: 0 };
    monthlyMap[key].amount += b.total_amount || 0;
    monthlyMap[key].jobs += 1;
  });
  const monthly = Object.values(monthlyMap)
    .sort((a, b) => b.label.localeCompare(a.label))
    .slice(0, 6);
  const maxAmount = Math.max(...monthly.map((m) => m.amount), 1);

  if (loading) return <LoadingSpinner text="Loading earnings..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="text-sm text-gray-500">
            Track your income and job history
          </p>
        </div>
        <select
          className="input w-auto text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <DollarSign size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${total.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Earned</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {filtered.length}
          </div>
          <div className="text-sm text-gray-600">Jobs Completed</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${avg.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Average Job</div>
        </div>
      </div>

      {/* Monthly chart */}
      {monthly.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-5">Monthly Breakdown</h2>
          <div className="space-y-3">
            {monthly.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-500 shrink-0">
                  {m.label}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(m.amount / maxAmount) * 100}%` }}
                  >
                    {m.amount / maxAmount > 0.2 && (
                      <span className="text-xs text-white font-medium">
                        ${m.amount.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {m.jobs} job{m.jobs !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job history */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="section-title">Job History</h2>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No completed jobs yet"
            description="Completed jobs will appear here with their earnings."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 font-bold text-emerald-700 text-sm">
                  {(b.client?.profiles?.full_name || "C").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {b.service_title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {b.client?.profiles?.full_name} • {b.scheduled_date}
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  ${b.total_amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
