import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  Heart,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Wrench,
  Tag,
  Star,
  BarChart2,
  Menu,
  X,
  ChevronDown,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import NotificationBell from "../common/NotificationBell";

const clientNav = [
  { to: "/client/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/client/browse", icon: Search, label: "Browse Workers" },
  { to: "/client/bookings", icon: Calendar, label: "My Bookings" },
  { to: "/client/favorites", icon: Heart, label: "Favorites" },
  { to: "/client/chat", icon: MessageSquare, label: "Messages" },
  { to: "/client/notifications", icon: Bell, label: "Notifications" },
  { to: "/client/profile", icon: User, label: "Profile" },
  { to: "/client/settings", icon: Settings, label: "Settings" },
];

const workerNav = [
  { to: "/worker/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/worker/bookings", icon: Calendar, label: "Bookings" },
  { to: "/worker/earnings", icon: DollarSign, label: "Earnings" },
  { to: "/worker/availability", icon: Clock, label: "Availability" },
  { to: "/worker/chat", icon: MessageSquare, label: "Messages" },
  { to: "/worker/notifications", icon: Bell, label: "Notifications" },
  { to: "/worker/profile", icon: Briefcase, label: "My Profile" },
  { to: "/worker/settings", icon: Settings, label: "Settings" },
];

const adminNav = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/workers", icon: Wrench, label: "Workers" },
  { to: "/admin/bookings", icon: Calendar, label: "Bookings" },
  { to: "/admin/categories", icon: Tag, label: "Categories" },
  { to: "/admin/reviews", icon: Star, label: "Reviews" },
  { to: "/admin/analytics", icon: Star, label: "Analytics" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

function Avatar({ profile, size = "sm" }) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }
  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const color =
    colors[(profile?.full_name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white`}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    client: "bg-blue-100 text-blue-700",
    worker: "bg-emerald-100 text-emerald-700",
    admin: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`badge ${map[role] || "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}

export default function DashboardLayout() {
  const { profile, workerProfile, signOut, isAdmin, isWorker, isClient } =
    useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = isAdmin ? adminNav : isWorker ? workerNav : clientNav;
  const roleLabel = isAdmin
    ? "Admin Panel"
    : isWorker
      ? "Worker Panel"
      : "Client Panel";
  const roleColor = isAdmin
    ? "text-violet-600"
    : isWorker
      ? "text-emerald-600"
      : "text-blue-600";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Wrench size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900 leading-tight">
            SkillHire
          </div>
          <div className={`text-xs font-medium ${roleColor}`}>{roleLabel}</div>
        </div>
      </div>

      {/* Worker pending banner */}
      {isWorker && workerProfile?.approval_status === "pending" && (
        <div className="mx-3 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            Account pending approval
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar profile={profile} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || "User"}
            </p>
            <RoleBadge role={profile?.role} />
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="sidebar-link sidebar-link-inactive w-full mt-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Avatar profile={profile} size="sm" />
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {profile?.full_name || "User"}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-dropdown z-50 py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">{profile?.role}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.full_name}
                  </p>
                </div>
                <NavLink
                  to={`/${profile?.role}/profile`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={14} /> Profile
                </NavLink>
                <NavLink
                  to={`/${profile?.role}/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={14} /> Settings
                </NavLink>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
