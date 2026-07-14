import { useState } from 'react';
import { Lock, Eye, EyeOff, Bell, Shield, Trash2, AlertTriangle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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

export default function ClientSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ email_bookings: true, email_messages: true, email_promotions: false });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passForm.new.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.new });
      if (error) throw error;
      toast.success('Password updated!');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await supabase.from('profiles').update({ is_active: false }).eq('id', user.id);
      await signOut();
      toast.success('Account deactivated.');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences and security</p>
      </div>

      {/* Change Password */}
      <Section title="Change Password" desc="Update your password regularly to keep your account secure.">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="form-group">
            <label className="label">Current Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input pl-10"
                placeholder="Current password"
                value={passForm.current}
                onChange={e => setPassForm(f => ({ ...f, current: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-9"
                  placeholder="New password"
                  value={passForm.new}
                  onChange={e => setPassForm(f => ({ ...f, new: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10"
                  placeholder="Confirm password"
                  value={passForm.confirm}
                  onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <button type="submit" disabled={savingPass} className="btn-primary">
            {savingPass ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
            Update Password
          </button>
        </form>
      </Section>

      {/* Notification Preferences */}
      <Section title="Notifications" desc="Choose what you'd like to be notified about.">
        <div className="space-y-3">
          {[
            { key: 'email_bookings', label: 'Booking Updates', desc: 'Get notified about booking confirmations, cancellations, and completions.' },
            { key: 'email_messages', label: 'New Messages', desc: 'Get notified when workers send you messages.' },
            { key: 'email_promotions', label: 'Promotions & Tips', desc: 'Receive tips, promotions, and platform updates.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50">
              <div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ml-4 ${notifPrefs[key] ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" desc="Keep your account protected.">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <div className="text-sm font-medium text-emerald-800">Email Verified</div>
            </div>
            <span className="badge bg-emerald-100 text-emerald-700">Active</span>
          </div>
          <p className="text-xs text-gray-500">Last sign-in: {new Date().toLocaleDateString()}</p>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" desc="Irreversible actions — proceed with caution.">
        <div className="p-4 border border-red-200 rounded-xl bg-red-50">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Delete Account</p>
              <p className="text-xs text-red-600 mt-0.5">This will deactivate your account. All your data will be preserved but your account will be inaccessible.</p>
            </div>
          </div>
          <button onClick={() => setDeleteModal(true)} className="btn-danger text-sm py-2">
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </Section>

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will deactivate your profile permanently."
        confirmText="Delete Account"
        danger
        loading={deletingAccount}
      />
    </div>
  );
}
