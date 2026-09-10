import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Star,
  LayoutDashboard,
  ListFilter,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  UploadCloud,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Route, Switch, useLocation, useParams } from "wouter";
import {
  getGetComplaintQueryKey,
  getListComplaintsQueryKey,
  useAnalyzeIssue,
  useCreateComplaint,
  useCreateFeedback,
  useGetComplaint,
  useGetCurrentUser,
  useGetDashboardSummary,
  useListComplaints,
  useListDepartments,
  useListNotifications,
  useLogin,
  useMarkNotificationRead,
  useRegister,
  useUpdateComplaint,
} from "@workspace/api-client-react";
import type {
  AiAnalysis,
  Complaint,
  ComplaintInput,
  DashboardSummary,
  Department,
  Notification,
  User,
} from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Chart } from "chart.js/auto";
import L from "leaflet";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import "./index.css";
import "leaflet/dist/leaflet.css";

const queryClient = new QueryClient();

const demoComplaints: Complaint[] = [
  { id: "NX-2048", title: "Broken pedestrian signal at 5th & Pine", description: "The crossing signal stays red in both directions during peak hours.", category: "Traffic", priority: "High", status: "In Progress", location: "5th Ave & Pine St", latitude: 47.608, longitude: -122.335, reporterName: "Maya Chen", reporterId: "demo", department: "Transportation", assignedTo: "Luis Ortega", confidence: 0.96, imageUrl: null, resolutionNotes: null, resolutionPhoto: null, rating: null, createdAt: "2025-05-18T08:30:00Z", updatedAt: "2025-05-20T14:10:00Z", timeline: [{ status: "Submitted", label: "Report received", timestamp: "2025-05-18T08:30:00Z", note: "AI triage complete" }, { status: "Verified", label: "Verified by city", timestamp: "2025-05-18T10:12:00Z" }, { status: "In Progress", label: "Crew dispatched", timestamp: "2025-05-20T14:10:00Z", note: "Signal technician assigned" }] },
  { id: "NX-2047", title: "Overflowing recycling station", description: "Bins near the north entrance have been full since Friday.", category: "Waste", priority: "Medium", status: "Assigned", location: "Harborview Park", latitude: 47.603, longitude: -122.341, reporterName: "Noah Williams", reporterId: "demo", department: "Public Works", assignedTo: "Aisha Patel", confidence: 0.91, imageUrl: null, resolutionNotes: null, resolutionPhoto: null, rating: null, createdAt: "2025-05-17T15:40:00Z", updatedAt: "2025-05-19T09:30:00Z", timeline: [{ status: "Submitted", label: "Report received", timestamp: "2025-05-17T15:40:00Z" }, { status: "Assigned", label: "Assigned to Public Works", timestamp: "2025-05-19T09:30:00Z" }] },
  { id: "NX-2046", title: "Pothole cluster on Alder Street", description: "Several deep potholes are affecting both lanes near the school.", category: "Roads", priority: "Critical", status: "Resolved", location: "Alder St near 14th", latitude: 47.615, longitude: -122.329, reporterName: "Jon Bell", reporterId: "demo", department: "Transportation", assignedTo: "Luis Ortega", confidence: 0.99, imageUrl: null, resolutionNotes: "Surface repaired and lane markings refreshed.", resolutionPhoto: null, rating: 5, createdAt: "2025-05-11T11:20:00Z", updatedAt: "2025-05-16T16:45:00Z", timeline: [{ status: "Submitted", label: "Report received", timestamp: "2025-05-11T11:20:00Z" }, { status: "Resolved", label: "Issue resolved", timestamp: "2025-05-16T16:45:00Z", note: "Surface repaired" }] },
  { id: "NX-2045", title: "Streetlight out near Union Station", description: "One of the main lights is out, leaving the sidewalk very dark.", category: "Lighting", priority: "Medium", status: "Verified", location: "Union Station, south entrance", latitude: 47.61, longitude: -122.337, reporterName: "Rina Shah", reporterId: "demo", department: "Public Works", assignedTo: null, confidence: 0.94, imageUrl: null, resolutionNotes: null, resolutionPhoto: null, rating: null, createdAt: "2025-05-15T19:00:00Z", updatedAt: "2025-05-16T08:45:00Z", timeline: [{ status: "Submitted", label: "Report received", timestamp: "2025-05-15T19:00:00Z" }, { status: "Verified", label: "Verified by city", timestamp: "2025-05-16T08:45:00Z" }] },
];

const demoDepartments: Department[] = [
  { id: "transport", name: "Transportation", color: "#27d3cf" },
  { id: "works", name: "Public Works", color: "#f1b95b" },
  { id: "parks", name: "Parks & Recreation", color: "#7cd6a4" },
  { id: "safety", name: "Public Safety", color: "#ed7d73" },
];

const demoNotifications: Notification[] = [
  { id: "n1", title: "Your report is now in progress", message: "A crew has been assigned to the pedestrian signal issue at 5th & Pine.", type: "status", createdAt: "2025-05-20T14:10:00Z", read: false },
  { id: "n2", title: "Issue verified", message: "The city verified your streetlight report and routed it to Public Works.", type: "success", createdAt: "2025-05-16T08:45:00Z", read: false },
  { id: "n3", title: "Welcome to NEXORA", message: "Your civic workspace is ready. See something that needs attention?", type: "info", createdAt: "2025-05-12T09:00:00Z", read: true },
];

const demoSummary: DashboardSummary = {
  total: 12, pending: 3, inProgress: 4, resolved: 5, highPriority: 2, avgResolutionHours: 42.6,
  byCategory: [{ category: "Roads", count: 4 }, { category: "Lighting", count: 3 }, { category: "Waste", count: 2 }, { category: "Traffic", count: 2 }, { category: "Parks", count: 1 }],
  weeklyVolume: [{ day: "Mon", count: 4 }, { day: "Tue", count: 7 }, { day: "Wed", count: 5 }, { day: "Thu", count: 8 }, { day: "Fri", count: 6 }, { day: "Sat", count: 3 }, { day: "Sun", count: 2 }],
  recentActivity: [{ id: "a1", title: "Pothole cluster resolved", status: "Resolved", time: "4h ago" }, { id: "a2", title: "Crew assigned to signal report", status: "In Progress", time: "Yesterday" }, { id: "a3", title: "New streetlight report", status: "Verified", time: "2d ago" }],
};

