import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Search, Filter, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  disputed: "bg-red-100 text-red-700",
};

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select(
        "*, worker:worker_id(id, full_name, avatar_url), categories(name)",
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch =
      !search || b.service_title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const tabs = [
    "all",
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (loading) return <LoadingSpinner text="Loading bookings..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track and manage all your service bookings
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-10"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${filter === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {tab.replace("_", " ")}
              <span className="ml-1 opacity-70">
                (
                {
                  bookings.filter((b) =>
                    tab === "all" ? true : b.status === tab,
                  ).length
                }
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="You haven't made any bookings yet. Find a skilled worker to get started."
          action={
            <Link to="/client/browse" className="btn-primary">
              Browse Workers
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Link
              key={booking.id}
              to={`/client/bookings/${booking.id}`}
              className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                {booking.worker?.profiles?.avatar_url ? (
                  <img
                    src={booking.worker.profiles.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-blue-600">
                    {(booking.worker?.full_name || "W").charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {booking.service_title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      with {booking.worker?.full_name || "Worker"}
                    </p>
                  </div>
                  <span
                    className={`badge ${STATUS_STYLES[booking.status]} shrink-0`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {booking.scheduled_date}
                  </span>
                  {booking.total_amount && (
                    <span className="font-semibold text-gray-700">
                      ${booking.total_amount}
                    </span>
                  )}
                  {booking.categories?.name && (
                    <span className="badge bg-gray-100 text-gray-500">
                      {booking.categories.name}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
