import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-violet-100 text-violet-700 border-violet-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function WorkerBookingDetail() {
  const { bookingId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("bookings")
      .select(
        "*, client:client_id(id,full_name, avatar_url, phone, location), categories(name)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    setBooking(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const updateStatus = async (status) => {
    setUpdating(true);
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
      .eq("id", bookingId);
    if (error) {
      toast.error("Update failed");
      setUpdating(false);
      return;
    }
    const notifMsg = {
      confirmed: `Your booking "${booking.service_title}" has been confirmed!`,
      completed: `Your booking "${booking.service_title}" has been marked complete.`,
      cancelled: `Booking "${booking.service_title}" was declined.`,
      in_progress: `Work has started on "${booking.service_title}"!`,
    };
    await supabase
      .from("notifications")
      .insert({
        user_id: booking.client_id,
        title: `Booking ${status}`,
        message: notifMsg[status] || "",
        type: "booking",
      });
    toast.success(`Booking ${status}`);
    load();
    setUpdating(false);
  };

  if (loading) return <LoadingSpinner text="Loading..." />;
  if (!booking)
    return (
      <div className="text-center py-16 text-gray-500">Booking not found.</div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div
        className={`p-4 rounded-xl border flex items-center gap-3 ${STATUS_STYLES[booking.status]}`}
      >
        <CheckCircle size={18} />
        <span className="font-semibold capitalize">
          {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title">{booking.service_title}</h2>
        {booking.service_description && (
          <p className="text-sm text-gray-500">{booking.service_description}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={13} className="text-blue-600" />
            {booking.scheduled_date}
          </div>
          {booking.scheduled_time && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={13} className="text-blue-600" />
              {booking.scheduled_time}
            </div>
          )}
          {booking.location && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <MapPin size={13} className="text-blue-600" />
              {booking.location}
            </div>
          )}
        </div>
        {booking.notes && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            {booking.notes}
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-blue-700">${booking.total_amount}</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-3">Client</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700">
            {(booking.client?.profiles?.full_name || "C").charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">
              {booking.client?.profiles?.full_name}
            </p>
            {booking.client?.profiles?.phone && (
              <p className="text-xs text-gray-500">
                {booking.client.profiles.phone}
              </p>
            )}
          </div>
          <Link
            to={`/worker/chat/${booking.client_id}`}
            className="btn-secondary py-2 px-3"
          >
            <MessageSquare size={15} />
          </Link>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {booking.status === "pending" && (
          <>
            <button
              onClick={() => updateStatus("confirmed")}
              disabled={updating}
              className="btn-success flex-1"
            >
              <CheckCircle size={15} /> Accept Booking
            </button>
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
              className="btn-danger flex-1"
            >
              <X size={15} /> Decline
            </button>
          </>
        )}
        {booking.status === "confirmed" && (
          <button
            onClick={() => updateStatus("in_progress")}
            disabled={updating}
            className="btn-primary flex-1"
          >
            Start Job
          </button>
        )}
        {booking.status === "in_progress" && (
          <button
            onClick={() => updateStatus("completed")}
            disabled={updating}
            className="btn-success flex-1"
          >
            <CheckCircle size={15} /> Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
}
