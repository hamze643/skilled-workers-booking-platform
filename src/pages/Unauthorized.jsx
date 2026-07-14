import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { profile } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={36} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">You don't have permission to access this page.</p>
        <Link to={profile ? `/${profile.role}/dashboard` : '/login'} className="btn-primary">
          {profile ? 'Go to Dashboard' : 'Sign In'}
        </Link>
      </div>
    </div>
  );
}
