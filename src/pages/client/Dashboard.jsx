import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Star,
  Heart,
  ArrowRight,
  Briefcase,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StarRating from "../../components/common/StarRating";

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div
        className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    favorites: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [bookingsRes, favRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id,status,service_title,scheduled_date,scheduled_time,total_amount,worker:worker_id(id,full_name,avatar_url)",
          )
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user.id),
      ]);

      const bookings = bookingsRes.data || [];
      setRecentBookings(bookings);

      const active = bookings.filter((b) =>
        ["pending", "confirmed", "in_progress"].includes(b.status),
      ).length;
      const completed = bookings.filter((b) => b.status === "completed").length;

      // fetch total counts
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("client_id", user.id);

      setStats({
        total: totalCount || 0,
        active,
        completed,
        favorites: favRes.count || 0,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const statusStyle = (s) =>
    ({
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      in_progress: "bg-violet-100 text-violet-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-gray-100 text-gray-500",
      disputed: "bg-red-100 text-red-700",
    })[s] || "bg-gray-100 text-gray-500";

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            {greeting}, {profile?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening with your bookings.
          </p>
        </div>
        <Link to="/client/browse" className="btn-primary">
          Find a Worker <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Bookings"
          value={stats.total}
          color="bg-blue-600"
          sub="All time"
        />
        <StatCard
          icon={Clock}
          label="Active Jobs"
          value={stats.active}
          color="bg-violet-500"
          sub="In progress"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="bg-emerald-500"
          sub="Successfully done"
        />
        <StatCard
          icon={Heart}
          label="Favorites"
          value={stats.favorites}
          color="bg-rose-500"
          sub="Saved workers"
        />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            to: "/client/browse",
            icon: Briefcase,
            label: "Browse Workers",
            desc: "Find the right professional",
            color: "bg-blue-50 border-blue-200 text-blue-700",
          },
          {
            to: "/client/bookings",
            icon: Calendar,
            label: "My Bookings",
            desc: "View & manage bookings",
            color: "bg-emerald-50 border-emerald-200 text-emerald-700",
          },
          {
            to: "/client/favorites",
            icon: Heart,
            label: "Saved Workers",
            desc: "Your favorite professionals",
            color: "bg-rose-50 border-rose-200 text-rose-700",
          },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link
            key={to}
            to={to}
            className={`p-4 rounded-xl border ${color} flex items-start gap-3 hover:opacity-80 transition-opacity`}
          >
            <Icon size={20} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="section-title">Recent Bookings</h2>
          <Link
            to="/client/bookings"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No bookings yet.</p>
            <Link to="/client/browse" className="btn-primary mt-4 inline-flex">
              Browse Workers
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/client/bookings/${booking.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {booking.service_title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {booking.scheduled_date}{" "}
                    {booking.scheduled_time && `at ${booking.scheduled_time}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {booking.total_amount && (
                    <span className="text-sm font-semibold text-gray-900">
                      ${booking.total_amount}
                    </span>
                  )}
                  <span className={`badge ${statusStyle(booking.status)}`}>
                    {booking.status.replace("_", " ")}
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
