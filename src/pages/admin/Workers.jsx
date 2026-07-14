import { useEffect, useState } from 'react';
import { Search, CheckCircle, X, Ban, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

const APPROVAL_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-500',
};

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [viewWorker, setViewWorker] = useState(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('worker_profiles').select('*, profiles(full_name, avatar_url, location, phone, email:id), categories(name)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('approval_status', statusFilter);
    const { data } = await q;
    setWorkers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const doAction = async () => {
    const { id, action } = confirmAction;
    const statusMap = { approve: 'approved', reject: 'rejected', suspend: 'suspended', reactivate: 'approved' };
    const { error } = await supabase.from('worker_profiles').update({ approval_status: statusMap[action] }).eq('user_id', id);
    if (error) { toast.error(error.message); } else {
      toast.success(`Worker ${action}d`);
      // Notify worker
      const msgs = {
        approve: 'Congratulations! Your worker account has been approved. You can now receive bookings.',
        reject: 'Your worker account application has been reviewed and was not approved at this time.',
        suspend: 'Your worker account has been suspended. Please contact support.',
        reactivate: 'Your worker account has been reactivated.',
      };
      await supabase.from('notifications').insert({ user_id: id, title: `Account ${action}d`, message: msgs[action], type: 'system' });
      load();
    }
    setConfirmAction(null);
  };

  const filtered = workers.filter(w => {
    if (!search) return true;
    const s = search.toLowerCase();
    return w.profiles?.full_name?.toLowerCase().includes(s) || w.title?.toLowerCase().includes(s);
  });

  const tabs = ['all', 'pending', 'approved', 'rejected', 'suspended'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Worker Management</h1>
        <p className="text-sm text-gray-500">Approve and manage workers on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={`shrink-0 px-3 py-2.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === tab ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No workers found" description="Adjust your filters." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Worker</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Rate</th>
                  <th className="table-th">Rating</th>
                  <th className="table-th">Jobs</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(w => (
                  <tr key={w.user_id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {w.profiles?.avatar_url ? (
                          <img src={w.profiles.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {(w.profiles?.full_name || 'W').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{w.profiles?.full_name}</div>
                          <div className="text-xs text-gray-400">{w.title || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-gray-500 text-xs">{w.categories?.name || '—'}</td>
                    <td className="table-td font-semibold text-sm">${w.hourly_rate || 0}/hr</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{w.avg_rating?.toFixed(1) || '—'}</span>
                        <span className="text-xs text-gray-400">({w.total_reviews || 0})</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-500">{w.total_jobs || 0}</td>
                    <td className="table-td">
                      <span className={`badge ${APPROVAL_STYLES[w.approval_status]}`}>{w.approval_status}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => setViewWorker(w)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                          <Eye size={14} />
                        </button>
                        {w.approval_status === 'pending' && (
                          <>
                            <button onClick={() => setConfirmAction({ id: w.user_id, action: 'approve', label: 'Approve' })} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => setConfirmAction({ id: w.user_id, action: 'reject', label: 'Reject', danger: true })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {w.approval_status === 'approved' && (
                          <button onClick={() => setConfirmAction({ id: w.user_id, action: 'suspend', label: 'Suspend', danger: true })} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50">
                            <Ban size={14} />
                          </button>
                        )}
                        {['rejected', 'suspended'].includes(w.approval_status) && (
                          <button onClick={() => setConfirmAction({ id: w.user_id, action: 'reactivate', label: 'Reactivate' })} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle size={14} />
                          </button>
                        )}
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
        title={`${confirmAction?.label} Worker`}
        message={`Are you sure you want to ${confirmAction?.action} this worker?`}
        confirmText={confirmAction?.label}
        danger={confirmAction?.danger}
      />

      {/* Worker detail modal */}
      <Modal isOpen={!!viewWorker} onClose={() => setViewWorker(null)} title="Worker Details" size="lg">
        {viewWorker && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {viewWorker.profiles?.avatar_url ? (
                <img src={viewWorker.profiles.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {(viewWorker.profiles?.full_name || 'W').charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900">{viewWorker.profiles?.full_name}</h3>
                <p className="text-sm text-gray-500">{viewWorker.title}</p>
                <span className={`badge ${APPROVAL_STYLES[viewWorker.approval_status]} mt-1`}>{viewWorker.approval_status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Category:</span> <span className="font-medium">{viewWorker.categories?.name || '—'}</span></div>
              <div><span className="text-gray-500">Rate:</span> <span className="font-medium">${viewWorker.hourly_rate}/hr</span></div>
              <div><span className="text-gray-500">Experience:</span> <span className="font-medium">{viewWorker.experience_years || 0} years</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{viewWorker.profiles?.location || '—'}</span></div>
              <div><span className="text-gray-500">Total Jobs:</span> <span className="font-medium">{viewWorker.total_jobs || 0}</span></div>
              <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{viewWorker.avg_rating?.toFixed(1) || '—'} ({viewWorker.total_reviews || 0} reviews)</span></div>
            </div>
            {viewWorker.description && <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">{viewWorker.description}</div>}
            {viewWorker.skills?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewWorker.skills.map(s => <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
