import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ICON_OPTIONS = ['Wrench', 'Zap', 'Hammer', 'Paintbrush', 'Sparkles', 'Leaf', 'Wind', 'Package', 'Shield', 'Monitor', 'Briefcase', 'Home', 'Car', 'Scissors'];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', slug: '', description: '', icon: 'Briefcase', is_active: true });

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ id: null, name: '', slug: '', description: '', icon: 'Briefcase', is_active: true }); setModalOpen(true); };
  const openEdit = (cat) => { setForm({ ...cat }); setModalOpen(true); };

  const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug || slugify(form.name), description: form.description, icon: form.icon, is_active: form.is_active };
      const { error } = form.id
        ? await supabase.from('categories').update(payload).eq('id', form.id)
        : await supabase.from('categories').insert(payload);
      if (error) throw error;
      toast.success(form.id ? 'Category updated!' : 'Category created!');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); } else { toast.success('Category deleted'); load(); }
    setDeleteId(null);
  };

  const toggleActive = async (cat) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-gray-500">Manage service categories for the platform</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className={`card p-5 ${!cat.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Tag size={18} className="text-blue-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description || 'No description'}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">/{cat.slug}</span>
              <button onClick={() => toggleActive(cat)} className={`badge cursor-pointer ${cat.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="form-group">
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} required />
          </div>
          <div className="form-group">
            <label className="label">Slug</label>
            <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Icon Name</label>
            <select className="input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
              {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Are you sure? This will affect workers assigned to this category." confirmText="Delete" danger />
    </div>
  );
}