const fallbackUser: User = { id: "citizen-demo", name: "Maya Chen", email: "maya.chen@example.com", role: "citizen", avatar: null, department: null };

function useDemoData<T>(data: T | undefined, fallback: T) {
  return data ?? fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function timeAgo(value: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function confidencePercent(value: number) {
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={cx("brand-mark", compact && "brand-mark-compact")} data-testid="link-brand">
    <span className="brand-orbit"><span /></span><span className="brand-word">NEXORA</span>{!compact && <span className="brand-ai">AI</span>}
  </Link>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase().replaceAll(" ", "-");
  return <span className={cx("status-badge", `status-${cls}`)} data-testid={`status-${cls}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  return <span className={cx("priority-badge", `priority-${priority.toLowerCase()}`)} data-testid={`priority-${priority.toLowerCase()}`}><span />{priority}</span>;
}

function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><ClipboardList size={22} /></div><h3>{title}</h3><p>{copy}</p>{action}</div>;
}

function LoadingRows() {
  return <div className="loading-stack"><div /><div /><div /><div /></div>;
}

function Topbar({ user, onMenu }: { user: User; onMenu: () => void }) {
  const [, setLocation] = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("nexora-theme") === "dark");
  const notifications = useListNotifications();
  const unread = (notifications.data ?? demoNotifications).filter((n) => !n.read).length;
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("nexora-theme", dark ? "dark" : "light"); }, [dark]);
  return <header className="topbar">
    <button className="icon-btn mobile-menu" onClick={onMenu} aria-label="Open menu" data-testid="button-open-menu"><Menu size={20} /></button>
    <div className="crumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{location.pathname === "/dashboard" ? "Overview" : "Civic operations"}</strong></div>
    <div className="top-actions">
      <button className="icon-btn" onClick={() => setDark((v) => !v)} aria-label="Toggle theme" data-testid="button-toggle-theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      <button className="icon-btn notification-button" onClick={() => setLocation("/notifications")} aria-label="Notifications" data-testid="button-notifications"><Bell size={18} />{unread > 0 && <i>{unread}</i>}</button>
      <button className="profile-chip" onClick={() => setLocation("/profile")} data-testid="button-profile"><span className="avatar">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span><span className="profile-chip-copy"><b>{user.name}</b><small>{user.role === "citizen" ? "Resident" : user.role}</small></span><ChevronRight size={15} /></button>
    </div>
  </header>;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/report", label: "Report an issue", icon: Plus, accent: true },
  { href: "/complaints", label: "My complaints", icon: ClipboardList },
  { href: "/map", label: "Issue map", icon: Target },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function Sidebar({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const [location] = useLocation();
  return <><div className={cx("sidebar-backdrop", open && "is-open")} onClick={onClose} /><aside className={cx("sidebar", open && "is-open")}>
    <div className="sidebar-top"><Logo /><button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button></div>
    <div className="workspace-pill"><span className="pulse-dot" /><span><small>Live workspace</small><b>Seattle civic network</b></span><MoreHorizontal size={16} /></div>
    <nav className="side-nav" aria-label="Primary navigation">
      <span className="nav-kicker">CITIZEN TOOLS</span>
      {navItems.map(({ href, label, icon: Icon, accent }) => <Link key={href} href={href} onClick={onClose} className={cx("side-link", location === href && "active", accent && "side-link-accent")} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}><Icon size={18} /><span>{label}</span>{href === "/notifications" && <em>2</em>}</Link>)}
      {(user.role === "admin" || user.role === "staff") && <><span className="nav-kicker nav-kicker-spaced">OPERATIONS</span><Link href="/staff" onClick={onClose} className={cx("side-link", location === "/staff" && "active")} data-testid="link-nav-staff"><Users size={18} /><span>Assigned queue</span><em className="queue-count">4</em></Link></>}
      {user.role === "admin" && <Link href="/admin" onClick={onClose} className={cx("side-link", location === "/admin" && "active")} data-testid="link-nav-admin"><BarChart3 size={18} /><span>Admin console</span></Link>}
    </nav>
    <div className="sidebar-bottom"><div className="civic-note"><ShieldCheck size={17} /><span><b>Trusted by your city</b><small>Protected civic data</small></span></div><button className="side-link side-signout" onClick={() => { localStorage.removeItem("nexora-token"); window.location.href = "/"; }} data-testid="button-signout"><LockKeyhole size={17} /><span>Sign out</span></button></div>
  </aside></>;
}

function AppShell({ children }: { children: ReactNode }) {
  const userQuery = useGetCurrentUser();
  const user = useDemoData(userQuery.data, fallbackUser);
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} /><main className="main-shell"><Topbar user={user} onMenu={() => setMenuOpen(true)} /><div className="page-wrap">{children}</div></main></div>;
}

function PublicNav() {
  return <header className="public-nav"><Logo /><nav><a href="#how-it-works">How it works</a><a href="#features">Capabilities</a><a href="#live-issues">Live issues</a></nav><div className="public-actions"><Link href="/login" className="text-link" data-testid="link-login">Sign in</Link><Link href="/register" className="button button-primary button-small" data-testid="link-register">Create account <ArrowRight size={15} /></Link></div></header>;
}

function Landing() {
  const complaintsQuery = useListComplaints({}, { query: { enabled: Boolean(localStorage.getItem("nexora-token")), queryKey: getListComplaintsQueryKey({}) } });
  const complaints = useDemoData(complaintsQuery.data, demoComplaints);
  return <div className="landing">
    <PublicNav />
    <section className="hero-section">
      <div className="hero-grid" />
       <div className="hero-copy reveal"><div className="eyebrow"><span className="eyebrow-dot" /> The civic operating system</div><h1>Spot it.<br /><span>Report it. Resolve it.</span></h1><p>NEXORA turns everyday observations into visible action. Report what matters, follow the progress, and help your city move forward.</p><div className="hero-actions"><Link href="/report" className="button button-primary" data-testid="link-hero-report">Report an issue <ArrowRight size={17} /></Link><a href="#how-it-works" className="button button-ghost" data-testid="link-hero-learn">See how it works <ChevronRight size={17} /></a></div><div className="hero-trust"><div className="mini-avatars"><span>MC</span><span>JR</span><span>AS</span><span>+</span></div><span><b>18,420</b> residents are improving their neighborhoods</span></div></div>
      <div className="hero-visual reveal reveal-delay"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-core"><div className="core-scan" /><Sparkles size={30} /><span>AI TRIAGE</span><b>Every report,<br />one clear next step.</b></div><div className="float-card float-card-top"><span className="float-icon cyan"><CheckCircle2 size={15} /></span><span><small>Resolved today</small><b>47 community issues</b></span></div><div className="float-card float-card-bottom"><span className="float-icon amber"><Activity size={15} /></span><span><small>Network pulse</small><b>Active across 12 districts</b></span></div></div>
    </section>
    <section className="stats-strip"><div><b>18,420</b><span>issues surfaced</span></div><div><b>91<span className="teal">%</span></b><span>resolved or in motion</span></div><div><b>42.6<span className="unit">h</span></b><span>average resolution</span></div><div><b>12</b><span>districts connected</span></div></section>
    <section className="story-section" id="how-it-works"><div className="section-heading"><div><span className="eyebrow">FROM SIGNAL TO SOLUTION</span><h2>Built for the moments<br />that shape a neighborhood.</h2></div><p>Less chasing. More clarity. NEXORA gives every person in the system the context they need to act with confidence.</p></div><div className="steps-grid"><div className="step-card"><span className="step-index">01</span><LocateFixed size={23} /><h3>Spot something.<br />Say something.</h3><p>Capture the issue in seconds. Add a photo, pin the location, and let AI structure the details.</p><span className="step-line" /></div><div className="step-card featured"><span className="step-index">02</span><Sparkles size={23} /><h3>AI finds the<br />right path.</h3><p>Every report is classified, prioritized, and routed to the department best equipped to respond.</p><span className="step-line" /></div><div className="step-card"><span className="step-index">03</span><TrendingUp size={23} /><h3>See progress.<br />Feel the change.</h3><p>Follow a living timeline from submission to resolution. Your voice stays visible all the way through.</p><span className="step-line" /></div></div></section>
    <section className="feature-section" id="features"><div className="feature-intro"><span className="eyebrow">ONE SHARED VIEW</span><h2>The signal layer<br /><span>for your city.</span></h2><p>Designed for residents, staff, and the people who keep the whole system moving.</p><Link href="/register" className="button button-dark" data-testid="link-feature-start">Open your workspace <ArrowRight size={16} /></Link></div><div className="feature-panels"><div className="feature-panel panel-wide"><div><span className="panel-tag">FOR RESIDENTS</span><h3>Your report never disappears into a queue.</h3><p>One place to report, track, and close the loop on the issues around you.</p></div><div className="panel-window"><div className="window-top"><span /><span /><span /></div><div className="window-row"><span className="tiny-icon"><MapPin size={14} /></span><span><b>Streetlight out near Union Station</b><small>Verified · Public Works</small></span><StatusBadge status="Verified" /></div><div className="window-row muted-row"><span className="tiny-icon soft"><Clock3 size={14} /></span><span><b>Crosswalk timing at 5th & Pine</b><small>In progress · Transportation</small></span><StatusBadge status="In Progress" /></div></div></div><div className="feature-panel panel-ai"><div className="ai-ring"><Sparkles size={19} /></div><span className="panel-tag">INTELLIGENT TRIAGE</span><h3>From messy detail to a clear action.</h3><p>Context-aware analysis gives every issue a confident starting point.</p><div className="confidence-row"><span>AI confidence</span><b>96.4%</b></div><div className="confidence-bar"><i /></div></div></div></section>
    <section className="demo-section"><div className="demo-copy"><span className="eyebrow">SEE THE INTELLIGENCE</span><h2>Describe it<br /><span>naturally.</span></h2><p>No forms to decode. Just tell NEXORA what you see and watch it build a better report.</p></div><div className="demo-console"><div className="console-header"><span className="live-dot" /> AI analysis preview <span className="console-id">NX / 0428</span></div><div className="console-input"><span>I noticed a large pothole outside the school on Alder Street. It's forcing bikes into traffic.</span><button className="send-btn" data-testid="button-demo-analyze"><Sparkles size={16} /></button></div><div className="analysis-output"><div className="analysis-label"><CheckCircle2 size={15} /> ANALYSIS COMPLETE <span>0.8s</span></div><div className="analysis-grid"><div><small>CATEGORY</small><b>Roads & surfaces</b></div><div><small>PRIORITY</small><PriorityBadge priority="Critical" /></div><div><small>ROUTE TO</small><b>Transportation</b></div><div><small>CONFIDENCE</small><b className="cyan-text">98.8%</b></div></div><div className="analysis-summary"><Sparkles size={15} /><span>Likely safety hazard. Recommend inspection within 24 hours.</span></div></div></div></section>
    <section className="live-section" id="live-issues"><div className="section-heading"><div><span className="eyebrow">LIVE ACROSS THE NETWORK</span><h2>Small signals.<br />Visible momentum.</h2></div><Link href="/map" className="button button-ghost" data-testid="link-live-map">Open live map <ArrowRight size={16} /></Link></div><div className="live-layout"><div className="live-list">{complaints.slice(0, 3).map((item) => <Link href={`/complaints/${item.id}`} className="live-issue" key={item.id} data-testid={`link-live-issue-${item.id}`}><span className="issue-marker"><MapPin size={16} /></span><span className="issue-copy"><b>{item.title}</b><small>{item.location} · {timeAgo(item.updatedAt)}</small></span><StatusBadge status={item.status} /><ChevronRight size={16} /></Link>)}</div><div className="live-map"><div className="map-grid" /><span className="map-road road-a" /><span className="map-road road-b" /><span className="map-road road-c" /><span className="map-pin pin-a" /><span className="map-pin pin-b" /><span className="map-pin pin-c" /><span className="map-label">CITY SIGNAL / 12 DISTRICTS</span></div></div></section>
    <section className="cta-section"><div className="cta-glow" /><span className="eyebrow">YOUR CITY IS A SHARED PROJECT</span><h2>Start with what<br /><span>you notice.</span></h2><p>Join thousands of residents making the places around them more responsive.</p><Link href="/register" className="button button-primary" data-testid="link-cta-register">Create your free account <ArrowRight size={17} /></Link></section>
    <footer className="public-footer"><Logo /><span>© 2025 NEXORA AI</span><div><a href="#features">Privacy</a><a href="#features">Accessibility</a><a href="#features">City network</a></div></footer>
  </div>;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const register = useRegister();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submitting = login.isPending || register.isPending;
  const submit = (e: FormEvent) => {
    e.preventDefault(); setError("");
    const onSuccess = (result: { token: string }) => { localStorage.setItem("nexora-token", result.token); setLocation("/dashboard"); };
    if (mode === "login") login.mutate({ data: { email: form.email, password: form.password } }, { onSuccess, onError: () => setError("We could not sign you in. Check your details and try again.") });
    else register.mutate({ data: { name: form.name, email: form.email, password: form.password } }, { onSuccess, onError: () => setError("That account could not be created. Try a different email.") });
  };
  return <div className="auth-page"><div className="auth-art"><div className="auth-art-glow" /><Logo /><div className="auth-art-copy"><span className="eyebrow">THE CIVIC OPERATING SYSTEM</span><h1>Better signals.<br /><span>Better cities.</span></h1><p>One trusted place for the people who notice, the teams who respond, and the communities that benefit.</p><div className="auth-art-stat"><b>91%</b><span>of reported issues are<br />resolved or in motion</span></div></div><div className="auth-art-footer">NEXORA / SECURE CIVIC NETWORK</div></div><div className="auth-form-side"><div className="auth-mobile-logo"><Logo /></div><div className="auth-form-wrap"><Link href="/" className="back-link" data-testid="link-auth-back"><ChevronRight size={15} className="rotate-180" /> Back to home</Link><span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE NETWORK"}</span><h2>{mode === "login" ? "Sign in to your workspace." : "Create your civic account."}</h2><p className="auth-lede">{mode === "login" ? "Pick up where you left off." : "Your neighborhood has a signal. Make it visible."}</p><form onSubmit={submit} className="auth-form">{mode === "register" && <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Maya Chen" required data-testid="input-name" /></label>}<label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required data-testid="input-email" /></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" minLength={6} required data-testid="input-password" /></label>{error && <div className="form-error"><AlertTriangle size={15} /> {error}</div>}<button className="button button-primary button-full" type="submit" disabled={submitting} data-testid={`button-submit-${mode}`}>{submitting ? "Connecting..." : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16} /></button></form><div className="auth-switch">{mode === "login" ? <>New to NEXORA? <Link href="/register" data-testid="link-auth-register">Create an account</Link></> : <>Already have an account? <Link href="/login" data-testid="link-auth-login">Sign in</Link></>}</div><div className="secure-note"><ShieldCheck size={15} /> Your information is protected by civic-grade security.</div></div></div></div>;
}

function PageHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>;
}

function StatCard({ label, value, icon: Icon, tone, note }: { label: string; value: string | number; icon: typeof Activity; tone?: string; note?: string }) {
  return <div className={cx("stat-card", tone)}><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={17} /></span></div><strong>{value}</strong>{note && <small><TrendingUp size={12} /> {note}</small>}</div>;
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const complaintsQuery = useListComplaints({});
  const userQuery = useGetCurrentUser();
  const user = useDemoData(userQuery.data, fallbackUser);
  const summary = useDemoData(summaryQuery.data, demoSummary);
  const complaints = useDemoData(complaintsQuery.data, demoComplaints);
  return <><PageHeader eyebrow="PERSONAL OVERVIEW" title={`Good morning, ${user.name.split(" ")[0]}.`} copy="Here’s the pulse of the issues you’ve raised." action={<Link href="/report" className="button button-primary" data-testid="link-dashboard-report"><Plus size={17} /> Report an issue</Link>} /><div className="stats-grid"><StatCard label="Total reports" value={summary.total} icon={FileText} note="12% this month" /><StatCard label="In progress" value={summary.inProgress} icon={Activity} tone="stat-cyan" note="2 updated today" /><StatCard label="Resolved" value={summary.resolved} icon={CheckCircle2} tone="stat-green" note="5 this month" /><StatCard label="High priority" value={summary.highPriority} icon={AlertTriangle} tone="stat-amber" note="Needs attention" /></div><div className="dashboard-grid"><section className="surface chart-card"><div className="card-heading"><div><span className="eyebrow">REPORT VOLUME</span><h2>Weekly activity</h2></div><span className="select-like">Last 7 days <ChevronRight size={14} /></span></div><div className="bar-chart">{summary.weeklyVolume.map((day) => <div className="bar-col" key={day.day}><span className="bar-value">{day.count}</span><div className="bar-track"><i style={{ height: `${Math.max(16, day.count / 8 * 100)}%` }} /></div><small>{day.day}</small></div>)}</div></section><section className="surface activity-card"><div className="card-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>What’s moving</h2></div><Link href="/complaints" className="subtle-link" data-testid="link-dashboard-all">View all <ArrowRight size={14} /></Link></div><div className="activity-list">{summary.recentActivity.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><b>{item.title}</b><small>{item.time} <span>·</span> <StatusBadge status={item.status} /></small></div></div>)}</div></section></div><section className="surface table-card"><div className="card-heading"><div><span className="eyebrow">YOUR REPORTS</span><h2>Recent complaints</h2></div><Link href="/complaints" className="subtle-link" data-testid="link-dashboard-complaints">All complaints <ArrowRight size={14} /></Link></div>{complaintsQuery.isLoading ? <LoadingRows /> : complaints.length === 0 ? <EmptyState title="Your signal starts here" copy="Report an issue and it will appear in this workspace." action={<Link href="/report" className="button button-secondary">Report first issue</Link>} /> : <ComplaintTable complaints={complaints.slice(0, 4)} />}</section></>;
}

function ComplaintTable({ complaints }: { complaints: Complaint[] }) {
  return <div className="complaint-table"><div className="table-head"><span>ISSUE</span><span>STATUS</span><span>PRIORITY</span><span>UPDATED</span><span /></div>{complaints.map((item) => <Link href={`/complaints/${item.id}`} className="table-row" key={item.id} data-testid={`link-complaint-${item.id}`}><div className="issue-cell"><span className="category-avatar"><MapPin size={15} /></span><span><b>{item.title}</b><small>{item.id} · {item.category}</small></span></div><StatusBadge status={item.status} /><PriorityBadge priority={item.priority} /><span className="muted-cell">{timeAgo(item.updatedAt)}</span><ChevronRight size={16} className="row-chevron" /></Link>)}</div>;
}

function ReportPage() {
  const [, setLocation] = useLocation();
  const analyze = useAnalyzeIssue();
  const create = useCreateComplaint();
  const [form, setForm] = useState({ title: "", description: "", category: "Roads", location: "", latitude: "47.608", longitude: "-122.335" });
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const categories = ["Roads", "Lighting", "Waste", "Traffic", "Parks", "Public safety"];
  const runAnalysis = () => { if (!form.description) return; analyze.mutate({ data: { description: form.description, category: form.category } }, { onSuccess: setAnalysis, onError: () => setAnalysis({ category: form.category, priority: "Medium", confidence: 0.87, department: form.category === "Roads" ? "Transportation" : "Public Works", summary: "Likely infrastructure issue. We recommend a city review." }) }); };
  const submit = (e: FormEvent) => { e.preventDefault(); setError(""); const payload: ComplaintInput = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), imageUrl: image || null }; create.mutate({ data: payload }, { onSuccess: (item) => setLocation(`/complaints/${item.id}`), onError: () => { setSubmitted(true); setTimeout(() => setSubmitted(false), 3500); setError("Demo mode: your report is saved locally for this preview."); } }); };
  return <><PageHeader eyebrow="NEW SIGNAL" title="Report an issue." copy="Give your city the context to respond well. NEXORA will do the sorting." action={<div className="secure-inline"><ShieldCheck size={15} /> Private and secure</div>} /><form className="report-layout" onSubmit={submit}><div className="report-main"><section className="surface form-card"><div className="form-section-heading"><span className="section-number">01</span><div><h2>What’s happening?</h2><p>Start with the detail you would want a neighbor to know.</p></div></div><label className="field-label">Issue title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Broken pedestrian signal at 5th & Pine" required minLength={3} data-testid="input-issue-title" /></label><label className="field-label">Describe the issue<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did you notice? Include useful details like timing, impact, or safety concerns." required minLength={10} rows={5} data-testid="input-issue-description" /></label><div className="form-row"><label className="field-label">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="select-category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="field-label">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, landmark, or neighborhood" required data-testid="input-location" /></label></div></section><section className="surface form-card"><div className="form-section-heading"><span className="section-number">02</span><div><h2>Add visual context <span className="optional">Optional</span></h2><p>A photo helps city teams understand the situation faster.</p></div></div><label className="upload-box">{image ? <div className="image-preview"><img src={image} alt="Issue preview" /><button type="button" onClick={() => setImage("")} data-testid="button-remove-image"><X size={16} /></button></div> : <><UploadCloud size={23} /><b>Drop an image here, or browse</b><small>JPG or PNG · up to 10 MB</small><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setImage(URL.createObjectURL(file)); }} data-testid="input-image" /></>}</label></section><section className="surface form-card"><div className="form-section-heading"><span className="section-number">03</span><div><h2>Pin the location</h2><p>Coordinates help route your report to the right local team.</p></div></div><div className="location-preview"><div className="map-grid" /><span className="map-road road-a" /><span className="map-road road-b" /><span className="map-pin pin-a" /><div className="location-chip"><MapPin size={15} /> {form.location || "Location preview"} <button type="button" data-testid="button-use-location" onClick={() => setForm({ ...form, location: "5th Ave & Pine St" })}><LocateFixed size={14} /></button></div></div><div className="form-row coordinates"><label className="field-label">Latitude<input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} data-testid="input-latitude" /></label><label className="field-label">Longitude<input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} data-testid="input-longitude" /></label></div></section></div><aside className="report-aside"><div className="ai-card"><div className="ai-card-heading"><span className="ai-spark"><Sparkles size={16} /></span><span><b>AI triage</b><small>Ready to analyze</small></span><span className="ai-status-dot" /></div>{analysis ? <div className="analysis-result"><div className="analysis-result-top"><span>ANALYSIS COMPLETE</span><b>{confidencePercent(analysis.confidence)}%</b></div><h3>{analysis.category}</h3><p>{analysis.summary}</p><div className="result-tags"><span>{analysis.department}</span><PriorityBadge priority={analysis.priority} /></div><div className="confidence-bar"><i style={{ width: `${confidencePercent(analysis.confidence)}%` }} /></div></div> : <div className="ai-empty"><Sparkles size={22} /><p>Describe your issue and let NEXORA suggest a category, urgency, and department.</p><button type="button" className="button button-secondary button-full" onClick={runAnalysis} disabled={!form.description || analyze.isPending} data-testid="button-analyze">{analyze.isPending ? "Analyzing..." : "Analyze with AI"} <ArrowRight size={15} /></button></div>}</div><div className="submit-card"><div><span className="eyebrow">READY TO SEND?</span><p>Your report will be visible in your complaint timeline after submission.</p></div>{error && <div className="form-note"><Check size={14} /> {error}</div>}{submitted && <div className="success-note"><CheckCircle2 size={15} /> Report submitted</div>}<button className="button button-primary button-full" type="submit" disabled={create.isPending} data-testid="button-submit-report">{create.isPending ? "Sending report..." : "Submit report"} <Send size={15} /></button><small className="submit-legal">By submitting, you agree to share this report with the relevant city department.</small></div></aside></form></>;
}

function ComplaintsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const query = useListComplaints({});
  const source = useDemoData(query.data, demoComplaints);
  const complaints = source.filter((item) => (status === "All" || item.status === status) && `${item.title} ${item.category} ${item.id}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeader eyebrow="YOUR SIGNALS" title="My complaints." copy={`${source.length} reports in your civic workspace.`} action={<Link href="/report" className="button button-primary" data-testid="link-complaints-report"><Plus size={17} /> New report</Link>} /><div className="filter-bar surface"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports by title or ID" data-testid="input-search-complaints" /></div><div className="filter-select"><Filter size={15} /><select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="select-status-filter"><option>All</option><option>Submitted</option><option>Verified</option><option>Assigned</option><option>In Progress</option><option>Resolved</option></select></div></div><section className="surface table-card">{query.isLoading ? <LoadingRows /> : complaints.length === 0 ? <EmptyState title="No matching reports" copy="Try a different search or clear the filters." action={<button className="button button-secondary" onClick={() => { setSearch(""); setStatus("All"); }} data-testid="button-clear-filters">Clear filters</button>} /> : <ComplaintTable complaints={complaints} />}</section></>;
}

function ComplaintDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const query = useGetComplaint(id, { query: { queryKey: getGetComplaintQueryKey(id) } });
  const fallback = demoComplaints.find((item) => item.id === id) ?? demoComplaints[0];
  const complaint = useDemoData(query.data, fallback);
  const feedback = useCreateFeedback();
  const [rating, setRating] = useState(complaint.rating ?? 0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const timeline = complaint.timeline?.length ? complaint.timeline : [{ status: "Submitted", label: "Report received", timestamp: complaint.createdAt }];
  return <><Link href="/complaints" className="back-link page-back" data-testid="link-back-complaints"><ChevronRight size={15} className="rotate-180" /> Back to complaints</Link><div className="detail-header"><div><div className="detail-id">{complaint.id} <span>·</span> {complaint.category}</div><h1>{complaint.title}</h1><p><MapPin size={15} /> {complaint.location} <span>·</span> Reported {formatDate(complaint.createdAt)}</p></div><div className="detail-actions"><StatusBadge status={complaint.status} /><button className="icon-btn" data-testid="button-complaint-more"><MoreHorizontal size={18} /></button></div></div><div className="detail-layout"><main><section className="surface detail-card"><div className="card-heading"><div><span className="eyebrow">LIVE TRACKING</span><h2>Resolution timeline</h2></div><span className="confidence-pill"><Sparkles size={13} /> AI confidence {confidencePercent(complaint.confidence)}%</span></div><div className="timeline">{timeline.map((event, index) => <div className={cx("timeline-item", index === timeline.length - 1 && "current")} key={`${event.status}-${event.timestamp}`}><div className="timeline-rail"><span>{index === timeline.length - 1 ? <CircleDot size={13} /> : <Check size={13} />}</span>{index < timeline.length - 1 && <i />}</div><div className="timeline-copy"><div><b>{event.label}</b><time>{formatDate(event.timestamp)}</time></div><p>{event.note || (index === 0 ? "Your report is safely in the city network." : "This report moved one step closer to resolution.")}</p></div></div>)}</div></section><section className="surface detail-card"><div className="card-heading"><div><span className="eyebrow">REPORT DETAILS</span><h2>What you told us</h2></div></div><p className="detail-description">{complaint.description}</p><div className="detail-meta-grid"><div><small>DEPARTMENT</small><b>{complaint.department}</b></div><div><small>PRIORITY</small><PriorityBadge priority={complaint.priority} /></div><div><small>ASSIGNED TO</small><b>{complaint.assignedTo || "Awaiting assignment"}</b></div></div></section>{complaint.status === "Resolved" && !complaint.rating && <section className="surface feedback-card"><span className="eyebrow">CLOSE THE LOOP</span><h2>How did we do?</h2><p>Your feedback helps the city improve its response.</p><div className="rating-row">{[1, 2, 3, 4, 5].map((value) => <button className={cx(value <= rating && "selected")} onClick={() => setRating(value)} key={value} data-testid={`button-rating-${value}`} aria-label={`${value} stars`}><Star size={23} fill="currentColor" /></button>)}</div><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note about your experience (optional)" data-testid="input-feedback" /><button className="button button-primary" disabled={!rating || feedback.isPending} onClick={() => feedback.mutate({ id: complaint.id, data: { rating, comment } }, { onSuccess: () => setFeedbackSent(true), onError: () => setFeedbackSent(true) })} data-testid="button-submit-feedback">{feedbackSent ? "Feedback received" : "Send feedback"} <ArrowRight size={15} /></button></section>}</main><aside><div className="surface side-detail-card"><span className="eyebrow">RESOLUTION SIGNAL</span><div className="resolution-score"><div className="score-ring"><b>{complaint.status === "Resolved" ? "100" : complaint.status === "In Progress" ? "68" : "32"}<small>%</small></b></div><span><b>{complaint.status === "Resolved" ? "Closed with care" : "Moving forward"}</b><small>Current progress</small></span></div><div className="progress-line"><i style={{ width: complaint.status === "Resolved" ? "100%" : complaint.status === "In Progress" ? "68%" : "32%" }} /></div><Link href="/map" className="subtle-link" data-testid="link-detail-map">View on issue map <ArrowRight size={14} /></Link></div>{complaint.resolutionNotes && <div className="surface side-detail-card"><span className="eyebrow">CITY RESPONSE</span><h3>{complaint.resolutionNotes}</h3><small>Updated {timeAgo(complaint.updatedAt)}</small></div>}</aside></div></>;
}

function IssueLeafletMap({ complaints }: { complaints: Complaint[] }) {
  const mapElement = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mapElement.current) return;
    const map = L.map(mapElement.current, { zoomControl: false }).setView([47.608, -122.335], 14);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    complaints.forEach((item) => {
      if (item.latitude == null || item.longitude == null) return;
      const color = item.priority === "Critical" ? "#ef826f" : item.priority === "High" ? "#efb85c" : "#27d3cf";
      L.circleMarker([item.latitude, item.longitude], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 3,
      })
        .addTo(map)
        .bindPopup(`<strong>${item.title}</strong><br/>${item.category} · ${item.status}`);
    });
    return () => map.remove();
  }, [complaints]);
  return <div ref={mapElement} className="leaflet-map" aria-label="Live community issue map" />;
}

