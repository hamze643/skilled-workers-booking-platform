import { useState, useRef } from "react";
import { Camera, User, Phone, MapPin, FileText, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ClientProfile() {
  const { user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: urlWithBust });
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(
        'Upload failed. Make sure the "avatars" storage bucket exists.',
      );
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your personal information
        </p>
      </div>

      {/* Avatar section */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 shadow-md transition-colors"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {profile?.full_name || "Your Name"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="section-title">Personal Information</h2>

        <div className="form-group">
          <label className="label">
            <User size={13} className="inline mr-1" />
            Full Name
          </label>
          <input
            className="input"
            placeholder="Your full name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">
              <Phone size={13} className="inline mr-1" />
              Phone
            </label>
            <input
              className="input"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">
              <MapPin size={13} className="inline mr-1" />
              City / Location
            </label>
            <input
              className="input"
              placeholder="New York, NY"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">
            <FileText size={13} className="inline mr-1" />
            Bio
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Tell us a bit about yourself..."
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save Changes
          </button>
        </div>
      </form>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Role</span>
            <span className="badge bg-blue-100 text-blue-700 capitalize">
              {profile?.role}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium text-gray-900">
              {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
