import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function WorkerDashboard() {
  const { user, profile, workerProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    earnings: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (workerProfile?.approval_status !== "approved") {
      navigate("/worker/pending");
      return;
    }
    const load = async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select(
          "id, status, service_title, scheduled_date, total_amount, client:client_id(id,full_name)",
        )
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });

      const all = bookings || [];
      const earnings = all
        .filter((b) => b.status === "completed")
        .reduce((s, b) => s + (b.total_amount || 0), 0);
      setStats({
        pending: all.filter((b) => b.status === "pending").length,
        active: all.filter((b) =>
          ["confirmed", "in_progress"].includes(b.status),
        ).length,
        completed: all.filter((b) => b.status === "completed").length,
        earnings,
      });
      setRecent(all.slice(0, 5));
      setLoading(false);
    };
    load();
  }, [user, workerProfile]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Worker Dashboard</h1>
          <p className="text-sm text-gray-500">
            {workerProfile?.is_available ? (
              <span className="text-emerald-600 font-medium">
                You are available for bookings
              </span>
            ) : (
              <span className="text-red-500 font-medium">
                You are currently unavailable
              </span>
            )}
          </p>
        </div>
        <Link to="/worker/availability" className="btn-secondary">
          Manage Availability
        </Link>
      </div>

      {/* Profile completion banner */}
      {!workerProfile?.title && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Complete your profile
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              A complete profile gets 3x more bookings. Add your title, skills,
              and hourly rate.
            </p>
          </div>
          <Link to="/worker/profile" className="btn-primary text-sm shrink-0">
            Complete Profile
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Clock,
            label: "Pending Requests",
            value: stats.pending,
            color: "bg-amber-500",
          },
          {
            icon: Calendar,
            label: "Active Jobs",
            value: stats.active,
            color: "bg-blue-600",
          },
          {
            icon: CheckCircle,
            label: "Completed Jobs",
            value: stats.completed,
            color: "bg-emerald-500",
          },
          {
            icon: DollarSign,
            label: "Total Earned",
            value: `$${stats.earnings.toFixed(0)}`,
            color: "bg-violet-500",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div
              className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Worker stats */}
      {workerProfile && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {workerProfile.avg_rating?.toFixed(1) || "—"}
              </div>
              <div className="text-sm text-gray-500">
                {workerProfile.total_reviews || 0} reviews
              </div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${workerProfile.hourly_rate || 0}
              </div>
              <div className="text-sm text-gray-500">Hourly rate</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {workerProfile.total_jobs || 0}
              </div>
              <div className="text-sm text-gray-500">Total jobs</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="section-title">Recent Bookings</h2>
          <Link
            to="/worker/bookings"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No bookings yet. Complete your profile to attract clients.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((b) => (
              <Link
                key={b.id}
                to={`/worker/bookings/${b.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-blue-600 font-bold text-sm">
                  {(b.client?.profiles?.full_name || "C").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {b.service_title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {b.client?.profiles?.full_name} • {b.scheduled_date}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {b.total_amount && (
                    <span className="text-sm font-semibold">
                      ${b.total_amount}
                    </span>
                  )}
                  <span className={`badge ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
