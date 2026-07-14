import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PendingApproval() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Under Review</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Your worker account is currently awaiting administrator approval.
          This process typically takes 1–2 business days. You'll receive a
          notification once your account is approved.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <CheckCircle size={14} className="text-amber-600 shrink-0" />
            Account created successfully
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Clock size={14} className="text-amber-600 shrink-0" />
            Awaiting admin verification
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertTriangle size={14} className="shrink-0" />
            Profile activation pending
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          While waiting, you can complete your profile so it's ready when approved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/worker/profile" className="btn-primary">Complete Profile</Link>
          <Link to="/worker/settings" className="btn-secondary">Settings</Link>
        </div>
      </div>
    </div>
  );
}