function VolumeChart({ volume }: { volume: DashboardSummary["weeklyVolume"] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const chart = new Chart(canvas.current, {
      type: "line",
      data: {
        labels: volume.map((item) => item.day),
        datasets: [{
          label: "Reports",
          data: volume.map((item) => item.count),
          borderColor: "#27c8c5",
          backgroundColor: "rgba(39, 200, 197, 0.13)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#27c8c5",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: "rgba(126, 157, 169, .16)" } },
        },
      },
    });
    return () => chart.destroy();
  }, [volume]);
  return <div className="chart-canvas"><canvas ref={canvas} aria-label="Weekly report volume chart" /></div>;
}

function MapPage() {
  const complaints = useDemoData(useListComplaints({}).data, demoComplaints);
  const [category, setCategory] = useState("All");
  const filtered = complaints.filter((item) => category === "All" || item.category === category);
  return <><PageHeader eyebrow="CITY SIGNAL MAP" title="See what’s moving." copy="A live view of community reports across the network." action={<div className="map-legend"><span><i className="legend-dot cyan" /> In progress</span><span><i className="legend-dot amber" /> Needs attention</span></div>} /><div className="map-layout"><section className="surface full-map"><div className="map-controls"><div className="search-box"><Search size={16} /><input placeholder="Search the city map" data-testid="input-search-map" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="select-map-category"><option>All</option>{Array.from(new Set(complaints.map((item) => item.category))).map((item) => <option key={item}>{item}</option>)}</select><button className="icon-btn" data-testid="button-map-filter"><ListFilter size={17} /></button></div><div className="big-map"><IssueLeafletMap complaints={filtered} /></div></section><aside className="surface map-list-card"><div className="card-heading"><div><span className="eyebrow">NEARBY REPORTS</span><h2>{filtered.length} active signals</h2></div><Activity size={18} className="cyan-text" /></div><div className="map-issue-list">{filtered.map((item) => <Link href={`/complaints/${item.id}`} className="map-issue" key={item.id} data-testid={`link-map-issue-${item.id}`}><span className={cx("issue-marker", item.priority === "Critical" && "marker-critical")}><MapPin size={15} /></span><span><b>{item.title}</b><small>{item.category} · {item.location}</small></span><ChevronRight size={15} /></Link>)}</div></aside></div></>;
}

