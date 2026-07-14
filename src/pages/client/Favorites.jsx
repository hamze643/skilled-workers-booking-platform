import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Briefcase, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import StarRating from "../../components/common/StarRating";
import toast from "react-hot-toast";

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    // Get favorites
    const { data: favoritesData, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("client_id", user.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Then fetch each worker manually
    const favoritesWithWorkers = await Promise.all(
      favoritesData.map(async (fav) => {
        const { data: worker } = await supabase
          .from("worker_profiles")
          .select("*")
          .eq("user_id", fav.worker_id)
          .single();

        return {
          ...fav,
          worker,
        };
      }),
    );

    setFavorites(favoritesWithWorkers);
    setLoading(false);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  const removeFavorite = async (id, workerId) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("Removed from favorites");
  };

  if (loading) return <LoadingSpinner text="Loading favorites..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Saved Workers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {favorites.length} saved professional
          {favorites.length !== 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Save workers you like for quick access later."
          action={
            <Link to="/client/browse" className="btn-primary">
              Browse Workers
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const w = fav.worker;
            console.log(w);
            if (!w) return null;
            return (
              <div key={fav.id} className="card p-5 relative group">
                <button
                  onClick={() => removeFavorite(fav.id, w.user_id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  {w.profiles?.avatar_url ? (
                    <img
                      src={w.profiles.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {(w.profiles?.full_name || "W").charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {w.profiles?.full_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {w.title || "Professional"}
                    </p>
                  </div>
                </div>
                {w.categories && (
                  <span className="badge bg-blue-50 text-blue-700 mb-2">
                    {w.categories.name}
                  </span>
                )}
                {w.profiles?.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <MapPin size={10} />
                    {w.profiles.location}
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-t border-gray-100 mb-3">
                  <div className="flex items-center gap-1">
                    <StarRating
                      rating={Math.round(w.avg_rating || 0)}
                      size={12}
                    />
                    <span className="text-xs text-gray-400">
                      ({w.total_reviews || 0})
                    </span>
                  </div>
                  <span className="font-bold text-sm text-gray-900">
                    ${w.hourly_rate}/hr
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/client/worker/${w.user_id}`}
                    className="btn-secondary flex-1 text-xs py-2"
                  >
                    View
                  </Link>
                  <Link
                    to={`/client/book/${w.user_id}`}
                    className="btn-primary flex-1 text-xs py-2"
                  >
                    Book
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
