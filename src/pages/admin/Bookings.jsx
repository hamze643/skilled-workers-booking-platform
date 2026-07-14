import { useEffect, useState } from "react";
import { Search, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
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

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("bookings")
      .select(
        "*, client:client_id(id,full_name), worker:worker_id(id,full_name), categories(name)",
      )
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q.limit(100);
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Status updated");
      load();
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.service_title?.toLowerCase().includes(s) ||
      b.client?.profiles?.full_name?.toLowerCase().includes(s) ||
      b.worker?.profiles?.full_name?.toLowerCase().includes(s)
    );
  });

  const tabs = [
    "all",
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "disputed",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Booking Management</h1>
        <p className="text-sm text-gray-500">
          Monitor and manage all platform bookings
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
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === t ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Service</th>
                  <th className="table-th">Client</th>
                  <th className="table-th">Worker</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900 max-w-[160px]">
                      <div className="truncate">{b.service_title}</div>
                      {b.categories?.name && (
                        <div className="text-xs text-gray-400">
                          {b.categories.name}
                        </div>
                      )}
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {b.client?.full_name || "—"}
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {b.worker?.full_name || "—"}
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {b.scheduled_date}
                    </td>
                    <td className="table-td font-semibold">
                      ${b.total_amount || 0}
                    </td>
                    <td className="table-td">
                      <span
                        className={`badge ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-td">
                      <select
                        className="input py-1 text-xs w-32"
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                      >
                        {[
                          "pending",
                          "confirmed",
                          "in_progress",
                          "completed",
                          "cancelled",
                          "disputed",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
