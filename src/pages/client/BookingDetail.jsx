import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  Star,
  MessageSquare,
  X,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StarRating from "../../components/common/StarRating";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-violet-100 text-violet-700 border-violet-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  disputed: "bg-red-100 text-red-700 border-red-200",
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [bRes, rRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "*, worker:worker_id(id,full_name, avatar_url, location, phone), categories(name)",
        )
        .eq("id", bookingId)
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle(),
    ]);
    setBooking(bRes.data);
    setReview(rRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: cancelReason,
          cancelled_by: "client",
        })
        .eq("id", bookingId);
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: booking.worker_id,
        title: "Booking Cancelled",
        message: `${profile?.full_name} cancelled booking for "${booking.service_title}"`,
        type: "booking",
      });
      toast.success("Booking cancelled");
      setCancelModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        client_id: user.id,
        worker_id: booking.worker_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: booking.worker_id,
        title: "New Review",
        message: `${profile?.full_name} left a ${reviewForm.rating}-star review`,
        type: "review",
      });
      toast.success("Review submitted!");
      setReviewModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading booking..." />;
  if (!booking)
    return (
      <div className="text-center py-16 text-gray-500">Booking not found.</div>
    );

  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canReview = booking.status === "completed" && !review;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft size={16} /> Back to Bookings
      </button>

      {/* Status banner */}
      <div
        className={`p-4 rounded-xl border flex items-center gap-3 ${STATUS_STYLES[booking.status]}`}
      >
        <CheckCircle size={18} />
        <div>
          <div className="font-semibold capitalize">
            {booking.status.replace("_", " ")}
          </div>
          {booking.status === "pending" && (
            <div className="text-xs opacity-75">
              Waiting for worker confirmation
            </div>
          )}
          {booking.status === "confirmed" && (
            <div className="text-xs opacity-75">
              Booking confirmed by worker
            </div>
          )}
          {booking.status === "completed" && (
            <div className="text-xs opacity-75">Job completed successfully</div>
          )}
        </div>
      </div>

      {/* Booking details */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title">{booking.service_title}</h2>
        {booking.service_description && (
          <p className="text-sm text-gray-600">{booking.service_description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-blue-600" />
            <span>{booking.scheduled_date}</span>
          </div>
          {booking.scheduled_time && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={14} className="text-blue-600" />
              <span>{booking.scheduled_time}</span>
            </div>
          )}
          {booking.location && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <MapPin size={14} className="text-blue-600" />
              <span>{booking.location}</span>
            </div>
          )}
        </div>
        {booking.notes && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Rate</span>
            <span>${booking.client_rate}/hr</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Duration</span>
            <span>{booking.duration_hours} hr(s)</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-blue-700">${booking.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Worker card */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Worker</h3>
        <div className="flex items-center gap-3">
          {booking.worker?.profiles?.avatar_url ? (
            <img
              src={booking.worker.profiles.avatar_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              {(booking.worker?.profiles?.full_name || "W").charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {booking.worker?.profiles?.full_name}
            </p>
            {booking.worker?.profiles?.location && (
              <p className="text-xs text-gray-400">
                {booking.worker.profiles.location}
              </p>
            )}
          </div>
          <Link
            to={`/client/chat/${booking.worker_id}`}
            className="btn-secondary py-2 px-3"
          >
            <MessageSquare size={16} />
          </Link>
        </div>
      </div>

      {/* Review card */}
      {review && (
        <div className="card p-5">
          <h3 className="section-title mb-3">Your Review</h3>
          <StarRating rating={review.rating} />
          {review.comment && (
            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canReview && (
          <button
            onClick={() => setReviewModal(true)}
            className="btn-success flex-1"
          >
            <Star size={16} /> Leave Review
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => setCancelModal(true)}
            className="btn-danger flex-1"
          >
            <X size={16} /> Cancel Booking
          </button>
        )}
      </div>

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        danger
        loading={submitting}
      />

      {/* Review modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title="Leave a Review"
      >
        <form onSubmit={handleReview} className="space-y-4">
          <div className="form-group">
            <label className="label">Rating</label>
            <StarRating
              rating={reviewForm.rating}
              size={28}
              interactive
              onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Comment</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((f) => ({ ...f, comment: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setReviewModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
