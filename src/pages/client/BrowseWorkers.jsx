import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, X, Heart, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

function WorkerCard({ worker, isFavorite, onToggleFavorite }) {
  return (
    <div className="card hover:shadow-card-hover transition-all group overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {worker.profiles?.avatar_url ? (
              <img src={worker.profiles.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {(worker.profiles?.full_name || 'W').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{worker.profiles?.full_name || 'Worker'}</h3>
              <p className="text-xs text-gray-500">{worker.title || 'Service Professional'}</p>
              {worker.profiles?.location && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-gray-400" />
                  <span className="text-xs text-gray-400">{worker.profiles.location}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(worker.user_id, isFavorite)}
            className={`p-1.5 rounded-lg transition-colors ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-gray-300 hover:text-rose-400 hover:bg-rose-50'}`}
          >
            <Heart size={16} className={isFavorite ? 'fill-rose-500' : ''} />
          </button>
        </div>

        {worker.categories && (
          <span className="badge bg-blue-50 text-blue-700 mb-3">{worker.categories.name}</span>
        )}

        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{worker.description || 'Experienced professional ready to help.'}</p>

        {worker.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {worker.skills.slice(0, 3).map(skill => (
              <span key={skill} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{skill}</span>
            ))}
            {worker.skills.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">+{worker.skills.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <StarRating rating={Math.round(worker.avg_rating || 0)} size={13} />
            <span className="text-xs text-gray-500">({worker.total_reviews || 0})</span>
          </div>
          <span className="text-sm font-bold text-gray-900">${worker.hourly_rate || 0}<span className="font-normal text-gray-400 text-xs">/hr</span></span>
        </div>

        <div className="flex gap-2 mt-3">
          <Link to={`/client/worker/${worker.user_id}`} className="btn-secondary flex-1 text-xs py-2">View Profile</Link>
          <Link to={`/client/book/${worker.user_id}`} className="btn-primary flex-1 text-xs py-2">Book Now</Link>
        </div>
      </div>
    </div>
  );
}

export default function BrowseWorkers() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', location: '', minRate: '', maxRate: '', minRating: '', sortBy: 'rating' });

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('worker_profiles')
      .select('*, profiles(full_name, avatar_url, location), categories(name, slug)')
      .eq('approval_status', 'approved')
      .eq('is_available', true);

    if (filters.category) q = q.eq('category_id', filters.category);
    if (filters.minRate) q = q.gte('hourly_rate', filters.minRate);
    if (filters.maxRate) q = q.lte('hourly_rate', filters.maxRate);
    if (filters.minRating) q = q.gte('avg_rating', filters.minRating);
    if (filters.sortBy === 'rating') q = q.order('avg_rating', { ascending: false });
    else if (filters.sortBy === 'price_low') q = q.order('hourly_rate', { ascending: true });
    else if (filters.sortBy === 'price_high') q = q.order('hourly_rate', { ascending: false });
    else if (filters.sortBy === 'jobs') q = q.order('total_jobs', { ascending: false });

    const { data, error } = await q;
    if (error) { toast.error('Failed to load workers'); setLoading(false); return; }

    let results = data || [];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(w =>
        w.profiles?.full_name?.toLowerCase().includes(s) ||
        w.title?.toLowerCase().includes(s) ||
        w.skills?.some(sk => sk.toLowerCase().includes(s))
      );
    }
    if (filters.location) {
      const l = filters.location.toLowerCase();
      results = results.filter(w => w.profiles?.location?.toLowerCase().includes(l));
    }
    setWorkers(results);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  useEffect(() => {
    supabase.from('categories').select('id,name').eq('is_active', true).then(({ data }) => setCategories(data || []));
    if (user) {
      supabase.from('favorites').select('worker_id').eq('client_id', user.id).then(({ data }) => {
        setFavorites(new Set((data || []).map(f => f.worker_id)));
      });
    }
  }, [user]);

  const toggleFavorite = async (workerId, isFav) => {
    if (!user) { toast.error('Sign in to save favorites'); return; }
    if (isFav) {
      await supabase.from('favorites').delete().eq('client_id', user.id).eq('worker_id', workerId);
      setFavorites(prev => { const s = new Set(prev); s.delete(workerId); return s; });
      toast.success('Removed from favorites');
    } else {
      await supabase.from('favorites').insert({ client_id: user.id, worker_id: workerId });
      setFavorites(prev => new Set([...prev, workerId]));
      toast.success('Added to favorites');
    }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ search: '', category: '', location: '', minRate: '', maxRate: '', minRating: '', sortBy: 'rating' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Browse Workers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find skilled professionals near you</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, skill, or service..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-40" placeholder="Location" value={filters.location} onChange={e => setFilter('location', e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary gap-2">
          <SlidersHorizontal size={16} /> Filters
          {(filters.category || filters.minRate || filters.maxRate || filters.minRating) && (
            <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">!</span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div className="form-group">
            <label className="label">Category</label>
            <select className="input" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Min Rating</label>
            <select className="input" value={filters.minRating} onChange={e => setFilter('minRating', e.target.value)}>
              <option value="">Any Rating</option>
              {[4, 3, 2].map(r => <option key={r} value={r}>{r}+ Stars</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Price Range ($/hr)</label>
            <div className="flex gap-2">
              <input className="input" placeholder="Min" type="number" value={filters.minRate} onChange={e => setFilter('minRate', e.target.value)} />
              <input className="input" placeholder="Max" type="number" value={filters.maxRate} onChange={e => setFilter('maxRate', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Sort By</label>
            <select className="input" value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value)}>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="jobs">Most Jobs</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button onClick={clearFilters} className="btn-secondary text-sm">
              <X size={14} /> Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{workers.length} workers found</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Finding workers..." />
      ) : workers.length === 0 ? (
        <EmptyState icon={Search} title="No workers found" description="Try adjusting your search or filters." action={<button onClick={clearFilters} className="btn-secondary">Clear Filters</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map(worker => (
            <WorkerCard key={worker.id} worker={worker} isFavorite={favorites.has(worker.user_id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
