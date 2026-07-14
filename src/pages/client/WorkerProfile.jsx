import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Briefcase, Heart, MessageSquare, Calendar, ChevronLeft, Award, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

export default function WorkerProfile() {
  const { workerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    const load = async () => {
      const [wpRes, revRes, favRes] = await Promise.all([
        supabase.from('worker_profiles').select('*, profiles(full_name, avatar_url, location, bio, phone), categories(name, slug)').eq('user_id', workerId).maybeSingle(),
        supabase.from('reviews').select('*, profiles:client_id(full_name, avatar_url)').eq('worker_id', workerId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(10),
        user ? supabase.from('favorites').select('id').eq('client_id', user.id).eq('worker_id', workerId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setWorker(wpRes.data);
      setReviews(revRes.data || []);
      setIsFavorite(!!favRes.data);
      setLoading(false);
    };
    load();
  }, [workerId, user]);

  const toggleFavorite = async () => {
    if (!user) { toast.error('Sign in to save favorites'); return; }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('client_id', user.id).eq('worker_id', workerId);
      setIsFavorite(false); toast.success('Removed from favorites');
    } else {
      await supabase.from('favorites').insert({ client_id: user.id, worker_id: workerId });
      setIsFavorite(true); toast.success('Added to favorites');
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!worker) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Worker not found.</p>
      <Link to="/client/browse" className="btn-primary mt-4 inline-flex">Browse Workers</Link>
    </div>
  );

  const days = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="shrink-0">
            {worker.profiles?.avatar_url ? (
              <img src={worker.profiles.avatar_url} alt="" className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                {(worker.profiles?.full_name || 'W').charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{worker.profiles?.full_name}</h1>
                <p className="text-sm text-blue-600 font-medium">{worker.title || 'Service Professional'}</p>
                {worker.categories && <span className="badge bg-blue-50 text-blue-700 mt-1">{worker.categories.name}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={toggleFavorite} className={`btn-secondary py-2 px-3 ${isFavorite ? 'text-rose-500 border-rose-200' : ''}`}>
                  <Heart size={16} className={isFavorite ? 'fill-rose-500' : ''} />
                </button>
                <Link to={`/client/chat/${workerId}`} className="btn-secondary py-2 px-3">
                  <MessageSquare size={16} />
                </Link>
                <Link to={`/client/book/${workerId}`} className="btn-primary">Book Now</Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {worker.profiles?.location && <span className="flex items-center gap-1"><MapPin size={13} />{worker.profiles.location}</span>}
              <span className="flex items-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" />{worker.avg_rating?.toFixed(1) || '0.0'} ({worker.total_reviews || 0} reviews)</span>
              <span className="flex items-center gap-1"><Briefcase size={13} />{worker.total_jobs || 0} jobs completed</span>
              {worker.experience_years > 0 && <span className="flex items-center gap-1"><Award size={13} />{worker.experience_years} yrs experience</span>}
            </div>
            <div className="mt-3 text-xl font-bold text-gray-900">${worker.hourly_rate}<span className="text-sm font-normal text-gray-400">/hour</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {['about', 'portfolio', 'reviews', 'availability'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'about' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {worker.description && (
              <div className="card p-5">
                <h3 className="section-title mb-3">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{worker.description}</p>
              </div>
            )}
            {worker.skills?.length > 0 && (
              <div className="card p-5">
                <h3 className="section-title mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {worker.languages?.length > 0 && (
              <div className="card p-5">
                <h3 className="section-title mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.languages.map(lang => (
                    <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="section-title mb-3">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-semibold">${worker.hourly_rate}/hr</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-semibold">{worker.experience_years || 0} years</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Jobs Done</span><span className="font-semibold">{worker.total_jobs || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-semibold">{worker.avg_rating?.toFixed(1) || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Available</span><span className={`font-semibold ${worker.is_available ? 'text-emerald-600' : 'text-red-500'}`}>{worker.is_available ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
            <Link to={`/client/book/${workerId}`} className="btn-primary w-full justify-center py-3">
              <Calendar size={16} /> Book Appointment
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Portfolio</h3>
          {worker.portfolio_images?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {worker.portfolio_images.map((img, i) => (
                <img key={i} src={img} alt={`Portfolio ${i + 1}`} className="w-full h-40 object-cover rounded-xl" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No portfolio images yet.</p>
          )}
          {worker.certificates?.length > 0 && (
            <>
              <h4 className="font-semibold text-gray-900 mt-6 mb-3">Certificates</h4>
              <div className="space-y-2">
                {worker.certificates.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Award size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="card p-8 text-center">
              <Star size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No reviews yet.</p>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                    {(review.profiles?.full_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{review.profiles?.full_name || 'Client'}</div>
                    <div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <StarRating rating={review.rating} size={13} />
              </div>
              <p className="text-sm text-gray-600">{review.comment}</p>
              {review.worker_reply && (
                <div className="mt-3 pl-3 border-l-2 border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Worker's reply:</p>
                  <p className="text-xs text-gray-600">{review.worker_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Weekly Availability</h3>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {Object.entries(days).map(([key, label]) => (
              <div key={key} className={`text-center p-3 rounded-xl border ${worker.availability_schedule?.[key] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                <div className="text-xs font-semibold">{label}</div>
                <div className="text-xs mt-1">{worker.availability_schedule?.[key] ? '✓' : '✕'}</div>
              </div>
            ))}
          </div>
          {worker.working_hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="text-blue-600" />
              Working hours: <strong>{worker.working_hours.start} – {worker.working_hours.end}</strong>
            </div>
          )}
          <Link to={`/client/book/${workerId}`} className="btn-primary w-full justify-center mt-5 py-3">
            Book This Worker
          </Link>
        </div>
      )}
    </div>
  );
}
