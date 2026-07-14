import { useState } from 'react';
import { Save, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export default function WorkerAvailability() {
  const { workerProfile, updateWorkerProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState(workerProfile?.is_available ?? true);
  const [schedule, setSchedule] = useState(
    workerProfile?.availability_schedule || { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  );
  const [hours, setHours] = useState(
    workerProfile?.working_hours || { start: '08:00', end: '18:00' }
  );

  const toggleDay = (key) => setSchedule(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWorkerProfile({
        is_available: isAvailable,
        availability_schedule: schedule,
        working_hours: hours,
      });
      toast.success('Availability updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Availability</h1>
        <p className="text-sm text-gray-500">Set your working schedule so clients know when to book you</p>
      </div>

      {/* Toggle availability */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Current Status</h2>
            <p className="text-sm text-gray-500 mt-0.5">Toggle your overall availability for new bookings</p>
          </div>
          <button onClick={() => setIsAvailable(v => !v)} className="relative">
            <div className={`w-14 h-7 rounded-full transition-colors ${isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAvailable ? 'translate-x-8' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isAvailable ? 'Available for bookings' : 'Not accepting new bookings'}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Weekly Schedule</h2>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${schedule[key] ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-sm font-medium ${schedule[key] ? 'text-emerald-800' : 'text-gray-500'}`}>{label}</span>
              <button onClick={() => toggleDay(key)} className="relative">
                <div className={`w-11 h-6 rounded-full transition-colors ${schedule[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule[key] ? 'translate-x-5.5' : 'translate-x-0.5'}`} style={{ transform: schedule[key] ? 'translateX(22px)' : 'translateX(2px)' }} />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Working hours */}
      <div className="card p-6">
        <h2 className="section-title mb-4"><Clock size={16} className="inline mr-1.5" />Working Hours</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Start Time</label>
            <input type="time" className="input" value={hours.start} onChange={e => setHours(h => ({ ...h, start: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">End Time</label>
            <input type="time" className="input" value={hours.end} onChange={e => setHours(h => ({ ...h, end: e.target.value }))} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Clients will only see available times within these hours</p>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-8">
        {saving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
        Save Availability
      </button>
    </div>
  );
}