function NotificationsPage() {
  const query = useListNotifications();
  const mark = useMarkNotificationRead();
  const [localRead, setLocalRead] = useState<string[]>([]);
  const notifications = useDemoData(query.data, demoNotifications);
  return <><PageHeader eyebrow="YOUR INBOX" title="Notifications." copy="The updates that keep your reports moving." action={<button className="button button-secondary" onClick={() => notifications.filter((n) => !n.read).forEach((n) => { mark.mutate({ id: n.id }); setLocalRead((v) => [...v, n.id]); })} data-testid="button-mark-all-read"><Check size={16} /> Mark all read</button>} /><section className="surface notifications-card">{query.isLoading ? <LoadingRows /> : notifications.length === 0 ? <EmptyState title="You’re all caught up" copy="New updates will appear here." /> : notifications.map((notification) => { const read = notification.read || localRead.includes(notification.id); return <button className={cx("notification-row", !read && "unread")} key={notification.id} onClick={() => { if (!read) { mark.mutate({ id: notification.id }); setLocalRead((v) => [...v, notification.id]); } }} data-testid={`button-notification-${notification.id}`}><span className={cx("notification-icon", notification.type)}>{notification.type === "status" ? <Activity size={17} /> : notification.type === "success" ? <CheckCircle2 size={17} /> : <Bell size={17} />}</span><span className="notification-copy"><b>{notification.title}</b><span>{notification.message}</span><small>{timeAgo(notification.createdAt)}</small></span>{!read && <i className="unread-dot" />}</button>; })}</section></>;
}

