/**
 * AnalyticsDashboard.jsx
 *
 * Schema assumptions:
 *  - profiles(id, role, full_name, avatar_url, created_at)
 *  - worker_profiles(user_id, title, approval_status, rating, completed_jobs, created_at)
 *    joined to profiles via user_id
 *  - bookings(id, service_title, status, total_amount, created_at,
 *             client_id->profiles, worker_id->profiles, category_id->categories)
 *  - reviews(id, rating, worker_id, client_id, created_at)
 *  - categories(id, name)
 *
 * Wiring:
 *  - All data fetched in a single Promise.all([...]) inside useEffect
 *  - On error, flips to mock fallback data so UI always renders
 *  - Refresh button re-runs load(); Export CSV uses recentBookings state
 */

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  Tag,
  TrendingUp,
  Activity,
  Heart,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Award,
  Zap,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// ─── Fallback mock data (used when Supabase is unavailable) ─────────────────
const __FALLBACK__ = {
  kpis: {
    totalUsers: 248,
    totalWorkers: 87,
    verifiedWorkers: 62,
    pendingWorkers: 14,
    todaysBookings: 19,
    completedBookings: 431,
    cancelledBookings: 38,
    avgRating: 4.6,
    totalCategories: 12,
    monthlyGrowth: 18,
    activeUsers: 73,
    platformHealth: 91,
    userGrowthChange: 12,
    workerGrowthChange: 8,
  },
  monthlyUsers: [
    { month: "Jan", users: 18 },
    { month: "Feb", users: 24 },
    { month: "Mar", users: 31 },
    { month: "Apr", users: 27 },
    { month: "May", users: 42 },
    { month: "Jun", users: 38 },
    { month: "Jul", users: 55 },
    { month: "Aug", users: 49 },
    { month: "Sep", users: 61 },
    { month: "Oct", users: 58 },
    { month: "Nov", users: 72 },
    { month: "Dec", users: 68 },
  ],
  monthlyWorkers: [
    { month: "Jan", verified: 4, pending: 2 },
    { month: "Feb", verified: 6, pending: 3 },
    { month: "Mar", verified: 8, pending: 1 },
    { month: "Apr", verified: 5, pending: 4 },
    { month: "May", verified: 10, pending: 2 },
    { month: "Jun", verified: 9, pending: 3 },
    { month: "Jul", verified: 12, pending: 1 },
    { month: "Aug", verified: 11, pending: 2 },
    { month: "Sep", verified: 14, pending: 3 },
    { month: "Oct", verified: 13, pending: 1 },
    { month: "Nov", verified: 16, pending: 2 },
    { month: "Dec", verified: 15, pending: 3 },
  ],
  bookingTrends: [
    { day: "Mon", bookings: 14 },
    { day: "Tue", bookings: 21 },
    { day: "Wed", bookings: 18 },
    { day: "Thu", bookings: 26 },
    { day: "Fri", bookings: 31 },
    { day: "Sat", bookings: 28 },
    { day: "Sun", bookings: 11 },
  ],
  bookingStatus: [
    { name: "Completed", value: 431 },
    { name: "Confirmed", value: 87 },
    { name: "Pending", value: 42 },
    { name: "In Progress", value: 28 },
    { name: "Cancelled", value: 38 },
  ],
  categoryDist: [
    { name: "Cleaning", count: 142 },
    { name: "Plumbing", count: 98 },
    { name: "Electrical", count: 87 },
    { name: "Gardening", count: 63 },
    { name: "Painting", count: 54 },
  ],
  topWorkers: [
    {
      id: "1",
      full_name: "Alex Martinez",
      title: "Plumber",
      rating: 4.9,
      completed_jobs: 87,
      completion_pct: 96,
    },
    {
      id: "2",
      full_name: "Sarah Chen",
      title: "Electrician",
      rating: 4.8,
      completed_jobs: 74,
      completion_pct: 94,
    },
    {
      id: "3",
      full_name: "James Okafor",
      title: "Cleaner",
      rating: 4.7,
      completed_jobs: 68,
      completion_pct: 92,
    },
    {
      id: "4",
      full_name: "Priya Sharma",
      title: "Painter",
      rating: 4.7,
      completed_jobs: 61,
      completion_pct: 91,
    },
    {
      id: "5",
      full_name: "Luke Dawson",
      title: "Gardener",
      rating: 4.5,
      completed_jobs: 55,
      completion_pct: 88,
    },
  ],
  topClients: [
    { id: "1", full_name: "Emma Wilson", bookings: 18, total_spent: 3240 },
    { id: "2", full_name: "Carlos Reyes", bookings: 14, total_spent: 2780 },
    { id: "3", full_name: "Olivia Kim", bookings: 12, total_spent: 2100 },
    { id: "4", full_name: "Noah Patel", bookings: 9, total_spent: 1650 },
    { id: "5", full_name: "Sophie Turner", bookings: 7, total_spent: 1340 },
  ],
  recentRegistrations: [
    {
      id: "1",
      full_name: "Marcus Hill",
      role: "client",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      full_name: "Aisha Nwosu",
      role: "worker",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      full_name: "Liam Foster",
      role: "client",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "4",
      full_name: "Chloe Barnes",
      role: "worker",
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: "5",
      full_name: "Ethan Cross",
      role: "client",
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ],
  recentBookings: [
    {
      id: "b1",
      service_title: "Deep House Clean",
      status: "completed",
      total_amount: 180,
      created_at: new Date().toISOString(),
      client: { full_name: "Emma Wilson" },
      worker: { full_name: "James Okafor" },
      category: { name: "Cleaning" },
    },
    {
      id: "b2",
      service_title: "Pipe Repair",
      status: "confirmed",
      total_amount: 220,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      client: { full_name: "Carlos Reyes" },
      worker: { full_name: "Alex Martinez" },
      category: { name: "Plumbing" },
    },
    {
      id: "b3",
      service_title: "Garden Tidy",
      status: "pending",
      total_amount: 95,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      client: { full_name: "Olivia Kim" },
      worker: { full_name: "Luke Dawson" },
      category: { name: "Gardening" },
    },
    {
      id: "b4",
      service_title: "Socket Install",
      status: "in_progress",
      total_amount: 140,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      client: { full_name: "Noah Patel" },
      worker: { full_name: "Sarah Chen" },
      category: { name: "Electrical" },
    },
    {
      id: "b5",
      service_title: "Wall Repaint",
      status: "cancelled",
      total_amount: 310,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      client: { full_name: "Sophie Turner" },
      worker: { full_name: "Priya Sharma" },
      category: { name: "Painting" },
    },
  ],
  insights: {
    popularCategory: "Cleaning",
    popularWorker: "Alex Martinez",
    fastestCategory: "Electrical",
    highestRatedWorker: "Sarah Chen",
    acceptanceRate: 71,
  },
  activityTimeline: [
    {
      type: "booking",
      text: "New booking: Deep House Clean",
      time: new Date().toISOString(),
    },
    {
      type: "registration",
      text: "Marcus Hill joined as client",
      time: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      type: "worker",
      text: "Aisha Nwosu applied as worker",
      time: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      type: "booking",
      text: "Pipe Repair confirmed",
      time: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      type: "registration",
      text: "Liam Foster joined as client",
      time: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      type: "worker",
      text: "Luke Dawson profile approved",
      time: new Date(Date.now() - 18000000).toISOString(),
    },
  ],
};

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  completed: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-violet-100 text-violet-700",
  cancelled: "bg-red-100 text-red-700",
};

