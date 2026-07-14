import { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  Calendar,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function StatCard({ icon: Icon, label, value, color, change }) {
  return (
    <div className="stat-card">
      <div
        className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {change !== undefined && (
        <div
          className={`text-xs mt-1 ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}
        >
          {change >= 0 ? "+" : ""}
          {change} this month
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    workers: 0,
    bookings: 0,
    reviews: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        usersRes,
        workersRes,
        bookingsRes,
        reviewsRes,
        pendingRes,
        recentRes,
        pendingWRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "client"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "worker"),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("bookings")
          .select(
            "id,service_title,status,total_amount,created_at,client:client_id(id,full_name)",
          )
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("worker_profiles")
          .select("user_id, title, profiles(full_name), created_at")
          .eq("approval_status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const completedRes = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("status", "completed");
      const revenue = (completedRes.data || []).reduce(
        (s, b) => s + (b.total_amount || 0),
        0,
      );

      setStats({
        users: usersRes.count || 0,
        workers: workersRes.count || 0,
        bookings: bookingsRes.count || 0,
        reviews: reviewsRes.count || 0,
        pending: pendingRes.count || 0,
        revenue,
      });
      setRecentBookings(recentRes.data || []);
      setPendingWorkers(pendingWRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const STATUS_STYLES = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-gray-100 text-gray-500",
    in_progress: "bg-violet-100 text-violet-700",
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Platform overview and management
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Clients"
          value={stats.users}
          color="bg-blue-600"
        />
        <StatCard
          icon={Briefcase}
          label="Workers"
          value={stats.workers}
          color="bg-emerald-600"
        />
        <StatCard
          icon={Calendar}
          label="Bookings"
          value={stats.bookings}
          color="bg-violet-500"
        />
        <StatCard
          icon={Star}
          label="Reviews"
          value={stats.reviews}
          color="bg-amber-500"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-3">
            <Clock size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-600">Pending Bookings</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ${stats.revenue.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Platform Revenue</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mb-3">
            <Activity size={18} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {pendingWorkers.length}
          </div>
          <div className="text-sm text-gray-600">Workers Awaiting Approval</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Recent Bookings</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {b.service_title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {b.client?.profiles?.full_name} •{" "}
                    {new Date(b.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.total_amount && (
                    <span className="text-sm font-semibold text-gray-900">
                      ${b.total_amount}
                    </span>
                  )}
                  <span
                    className={`badge ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-500"}`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                No bookings yet.
              </div>
            )}
          </div>
        </div>

        {/* Pending worker approvals */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Pending Worker Approvals</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingWorkers.map((w) => (
              <div key={w.user_id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                  {(w.profiles?.full_name || "W").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {w.profiles?.full_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {w.title || "No title"} •{" "}
                    {new Date(w.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="badge bg-amber-100 text-amber-700">
                  pending
                </span>
              </div>
            ))}
            {pendingWorkers.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">
                No pending approvals.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