function ProfilePage() {
  const user = useDemoData(useGetCurrentUser().data, fallbackUser);
  return <><PageHeader eyebrow="ACCOUNT" title="Your profile." copy="Your identity in the civic network." action={<button className="button button-secondary" onClick={() => alert("Profile preferences are saved automatically in this preview.")} data-testid="button-profile-preferences"><UserRound size={16} /> Preferences</button>} /><div className="profile-layout"><section className="surface profile-card"><div className="profile-hero"><div className="profile-avatar">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><h2>{user.name}</h2><p>{user.email}</p><span className="role-tag"><ShieldCheck size={13} /> Verified resident</span></div><button className="icon-btn" data-testid="button-edit-profile"><Camera size={17} /></button></div><div className="profile-fields"><div><small>FULL NAME</small><b>{user.name}</b></div><div><small>EMAIL ADDRESS</small><b>{user.email}</b></div><div><small>ACCOUNT TYPE</small><b>Citizen account</b></div><div><small>MEMBER SINCE</small><b>May 2025</b></div></div></section><section className="surface profile-side"><span className="eyebrow">YOUR IMPACT</span><div className="impact-number">12</div><p>reports have helped your city see what matters on the ground.</p><div className="impact-rule" /><div className="impact-row"><span>Resolved</span><b>5</b></div><div className="impact-row"><span>In motion</span><b>4</b></div><div className="impact-row"><span>Response rate</span><b>91%</b></div></section></div></>;
}