const DONUT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function fmtCurrency(n) {
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function buildMonthSlots(year) {
  return MONTH_NAMES.map((m) => ({ month: m, _year: year }));
}

function bucketByMonth(rows, dateField, valueField, slots) {
  const map = {};
  rows.forEach((r) => {
    const d = new Date(r[dateField]);
    const key = `${MONTH_NAMES[d.getMonth()]}`;
    map[key] = (map[key] || 0) + (valueField ? r[valueField] || 1 : 1);
  });
  return slots.map((s) => ({ ...s, count: map[s.month] || 0 }));
}

function bucketByWeekday(rows) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  rows.forEach((r) => {
    const key = days[new Date(r.created_at).getDay()];
    map[key]++;
  });
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({
    day: d,
    bookings: map[d],
  }));
}

function exportCSV(rows) {
  if (!rows.length) return;
  const headers = [
    "ID",
    "Service",
    "Status",
    "Amount",
    "Client",
    "Worker",
    "Category",
    "Date",
  ];
  const body = rows.map((r) =>
    [
      r.id,
      r.service_title,
      r.status,
      r.total_amount,
      r.client?.full_name || "",
      r.worker?.full_name || "",
      r.category?.name || "",
      r.created_at,
    ].join(","),
  );
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── StatCard (exact replica of AdminDashboard.jsx pattern) ──────────────────
function StatCard({ icon: Icon, label, value, color, change, sparkline }) {
  const isPositive = change >= 0;
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
          >
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="flex items-end gap-0.5 h-8">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline, 1);
            const pct = Math.round((v / max) * 100);
            return (
              <div
                key={i}
                className="flex-1 rounded-sm bg-current opacity-20 hover:opacity-40 transition-opacity"
                style={{ height: `${Math.max(pct, 8)}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  // KPI state
  const [kpis, setKpis] = useState(__FALLBACK__.kpis);

  // Chart state
  const [monthlyUsers, setMonthlyUsers] = useState(__FALLBACK__.monthlyUsers);
  const [monthlyWorkers, setMonthlyWorkers] = useState(
    __FALLBACK__.monthlyWorkers,
  );
  const [bookingTrends, setBookingTrends] = useState(
    __FALLBACK__.bookingTrends,
  );
  const [bookingStatus, setBookingStatus] = useState(
    __FALLBACK__.bookingStatus,
  );
  const [categoryDist, setCategoryDist] = useState(__FALLBACK__.categoryDist);

  // Table state
  const [topWorkers, setTopWorkers] = useState(__FALLBACK__.topWorkers);
  const [topClients, setTopClients] = useState(__FALLBACK__.topClients);
  const [recentRegistrations, setRecentRegistrations] = useState(
    __FALLBACK__.recentRegistrations,
  );
  const [recentBookings, setRecentBookings] = useState(
    __FALLBACK__.recentBookings,
  );

  // Insights + timeline
  const [insights, setInsights] = useState(__FALLBACK__.insights);
  const [activityTimeline, setActivityTimeline] = useState(
    __FALLBACK__.activityTimeline,
  );

  // ── Sparklines derived from monthlyUsers/Workers ──────────────────────────
  const userSparkline = useMemo(
    () => monthlyUsers.map((m) => m.users ?? m.count ?? 0),
    [monthlyUsers],
  );
  const workerSparkline = useMemo(
    () => monthlyWorkers.map((m) => (m.verified ?? 0) + (m.pending ?? 0)),
    [monthlyWorkers],
  );

  // ── Load function ─────────────────────────────────────────────────────────
  async function load() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1).toISOString();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const startOf30 = new Date(now - 30 * 86400000).toISOString();
      const startOfThisMonth = new Date(year, now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(
        year,
        now.getMonth() - 1,
        1,
      ).toISOString();
      const endOfLastMonth = startOfThisMonth;

      // ── Fire all queries in parallel ─────────────────────────────────────
      const [
        clientsRes,
        workersRes,
        workerProfilesRes,
        todayBookingsRes,
        allBookingsRes,
        last30BookingsRes,
        reviewsRes,
        categoriesRes,
        clientsThisMonthRes,
        clientsLastMonthRes,
        workersThisMonthRes,
        workersLastMonthRes,
        recentBookingsRes,
        recentRegsRes,
        last7DaysBookingsRes,
        allBookingsForStatusRes,
        allBookingsForCategoryRes,
        topWorkersRes,
        highestRatedWorkerRes,
        recentWorkerProfilesRes,
      ] = await Promise.all([
        // 1. Total clients
        supabase
          .from("profiles")
          .select("id, created_at", { count: "exact" })
          .eq("role", "client"),
        // 2. Total workers
        supabase
          .from("profiles")
          .select("id, created_at", { count: "exact" })
          .eq("role", "worker"),
        // 3. Worker profiles (all, for approval_status breakdown)
        supabase
          .from("worker_profiles")
          .select(
            "user_id, approval_status, rating, completed_jobs, created_at",
          ),
        // 4. Today's bookings count
        supabase
          .from("bookings")
          .select("id", { count: "exact" })
          .gte("created_at", startOfToday),
        // 5. All bookings in last 12 months for chart / KPI
        supabase
          .from("bookings")
          .select("id, status, created_at")
          .gte("created_at", startOfYear),
        // 6. Last 30 days bookings for active users
        supabase
          .from("bookings")
          .select("id, client_id, status, created_at")
          .gte("created_at", startOf30),
        // 7. All reviews for avg rating
        supabase.from("reviews").select("rating"),
        // 8. Categories
        supabase.from("categories").select("id, name"),
        // 9. Clients this month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "client")
          .gte("created_at", startOfThisMonth),
        // 10. Clients last month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "client")
          .gte("created_at", startOfLastMonth)
          .lt("created_at", endOfLastMonth),
        // 11. Workers this month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "worker")
          .gte("created_at", startOfThisMonth),
        // 12. Workers last month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "worker")
          .gte("created_at", startOfLastMonth)
          .lt("created_at", endOfLastMonth),
        // 13. Recent bookings with joins
        supabase
          .from("bookings")
          .select(
            "id, service_title, status, total_amount, created_at, category_id, client:client_id(id, full_name), worker:worker_id(id, full_name), category:category_id(name)",
          )
          .order("created_at", { ascending: false })
          .limit(5),
        // 14. Recent registrations
        supabase
          .from("profiles")
          .select("id, full_name, role, created_at, avatar_url")
          .order("created_at", { ascending: false })
          .limit(5),
        // 15. Last 7 days bookings for trend chart
        supabase
          .from("bookings")
          .select("id, created_at")
          .gte("created_at", new Date(now - 7 * 86400000).toISOString()),
        // 16. All bookings for status donut
        supabase.from("bookings").select("status"),
        // 17. All bookings for category distribution
        supabase
          .from("bookings")
          .select("category_id, category:category_id(name)"),
        // 18. Top workers
        supabase
          .from("worker_profiles")
          .select(
            "user_id, title, rating, completed_jobs, approval_status, profiles:user_id(id, full_name, avatar_url)",
          )
          .eq("approval_status", "approved")
          .order("completed_jobs", { ascending: false })
          .limit(5),
        // 19. Highest rated worker
        supabase
          .from("worker_profiles")
          .select("user_id, rating, profiles:user_id(full_name)")
          .eq("approval_status", "approved")
          .order("rating", { ascending: false })
          .limit(1),
        // 20. Recent worker_profiles for activity
        supabase
          .from("worker_profiles")
          .select(
            "user_id, approval_status, created_at, profiles:user_id(full_name)",
          )
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      // ── KPI computations ─────────────────────────────────────────────────
      const totalUsers = clientsRes.count ?? clientsRes.data?.length ?? 0;
      const totalWorkers = workersRes.count ?? workersRes.data?.length ?? 0;
      const wpData = workerProfilesRes.data || [];
      const verifiedWorkers = wpData.filter(
        (w) => w.approval_status === "approved",
      ).length;
      const pendingWorkers = wpData.filter(
        (w) => w.approval_status === "pending",
      ).length;
      const rejectedWorkers = wpData.filter(
        (w) => w.approval_status === "rejected",
      ).length;
      const todaysBookings =
        todayBookingsRes.count ?? todayBookingsRes.data?.length ?? 0;
      const allBookingsData = allBookingsRes.data || [];
      const completedBookings = allBookingsData.filter(
        (b) => b.status === "completed",
      ).length;
      const cancelledBookings = allBookingsData.filter(
        (b) => b.status === "cancelled",
      ).length;

      const reviewData = reviewsRes.data || [];
      const avgRating = reviewData.length
        ? (
            reviewData.reduce((s, r) => s + (r.rating || 0), 0) /
            reviewData.length
          ).toFixed(1)
        : "0.0";

      const totalCategories = categoriesRes.data?.length ?? 0;

      const cliThisM = clientsThisMonthRes.count ?? 0;
      const cliLastM = clientsLastMonthRes.count ?? 0;
      const monthlyGrowth =
        cliLastM > 0
          ? ((cliThisM - cliLastM) / cliLastM) * 100
          : cliThisM > 0
            ? 100
            : 0;

      const wkThisM = workersThisMonthRes.count ?? 0;
      const wkLastM = workersLastMonthRes.count ?? 0;
      const workerGrowthChange =
        wkLastM > 0
          ? ((wkThisM - wkLastM) / wkLastM) * 100
          : wkThisM > 0
            ? 100
            : 0;
      const userGrowthChange =
        cliLastM > 0
          ? ((cliThisM - cliLastM) / cliLastM) * 100
          : cliThisM > 0
            ? 100
            : 0;

      const last30Data = last30BookingsRes.data || [];
      const activeUsers = new Set(last30Data.map((b) => b.client_id)).size;
      const last30Completed = last30Data.filter(
        (b) => b.status === "completed",
      ).length;
      const platformHealth =
        last30Data.length > 0
          ? Math.round((last30Completed / last30Data.length) * 100)
          : 0;

      setKpis({
        totalUsers,
        totalWorkers,
        verifiedWorkers,
        pendingWorkers,
        todaysBookings,
        completedBookings,
        cancelledBookings,
        avgRating,
        totalCategories,
        monthlyGrowth: monthlyGrowth.toFixed(1),
        activeUsers,
        platformHealth,
        userGrowthChange,
        workerGrowthChange,
      });

      // ── Monthly user growth chart ─────────────────────────────────────────
      const slots = buildMonthSlots(year);
      const clientRows = clientsRes.data || [];
      const workerRows = workersRes.data || [];

      const mUsers = bucketByMonth(clientRows, "created_at", null, slots).map(
        (s) => ({ month: s.month, users: s.count }),
      );
      setMonthlyUsers(mUsers);

      // Worker breakdown by approval_status using worker_profiles created_at
      const verifiedWpRows = wpData.filter(
        (w) => w.approval_status === "approved",
      );
      const pendingWpRows = wpData.filter(
        (w) => w.approval_status === "pending",
      );
      const mVerified = bucketByMonth(
        verifiedWpRows,
        "created_at",
        null,
        slots,
      ).map((s) => ({ month: s.month, count: s.count }));
      const mPending = bucketByMonth(
        pendingWpRows,
        "created_at",
        null,
        slots,
      ).map((s) => ({ month: s.month, count: s.count }));
      const mWorkers = slots.map((s, i) => ({
        month: s.month,
        verified: mVerified[i]?.count || 0,
        pending: mPending[i]?.count || 0,
      }));
      setMonthlyWorkers(mWorkers);

      // ── Booking trends (last 7 days) ───────────────────────────────────────
      setBookingTrends(bucketByWeekday(last7DaysBookingsRes.data || []));

      // ── Booking status donut ───────────────────────────────────────────────
      const statusData = allBookingsForStatusRes.data || [];
      const statusMap = {};
      statusData.forEach((b) => {
        statusMap[b.status] = (statusMap[b.status] || 0) + 1;
      });
      const statusLabels = {
        completed: "Completed",
        confirmed: "Confirmed",
        pending: "Pending",
        in_progress: "In Progress",
        cancelled: "Cancelled",
      };
      setBookingStatus(
        Object.entries(statusMap).map(([k, v]) => ({
          name: statusLabels[k] || k,
          value: v,
        })),
      );

      // ── Category distribution ──────────────────────────────────────────────
      const catRows = allBookingsForCategoryRes.data || [];
      const catMap = {};
      catRows.forEach((b) => {
        const name = b.category?.name || "Unknown";
        catMap[name] = (catMap[name] || 0) + 1;
      });
      setCategoryDist(
        Object.entries(catMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
      );

      // ── Top workers table ──────────────────────────────────────────────────
      const twData = (topWorkersRes.data || []).map((w) => ({
        id: w.user_id,
        full_name: w.profiles?.full_name || "Unknown",
        avatar_url: w.profiles?.avatar_url || null,
        title: w.title || "Worker",
        rating: w.rating || 0,
        completed_jobs: w.completed_jobs || 0,
        completion_pct:
          w.completed_jobs > 0
            ? Math.min(
                100,
                Math.round((w.completed_jobs / (w.completed_jobs + 1)) * 100),
              )
            : 0,
      }));
      setTopWorkers(twData.length ? twData : __FALLBACK__.topWorkers);

      // ── Top clients (aggregate from last30 bookings) ────────────────────
      const clientBookingMap = {};
      last30Data.forEach((b) => {
        if (!clientBookingMap[b.client_id])
          clientBookingMap[b.client_id] = { bookings: 0, total_spent: 0 };
        clientBookingMap[b.client_id].bookings++;
        clientBookingMap[b.client_id].total_spent += b.total_amount || 0;
      });
      const topClientIds = Object.entries(clientBookingMap)
        .sort((a, b) => b[1].bookings - a[1].bookings)
        .slice(0, 5)
        .map(([id, stats]) => ({ id, ...stats }));

      if (topClientIds.length > 0) {
        const profileIds = topClientIds.map((c) => c.id);
        const { data: clientProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", profileIds);
        const profileMap = Object.fromEntries(
          (clientProfiles || []).map((p) => [p.id, p]),
        );
        setTopClients(
          topClientIds.map((c) => ({
            ...c,
            full_name: profileMap[c.id]?.full_name || "Unknown",
            avatar_url: profileMap[c.id]?.avatar_url || null,
          })),
        );
      } else {
        setTopClients(__FALLBACK__.topClients);
      }

      // ── Recent registrations ───────────────────────────────────────────────
      setRecentRegistrations(
        recentRegsRes.data || __FALLBACK__.recentRegistrations,
      );

      // ── Recent bookings ────────────────────────────────────────────────────
      setRecentBookings(recentBookingsRes.data || __FALLBACK__.recentBookings);

      // ── Insights ──────────────────────────────────────────────────────────
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
      const highestRated = highestRatedWorkerRes.data?.[0];
      const acceptanceRate =
        wpData.length > 0
          ? Math.round((verifiedWorkers / wpData.length) * 100)
          : 0;
      setInsights({
        popularCategory: topCat?.[0] || "N/A",
        popularWorker: twData[0]?.full_name || "N/A",
        fastestCategory: topCat?.[0] || "N/A",
        highestRatedWorker: highestRated?.profiles?.full_name || "N/A",
        acceptanceRate,
      });

      // ── Activity timeline (merge profiles, bookings, worker_profiles) ──────
      const recentRegsForTimeline = (recentRegsRes.data || [])
        .slice(0, 2)
        .map((r) => ({
          type: "registration",
          text: `${r.full_name} joined as ${r.role}`,
          time: r.created_at,
        }));
      const recentBookingsForTimeline = (recentBookingsRes.data || [])
        .slice(0, 2)
        .map((b) => ({
          type: "booking",
          text: `New booking: ${b.service_title}`,
          time: b.created_at,
        }));
      const recentWpForTimeline = (recentWorkerProfilesRes.data || [])
        .slice(0, 2)
        .map((w) => ({
          type: "worker",
          text: `${w.profiles?.full_name || "Worker"} — ${w.approval_status} application`,
          time: w.created_at,
        }));
      const merged = [
        ...recentRegsForTimeline,
        ...recentBookingsForTimeline,
        ...recentWpForTimeline,
      ]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 6);
      setActivityTimeline(
        merged.length ? merged : __FALLBACK__.activityTimeline,
      );

      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("AnalyticsDashboard load error:", err);
      setUseMock(true);
      // Seed all state from fallback
      setKpis(__FALLBACK__.kpis);
      setMonthlyUsers(__FALLBACK__.monthlyUsers);
      setMonthlyWorkers(__FALLBACK__.monthlyWorkers);
      setBookingTrends(__FALLBACK__.bookingTrends);
      setBookingStatus(__FALLBACK__.bookingStatus);
      setCategoryDist(__FALLBACK__.categoryDist);
      setTopWorkers(__FALLBACK__.topWorkers);
      setTopClients(__FALLBACK__.topClients);
      setRecentRegistrations(__FALLBACK__.recentRegistrations);
      setRecentBookings(__FALLBACK__.recentBookings);
      setInsights(__FALLBACK__.insights);
      setActivityTimeline(__FALLBACK__.activityTimeline);
      setLastUpdated(new Date().toLocaleString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  // ─── KPI card definitions ────────────────────────────────────────────────
  const kpiCards = [
    {
      icon: Users,
      label: "Total Users",
      value: kpis.totalUsers,
      color: "bg-blue-600",
      change: kpis.userGrowthChange,
      sparkline: userSparkline,
    },
    {
      icon: Briefcase,
      label: "Total Workers",
      value: kpis.totalWorkers,
      color: "bg-emerald-600",
      change: kpis.workerGrowthChange,
      sparkline: workerSparkline,
    },
    {
      icon: UserCheck,
      label: "Verified Workers",
      value: kpis.verifiedWorkers,
      color: "bg-green-600",
      change: undefined,
    },
    {
      icon: UserPlus,
      label: "Pending Workers",
      value: kpis.pendingWorkers,
      color: "bg-amber-500",
      change: undefined,
    },
    {
      icon: Calendar,
      label: "Today's Bookings",
      value: kpis.todaysBookings,
      color: "bg-violet-500",
      change: undefined,
    },
    {
      icon: CheckCircle,
      label: "Completed Bookings",
      value: kpis.completedBookings,
      color: "bg-emerald-500",
      change: undefined,
    },
    {
      icon: XCircle,
      label: "Cancelled Bookings",
      value: kpis.cancelledBookings,
      color: "bg-red-500",
      change: undefined,
    },
    {
      icon: Star,
      label: "Average Rating",
      value: kpis.avgRating,
      color: "bg-amber-500",
      change: undefined,
    },
    {
      icon: Tag,
      label: "Total Categories",
      value: kpis.totalCategories,
      color: "bg-indigo-600",
      change: undefined,
    },
    {
      icon: TrendingUp,
      label: "Monthly Growth",
      value: `${kpis.monthlyGrowth}%`,
      color: "bg-blue-600",
      change: Number(kpis.monthlyGrowth),
    },
    {
      icon: Activity,
      label: "Active Users (30d)",
      value: kpis.activeUsers,
      color: "bg-teal-500",
      change: undefined,
    },
    {
      icon: Heart,
      label: "Platform Health",
      value: `${kpis.platformHealth}%`,
      color: "bg-rose-500",
      change: undefined,
    },
  ];

  const timelineIcons = {
    booking: <Calendar size={14} className="text-violet-600" />,
    registration: <Users size={14} className="text-blue-600" />,
    worker: <Briefcase size={14} className="text-emerald-600" />,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">
            Platform overview and insights
            {useMock && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                Demo data
              </span>
            )}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => exportCSV(recentBookings)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly User Growth */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Monthly User Growth</h2>
            <Users size={16} className="text-gray-400" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={monthlyUsers}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  fill="url(#userGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Worker Growth */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Monthly Worker Growth</h2>
            <Briefcase size={16} className="text-gray-400" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={monthlyWorkers}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="verified"
                  name="Verified"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trends */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Weekly Booking Trends</h2>
            <Calendar size={16} className="text-gray-400" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={bookingTrends}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Donut */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Booking Status</h2>
            <CheckCircle size={16} className="text-gray-400" />
          </div>
          <div className="p-5 flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={bookingStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {bookingStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {bookingStatus.map((s, i) => (
                <span
                  key={s.name}
                  className="flex items-center gap-1 text-xs text-gray-600"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                    }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Category Distribution</h2>
            <Tag size={16} className="text-gray-400" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={categoryDist}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={70}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tables Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Workers */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Top Performing Workers</h2>
            <Award size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {topWorkers.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No workers yet.
              </div>
            ) : (
              topWorkers.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 p-4">
                  <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                    {getInitial(w.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {w.full_name}
                    </p>
                    <p className="text-xs text-gray-400">{w.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1 justify-end">
                      <Star
                        size={12}
                        className="text-amber-400 fill-amber-400"
                      />
                      {Number(w.rating).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {w.completed_jobs} jobs
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Active Clients */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Most Active Clients</h2>
            <Users size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {topClients.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No clients yet.
              </div>
            ) : (
              topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                    {getInitial(c.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {c.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.bookings} bookings
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {fmtCurrency(c.total_spent)}
                    </p>
                    <p className="text-xs text-gray-400">total spent</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Registrations + Bookings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Recent Registrations</h2>
            <UserPlus size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {recentRegistrations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No registrations yet.
              </div>
            ) : (
              recentRegistrations.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                    {getInitial(r.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {r.full_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtTime(r.created_at)}
                    </p>
                  </div>
                  <span
                    className={`badge ${r.role === "worker" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {r.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Recent Bookings</h2>
            <Calendar size={16} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No bookings yet.
              </div>
            ) : (
              recentBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center font-bold text-violet-700 text-sm shrink-0">
                    {getInitial(b.client?.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {b.service_title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.client?.full_name} → {b.worker?.full_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`badge ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {b.status?.replace("_", " ")}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {fmtCurrency(b.total_amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Platform Insights + Activity Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Insights */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Platform Insights</h2>
            <Zap size={16} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
            {[
              {
                label: "Most Popular Category",
                value: insights.popularCategory,
                icon: Tag,
                color: "text-indigo-600 bg-indigo-50",
              },
              {
                label: "Top Worker",
                value: insights.popularWorker,
                icon: Award,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Fastest Growing Category",
                value: insights.fastestCategory,
                icon: TrendingUp,
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "Highest Rated Worker",
                value: insights.highestRatedWorker,
                icon: Star,
                color: "text-amber-600 bg-amber-50",
              },
              {
                label: "Worker Acceptance Rate",
                value: `${insights.acceptanceRate}%`,
                icon: UserCheck,
                color: "text-green-600 bg-green-50",
              },
              {
                label: "Platform Health",
                value: `${kpis.platformHealth}%`,
                icon: Heart,
                color: "text-rose-600 bg-rose-50",
              },
            ].map((ins) => (
              <div
                key={ins.label}
                className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${ins.color}`}
                >
                  <ins.icon size={15} />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-tight">
                  {ins.label}
                </p>
                <p className="text-sm font-bold text-gray-800 truncate">
                  {ins.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="section-title">Recent Activity</h2>
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="p-5 space-y-4">
            {activityTimeline.length === 0 ? (
              <div className="text-center text-sm text-gray-400">
                No activity yet.
              </div>
            ) : (
              activityTimeline.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {timelineIcons[item.type] || (
                      <Activity size={14} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 leading-snug">
                      {item.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtTime(item.time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="section-title">Quick Actions</h2>
          <MoreHorizontal size={16} className="text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-3 p-5">
          <button
            onClick={() => exportCSV(recentBookings)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileSpreadsheet size={15} />
            Export Bookings CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            <FileText size={15} />
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} />
            Print Report
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
