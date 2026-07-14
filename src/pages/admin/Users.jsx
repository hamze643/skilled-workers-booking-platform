import { useEffect, useState } from 'react';
import { Search, Users, Shield, Trash2, Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('client');
  const [confirmAction, setConfirmAction] = useState(null);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', roleFilter)
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [roleFilter]);

  const doAction = async () => {
    const { id, action } = confirmAction;
    let error;
    if (action === 'suspend') {
      ({ error } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', id));
    } else if (action === 'activate') {
      ({ error } = await supabase.from('profiles').update({ is_suspended: false }).eq('id', id));
    } else if (action === 'delete') {
      ({ error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id));
    }
    if (error) { toast.error(error.message); } else { toast.success('Done'); load(); }
    setConfirmAction(null);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.phone?.toLowerCase().includes(s) || u.location?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="text-sm text-gray-500">Manage platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['client', 'worker'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${roleFilter === r ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r}s
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {(u.full_name || 'U').charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 text-sm">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-500">{u.location || '—'}</td>
                    <td className="table-td text-gray-500">{u.phone || '—'}</td>
                    <td className="table-td">
                      <span className={`badge ${u.is_suspended ? 'bg-red-100 text-red-700' : u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_suspended ? 'Suspended' : u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        {u.is_suspended ? (
                          <button onClick={() => setConfirmAction({ id: u.id, action: 'activate', label: 'Activate' })} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
                            <Shield size={14} />
                          </button>
                        ) : (
                          <button onClick={() => setConfirmAction({ id: u.id, action: 'suspend', label: 'Suspend' })} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50">
                            <Ban size={14} />
                          </button>
                        )}
                        <button onClick={() => setConfirmAction({ id: u.id, action: 'delete', label: 'Deactivate', danger: true })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={doAction}
        title={`${confirmAction?.label} User`}
        message={`Are you sure you want to ${confirmAction?.action} this user?`}
        confirmText={confirmAction?.label}
        danger={confirmAction?.danger}
      />
    </div>
  );
}
