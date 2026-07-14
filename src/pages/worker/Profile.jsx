import { useState, useRef, useEffect } from "react";
import { Camera, Save, Plus, X, DollarSign } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function WorkerProfile() {
  const { user, profile, workerProfile, updateProfile, updateWorkerProfile } =
    useAuth();
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  const [pForm, setPForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
  });
  const [wForm, setWForm] = useState({
    title: workerProfile?.title || "",
    description: workerProfile?.description || "",
    hourly_rate: workerProfile?.hourly_rate || "",
    experience_years: workerProfile?.experience_years || "",
    category_id: workerProfile?.category_id || "",
    service_area: workerProfile?.service_area || "",
    skills: workerProfile?.skills || [],
    languages: workerProfile?.languages || ["English"],
    certificates: workerProfile?.certificates || [],
  });

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name")
      .eq("is_active", true)
      .then(({ data }) => setCategories(data || []));
  }, []);

  const setW = (k, v) => setWForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    if (newSkill.trim() && !wForm.skills.includes(newSkill.trim())) {
      setW("skills", [...wForm.skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (s) =>
    setW(
      "skills",
      wForm.skills.filter((sk) => sk !== s),
    );

  const addCert = () => {
    if (newCert.trim() && !wForm.certificates.includes(newCert.trim())) {
      setW("certificates", [...wForm.certificates, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        full_name: pForm.full_name,
        phone: pForm.phone,
        location: pForm.location,
        bio: pForm.bio,
      });
      await updateWorkerProfile({
        title: wForm.title,
        description: wForm.description,
        hourly_rate: parseFloat(wForm.hourly_rate) || 0,
        experience_years: parseInt(wForm.experience_years) || 0,
        category_id: wForm.category_id || null,
        service_area: wForm.service_area,
        skills: wForm.skills,
        languages: wForm.languages,
        certificates: wForm.certificates,
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.message || "Failed to save");
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
      toast.success("Photo updated!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.full_name || "W")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-gray-500">
          Complete your profile to attract more clients
        </p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white hover:bg-emerald-700 shadow-md"
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
          <p className="font-semibold text-gray-900">
            {profile?.full_name || "Your Name"}
          </p>
          <p className="text-sm text-gray-500">
            {workerProfile?.title || "Add your professional title"}
          </p>
          <span
            className={`badge mt-1 ${workerProfile?.approval_status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
          >
            {workerProfile?.approval_status || "pending"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                className="input"
                value={pForm.full_name}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input
                className="input"
                value={pForm.phone}
                onChange={(e) =>
                  setPForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Location / City</label>
            <input
              className="input"
              placeholder="e.g. New York, NY"
              value={pForm.location}
              onChange={(e) =>
                setPForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="label">Personal Bio</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Brief personal bio..."
              value={pForm.bio}
              onChange={(e) => setPForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
        </div>

        {/* Professional info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Professional Details</h2>
          <div className="form-group">
            <label className="label">Professional Title</label>
            <input
              className="input"
              placeholder="e.g. Licensed Electrician, Senior Plumber"
              value={wForm.title}
              onChange={(e) => setW("title", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Describe your services, experience, and what makes you stand out..."
              value={wForm.description}
              onChange={(e) => setW("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">
                <DollarSign size={13} className="inline" />
                Hourly Rate ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input"
                placeholder="50"
                value={wForm.hourly_rate}
                onChange={(e) => setW("hourly_rate", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Experience (years)</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="5"
                value={wForm.experience_years}
                onChange={(e) => setW("experience_years", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Category</label>
              <select
                className="input"
                value={wForm.category_id}
                onChange={(e) => setW("category_id", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Service Area</label>
              <input
                className="input"
                placeholder="e.g. Manhattan & Brooklyn"
                value={wForm.service_area}
                onChange={(e) => setW("service_area", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Skills</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Add a skill (e.g. Pipe fitting)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSkill())
              }
            />
            <button
              type="button"
              onClick={addSkill}
              className="btn-secondary px-3"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {wForm.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {skill}
                <button type="button" onClick={() => removeSkill(skill)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Certifications & Licenses</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Master Electrician License"
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCert())
              }
            />
            <button
              type="button"
              onClick={addCert}
              className="btn-secondary px-3"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {wForm.certificates.map((cert, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">{cert}</span>
                <button
                  type="button"
                  onClick={() =>
                    setW(
                      "certificates",
                      wForm.certificates.filter((_, ci) => ci !== i),
                    )
                  }
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary py-3 px-8"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Profile
        </button>
      </form>
    </div>
  );
}
