import { useEffect, useState } from "react";
import { Star, Trash2, Eye, EyeOff, Flag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import StarRating from "../../components/common/StarRating";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("reviews")
      .select(
        "*, client:client_id(id,full_name), worker:worker_id(id,full_name)",
      )
      .order("created_at", { ascending: false });
    if (filter === "reported") q = q.eq("is_reported", true);
    if (filter === "hidden") q = q.eq("is_hidden", true);
    const { data } = await q.limit(100);
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const toggleHide = async (id, current) => {
    await supabase.from("reviews").update({ is_hidden: !current }).eq("id", id);
    toast.success(current ? "Review shown" : "Review hidden");
    load();
  };

  const handleDelete = async () => {
    await supabase.from("reviews").delete().eq("id", deleteId);
    toast.success("Review deleted");
    load();
    setDeleteId(null);
  };

  const clearReport = async (id) => {
    await supabase.from("reviews").update({ is_reported: false }).eq("id", id);
    toast.success("Report cleared");
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Review Moderation</h1>
        <p className="text-sm text-gray-500">
          Monitor and moderate platform reviews
        </p>
      </div>

      <div className="flex gap-1">
        {["all", "reported", "hidden"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews found"
          description="Reviews will appear here."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`card p-5 ${r.is_hidden ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={r.rating} size={13} />
                    {r.is_reported && (
                      <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                        <Flag size={10} /> Reported
                      </span>
                    )}
                    {r.is_hidden && (
                      <span className="badge bg-gray-100 text-gray-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {r.comment || <em className="text-gray-400">No comment</em>}
                  </p>
                  <div className="text-xs text-gray-400 flex gap-3">
                    <span>
                      Client:{" "}
                      <strong className="text-gray-600">
                        {r.client?.full_name || "—"}
                      </strong>
                    </span>
                    <span>
                      Worker:{" "}
                      <strong className="text-gray-600">
                        {r.worker?.full_name || "—"}
                      </strong>
                    </span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.is_reported && (
                    <button
                      onClick={() => clearReport(r.id)}
                      title="Clear report"
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                    >
                      <Flag size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleHide(r.id, r.is_hidden)}
                    title={r.is_hidden ? "Show" : "Hide"}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                  >
                    {r.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message="This will permanently delete the review. This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </div>
  );
}
