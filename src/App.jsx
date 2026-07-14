import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Public
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Client
import ClientDashboard from "./pages/client/Dashboard";
import BrowseWorkers from "./pages/client/BrowseWorkers";
import WorkerPublicProfile from "./pages/client/WorkerProfile";
import BookWorker from "./pages/client/BookWorker";
import ClientBookings from "./pages/client/MyBookings";
import BookingDetail from "./pages/client/BookingDetail";
import ClientFavorites from "./pages/client/Favorites";
import ClientProfile from "./pages/client/Profile";
import ClientSettings from "./pages/client/Settings";
import ClientNotifications from "./pages/client/Notifications";
import ClientChat from "./pages/client/Chat";

// Worker
import WorkerDashboard from "./pages/worker/Dashboard";
import PendingApproval from "./pages/worker/PendingApproval";
import WorkerProfile from "./pages/worker/Profile";
import WorkerBookings from "./pages/worker/Bookings";
import WorkerBookingDetail from "./pages/worker/BookingDetail";
import WorkerEarnings from "./pages/worker/Earnings";
import WorkerAvailability from "./pages/worker/Availability";
import WorkerNotifications from "./pages/worker/Notifications";
import WorkerChat from "./pages/worker/Chat";
import WorkerSettings from "./pages/worker/Settings";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminWorkers from "./pages/admin/Workers";
import AdminBookings from "./pages/admin/Bookings";
import AdminCategories from "./pages/admin/Categories";
import AdminReviews from "./pages/admin/Reviews";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";

function ProtectedRoute({ children, role }) {
  const { user, profile, loading, workerProfile } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role)
    return <Navigate to="/unauthorized" replace />;
  if (profile?.is_suspended) return <Navigate to="/unauthorized" replace />;
  if (
    profile?.role === "worker" &&
    workerProfile?.approval_status === "pending" &&
    role === "worker"
  ) {
    const path = window.location.pathname;
    if (path !== "/worker/pending")
      return <Navigate to="/worker/pending" replace />;
  }
  return children;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : (
            <Navigate to={getRoleHome(profile?.role)} replace />
          )
        }
      />
      <Route
        path="/register"
        element={
          !user ? (
            <Register />
          ) : (
            <Navigate to={getRoleHome(profile?.role)} replace />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Client Routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute role="client">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/client/dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="browse" element={<BrowseWorkers />} />
        <Route path="worker/:workerId" element={<WorkerPublicProfile />} />
        <Route path="book/:workerId" element={<BookWorker />} />
        <Route path="bookings" element={<ClientBookings />} />
        <Route path="bookings/:bookingId" element={<BookingDetail />} />
        <Route path="favorites" element={<ClientFavorites />} />
        <Route path="chat" element={<ClientChat />} />
        <Route path="chat/:userId" element={<ClientChat />} />
        <Route path="notifications" element={<ClientNotifications />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="settings" element={<ClientSettings />} />
      </Route>

      {/* Worker Routes */}
      <Route
        path="/worker"
        element={
          <ProtectedRoute role="worker">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/worker/dashboard" replace />} />
        <Route path="pending" element={<PendingApproval />} />
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="profile" element={<WorkerProfile />} />
        <Route path="bookings" element={<WorkerBookings />} />
        <Route path="bookings/:bookingId" element={<WorkerBookingDetail />} />
        <Route path="earnings" element={<WorkerEarnings />} />
        <Route path="availability" element={<WorkerAvailability />} />
        <Route path="chat" element={<WorkerChat />} />
        <Route path="chat/:userId" element={<WorkerChat />} />
        <Route path="notifications" element={<WorkerNotifications />} />
        <Route path="settings" element={<WorkerSettings />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="workers" element={<AdminWorkers />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function getRoleHome(role) {
  if (role === "worker") return "/worker/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/client/dashboard";
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "10px",
              background: "#1e293b",
              color: "#f8fafc",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#f8fafc" },
            },
            error: { iconTheme: { primary: "#ef4444", secondary: "#f8fafc" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
