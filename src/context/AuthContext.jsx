import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) setProfile(data);
    return data;
  }, []);

  const fetchWorkerProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("worker_profiles")
      .select("*, categories(name,slug,icon)")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error) setWorkerProfile(data);
    return data;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (p?.role === "worker") await fetchWorkerProfile(session.user.id);
        }
        setLoading(false);
      })();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (p?.role === "worker") await fetchWorkerProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setWorkerProfile(null);
        }
        if (event !== "INITIAL_SESSION") setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchWorkerProfile]);

  const signUp = async ({
    email,
    password,
    full_name,
    role,
    phone,
    location,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role, phone, location } },
    });
    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      const p = await fetchProfile(data.user.id);
      if (p?.role === "worker") await fetchWorkerProfile(data.user.id);
    }
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    const p = await fetchProfile(data.user.id);
    if (p?.role === "worker") await fetchWorkerProfile(data.user.id);
    return { ...data, profile: p };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const updateWorkerProfile = async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("worker_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("*, categories(name,slug,icon)")
      .single();
    if (error) throw error;
    setWorkerProfile(data);
    return data;
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
    if (profile?.role === "worker") await fetchWorkerProfile(user.id);
  }, [user, profile?.role, fetchProfile, fetchWorkerProfile]);

  const value = {
    user,
    profile,
    workerProfile,
    loading,
    isClient: profile?.role === "client",
    isWorker: profile?.role === "worker",
    isAdmin: profile?.role === "admin",
    isSuspended: profile?.is_suspended,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateWorkerProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