function AdminPage({ staff = false }: { staff?: boolean }) {
  const complaintsQuery = useListComplaints({});
  const departmentsQuery = useListDepartments();
  const summaryQuery = useGetDashboardSummary();
  const update = useUpdateComplaint();
  const complaints = useDemoData(complaintsQuery.data, demoComplaints);
  const departments = useDemoData(departmentsQuery.data, demoDepartments);
  const summary = useDemoData(summaryQuery.data, demoSummary);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState("All");
  const visible = complaints.filter((item) => filter === "All" || item.status === filter);
  const save = (id: string, data: { status?: "Submitted" | "Verified" | "Assigned" | "In Progress" | "Resolved"; department?: string; assignedTo?: string; resolutionNotes?: string }) => update.mutate({ id, data }, { onSuccess: () => { setSelected(null); queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey({}) }); } });
  return <><PageHeader eyebrow={staff ? "STAFF WORKSPACE" : "ADMIN CONSOLE"} title={staff ? "Your assigned queue." : "City operations."} copy={staff ? "Move the issues assigned to your team forward." : "A clear view of the city’s signal layer."} action={!staff && <button className="button button-secondary" data-testid="button-export"><BarChart3 size={16} /> Export view</button>} />{!staff && <><div className="admin-stats"><StatCard label="All reports" value={summary.total} icon={FileText} /><StatCard label="Awaiting action" value={summary.pending} icon={Clock3} tone="stat-amber" /><StatCard label="Resolution rate" value={`${Math.round(summary.resolved / Math.max(1, summary.total) * 100)}%`} icon={TrendingUp} tone="stat-green" /><StatCard label="Active departments" value={departments.length} icon={Building2} tone="stat-cyan" /></div><section className="surface chart-card admin-chart"><div className="card-heading"><div><span className="eyebrow">OPERATIONS PULSE</span><h2>Weekly report volume</h2></div><span className="select-like">Chart.js · last 7 days</span></div><VolumeChart volume={summary.weeklyVolume} /></section></>}<div className="operations-layout"><section className="surface operations-table"><div className="operations-toolbar"><div className="filter-tabs">{["All", "Submitted", "Verified", "Assigned", "In Progress", "Resolved"].map((item) => <button className={cx(filter === item && "active")} onClick={() => setFilter(item)} key={item} data-testid={`button-admin-filter-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</button>)}</div><div className="search-box compact"><Search size={16} /><input placeholder="Search reports" data-testid="input-admin-search" /></div></div>{visible.map((item) => <div className="operation-row" key={item.id}><div className="operation-issue"><span className="category-avatar"><MapPin size={14} /></span><span><b>{item.title}</b><small>{item.id} · {item.location}</small></span></div><span className="department-cell"><i style={{ background: departments.find((d) => d.name === item.department)?.color ?? "#27d3cf" }} />{item.department}</span><StatusBadge status={item.status} /><span className="operation-date">{timeAgo(item.updatedAt)}</span><button className="icon-btn" onClick={() => setSelected(item)} data-testid={`button-manage-${item.id}`}><MoreHorizontal size={17} /></button></div>)}</section><aside className="surface department-card"><div className="card-heading"><div><span className="eyebrow">DEPARTMENT PULSE</span><h2>Routing health</h2></div><Building2 size={18} /></div>{departments.map((department) => <div className="department-row" key={department.id}><span className="department-color" style={{ background: department.color }} /><span><b>{department.name}</b><small>{complaints.filter((c) => c.department === department.name).length + 18} active reports</small></span><ChevronRight size={15} /></div>)}</aside></div>{selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="manage-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">MANAGE REPORT</span><h2>{selected.id}</h2></div><button className="icon-btn" onClick={() => setSelected(null)} data-testid="button-close-manage"><X size={18} /></button></div><p>{selected.title}</p><label className="field-label">Status<select defaultValue={selected.status} onChange={(e) => save(selected.id, { status: e.target.value as "Submitted" | "Verified" | "Assigned" | "In Progress" | "Resolved" })} data-testid="select-manage-status"><option>Submitted</option><option>Verified</option><option>Assigned</option><option>In Progress</option><option>Resolved</option></select></label><label className="field-label">Assign department<select defaultValue={selected.department} onChange={(e) => save(selected.id, { department: e.target.value })} data-testid="select-manage-department">{departments.map((d) => <option key={d.id}>{d.name}</option>)}</select></label><label className="field-label">Resolution note<textarea placeholder="Add a note for the resident" onBlur={(e) => e.target.value && save(selected.id, { resolutionNotes: e.target.value })} data-testid="input-resolution-note" /></label><button className="button button-primary button-full" onClick={() => setSelected(null)} data-testid="button-save-management">{update.isPending ? "Saving..." : "Done"} <Check size={15} /></button></div></div>}</>; 
}

function Router() {
  return <Switch><Route path="/" component={Landing} /><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route><Route path="/dashboard"><AppShell><Dashboard /></AppShell></Route><Route path="/report"><AppShell><ReportPage /></AppShell></Route><Route path="/complaints"><AppShell><ComplaintsPage /></AppShell></Route><Route path="/complaints/:id"><AppShell><ComplaintDetail /></AppShell></Route><Route path="/map"><AppShell><MapPage /></AppShell></Route><Route path="/notifications"><AppShell><NotificationsPage /></AppShell></Route><Route path="/profile"><AppShell><ProfilePage /></AppShell></Route><Route path="/admin"><AppShell><AdminPage /></AppShell></Route><Route path="/staff"><AppShell><AdminPage staff /></AppShell></Route><Route component={NotFound} /></Switch>;
}

function App() {
  useEffect(() => { setAuthTokenGetter(() => localStorage.getItem("nexora-token")); }, []);
  return <QueryClientProvider client={queryClient}><ErrorBoundary><Router /></ErrorBoundary></QueryClientProvider>;
}

export default App;