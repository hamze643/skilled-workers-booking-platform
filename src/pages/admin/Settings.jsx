import { useState } from 'react';
import { Save, Bell, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

function Section({ title, desc, children }) {
  return (
    <div className="card p-6">
      <div className="mb-5">
        <h2 className="section-title">{title}</h2>
        {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const [platformName, setPlatformName] = useState('SkillHire');
  const [announcement, setAnnouncement] = useState({ title: '', message: '', type: 'info', target: 'all' });
  const [sending, setSending] = useState(false);

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      let roleFilter = null;
      if (announcement.target !== 'all') roleFilter = announcement.target;

      const { data: users } = await supabase.from('profiles').select('id').eq('is_active', true).eq('is_suspended', false)
        .then(res => roleFilter ? supabase.from('profiles').select('id').eq('is_active', true).eq('role', roleFilter) : res);

      if (!users?.length) { toast.error('No users to notify'); setSending(false); return; }

      const notifications = users.map(u => ({
        user_id: u.id,
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      toast.success(`Announcement sent to ${users.length} users!`);
      setAnnouncement({ title: '', message: '', type: 'info', target: 'all' });
    } catch (err) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Platform Settings</h1>
        <p className="text-sm text-gray-500">Configure and manage the platform</p>
      </div>

      <Section title="Platform Configuration" desc="General platform settings.">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Platform Name</label>
            <input className="input" value={platformName} onChange={e => setPlatformName(e.target.value)} />
          </div>
          <button className="btn-primary">
            <Save size={14} /> Save Settings
          </button>
        </div>
      </Section>

      <Section title="Send Announcement" desc="Broadcast a notification to platform users.">
        <form onSubmit={sendAnnouncement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Target Audience</label>
              <select className="input" value={announcement.target} onChange={e => setAnnouncement(a => ({ ...a, target: e.target.value }))}>
                <option value="all">All Users</option>
                <option value="client">Clients Only</option>
                <option value="worker">Workers Only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Notification Type</label>
              <select className="input" value={announcement.type} onChange={e => setAnnouncement(a => ({ ...a, type: e.target.value }))}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" placeholder="Announcement title" value={announcement.title} onChange={e => setAnnouncement(a => ({ ...a, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Message</label>
            <textarea className="input resize-none" rows={3} placeholder="Write your announcement..." value={announcement.message} onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))} required />
          </div>
          <button type="submit" disabled={sending} className="btn-primary">
            {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
            Send Announcement
          </button>
        </form>
      </Section>

      <Section title="Booking Rules" desc="Configure booking behavior.">
        <div className="space-y-4 text-sm text-gray-600">
          {[
            { label: 'Allow same-day bookings', checked: true },
            { label: 'Require phone verification', checked: false },
            { label: 'Auto-expire pending bookings after 24h', checked: true },
            { label: 'Allow booking cancellations', checked: true },
          ].map(({ label, checked: c }) => (
            <div key={label} className="flex items-center justify-between">
              <span>{label}</span>
              <div className={`relative w-11 h-6 rounded-full cursor-pointer ${c ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c ? 'translate-x-5.5' : 'translate-x-0.5'}`} style={{ transform: c ? 'translateX(22px)' : 'translateX(2px)' }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
