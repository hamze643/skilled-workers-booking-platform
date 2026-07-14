import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Search,
  ArrowRight,
  CheckCircle,
  X,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  disputed: "bg-red-100 text-red-700",
};

export default function WorkerBookings() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    console.log("Logged in user:", user);

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
      *,
      client:client_id (
          id,
          full_name,
          avatar_url
      ),
      categories(name)
    `,
      )
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    console.log("User ID:", user?.id);
    console.log("Bookings:", data);
    console.log("Error:", error);

    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const updateStatus = async (id, status, clientId, serviceName) => {
    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        ...(status === "confirmed"
          ? { confirmed_at: new Date().toISOString() }
          : {}),
        ...(status === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error("Update failed");
      return;
    }

    const msgs = {
      confirmed: `${profile?.full_name} confirmed your booking for "${serviceName}"`,
      completed: `${profile?.full_name} marked "${serviceName}" as completed`,
      cancelled: `${profile?.full_name} cancelled booking "${serviceName}"`,
      in_progress: `${profile?.full_name} started work on "${serviceName}"`,
    };
    await supabase.from("notifications").insert({
      user_id: clientId,
      title: `Booking ${status.replace("_", " ")}`,
      message: msgs[status] || "",
      type: "booking",
    });
    toast.success(`Booking ${status}`);
    load();
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch =
      !search ||
      b.service_title?.toLowerCase().includes(search.toLowerCase()) ||
      b.client?.profiles?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase());
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
        <h1 className="page-title">Bookings</h1>
        <p className="text-sm text-gray-500">
          Manage all your booking requests
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
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
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${filter === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {tab.replace("_", " ")} (
              {
                bookings.filter((b) =>
                  tab === "all" ? true : b.status === tab,
                ).length
              }
              )
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="Booking requests from clients will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-blue-700">
                  {(b.client?.profiles?.full_name || "C").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {b.service_title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {b.client?.profiles?.full_name} • {b.scheduled_date}
                      </p>
                    </div>
                    <span
                      className={`badge ${STATUS_STYLES[b.status]} shrink-0`}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                  {b.notes && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      Note: {b.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 items-center">
                    <span className="text-sm font-bold text-gray-900">
                      ${b.total_amount || 0}
                    </span>
                    <span className="text-xs text-gray-400">
                      {b.duration_hours} hr{b.duration_hours !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2 ml-auto">
                      {b.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                b.id,
                                "confirmed",
                                b.client_id,
                                b.service_title,
                              )
                            }
                            className="btn-success py-1.5 text-xs"
                          >
                            <CheckCircle size={13} /> Accept
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(
                                b.id,
                                "cancelled",
                                b.client_id,
                                b.service_title,
                              )
                            }
                            className="btn-danger py-1.5 text-xs"
                          >
                            <X size={13} /> Decline
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              b.id,
                              "in_progress",
                              b.client_id,
                              b.service_title,
                            )
                          }
                          className="btn-primary py-1.5 text-xs"
                        >
                          <Clock size={13} /> Start Job
                        </button>
                      )}
                      {b.status === "in_progress" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              b.id,
                              "completed",
                              b.client_id,
                              b.service_title,
                            )
                          }
                          className="btn-success py-1.5 text-xs"
                        >
                          <CheckCircle size={13} /> Mark Complete
                        </button>
                      )}
                      <Link
                        to={`/worker/bookings/${b.id}`}
                        className="btn-secondary py-1.5 text-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
