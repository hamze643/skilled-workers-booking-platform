import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, MapPin, ChevronLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function BookWorker() {
  const { workerId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    service_title: '', service_description: '', scheduled_date: '', scheduled_time: '',
    duration_hours: 1, location: profile?.location || '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from('worker_profiles').select('*, profiles(full_name, avatar_url), categories(name)').eq('user_id', workerId).maybeSingle().then(({ data }) => {
      setWorker(data);
      setLoading(false);
    });
  }, [workerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_title.trim()) { toast.error('Service title is required'); return; }
    if (!form.scheduled_date) { toast.error('Please select a date'); return; }
    setSubmitting(true);
    try {
      const total = (worker?.hourly_rate || 0) * form.duration_hours;
      const { data, error } = await supabase.from('bookings').insert({
        client_id: user.id,
        worker_id: workerId,
        category_id: worker?.category_id || null,
        service_title: form.service_title,
        service_description: form.service_description,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || null,
        duration_hours: form.duration_hours,
        location: form.location,
        notes: form.notes,
        client_rate: worker?.hourly_rate || 0,
        total_amount: total,
      }).select().single();
      if (error) throw error;

      // Send notification to worker
      await supabase.from('notifications').insert({
        user_id: workerId,
        title: 'New Booking Request',
        message: `${profile?.full_name} has requested a booking for "${form.service_title}"`,
        type: 'booking',
        data: { booking_id: data.id },
      });

      toast.success('Booking request sent!');
      navigate(`/client/bookings/${data.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading..." />;
  if (!worker) return <div className="text-center py-16 text-gray-500">Worker not found.</div>;

  const total = (worker.hourly_rate || 0) * form.duration_hours;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Back
      </button>

      <div>
        <h1 className="page-title">Book a Worker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details for your booking</p>
      </div>

      {/* Worker summary */}
      <div className="card p-4 flex items-center gap-4">
        {worker.profiles?.avatar_url ? (
          <img src={worker.profiles.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            {(worker.profiles?.full_name || 'W').charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{worker.profiles?.full_name}</h3>
          <p className="text-sm text-gray-500">{worker.title || 'Service Professional'}</p>
          {worker.categories && <span className="badge bg-blue-50 text-blue-700 mt-1">{worker.categories.name}</span>}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">${worker.hourly_rate}</div>
          <div className="text-xs text-gray-400">per hour</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="form-group">
          <label className="label">Service Title *</label>
          <input className="input" placeholder="e.g. Fix leaking kitchen faucet" value={form.service_title} onChange={e => set('service_title', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Describe the work needed in detail..." value={form.service_description} onChange={e => set('service_description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label"><Calendar size={14} className="inline mr-1" />Date *</label>
            <input type="date" className="input" min={today} value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label"><Clock size={14} className="inline mr-1" />Time</label>
            <input type="time" className="input" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Estimated Duration (hours)</label>
          <select className="input" value={form.duration_hours} onChange={e => set('duration_hours', Number(e.target.value))}>
            {[0.5, 1, 1.5, 2, 3, 4, 5, 6, 8].map(h => <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label"><MapPin size={14} className="inline mr-1" />Service Location</label>
          <input className="input" placeholder="Your address" value={form.location} onChange={e => set('location', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label"><FileText size={14} className="inline mr-1" />Additional Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Any special instructions or access details..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Cost summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Rate</span>
            <span className="font-medium">${worker.hourly_rate}/hr</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium">{form.duration_hours} hr{form.duration_hours !== 1 ? 's' : ''}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Estimated Total</span>
            <span className="text-xl font-bold text-blue-700">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">The worker will review and confirm your request. You'll be notified once confirmed.</p>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
          {submitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Booking Request'}
        </button>
      </form>
    </div>
  );
}
