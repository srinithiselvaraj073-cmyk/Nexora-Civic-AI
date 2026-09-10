import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AnalyzeIssueResponse,
  AnalyzeIssueBody,
  CreateComplaintBody,
  CreateComplaintResponse,
  CreateFeedbackBody,
  CreateFeedbackResponse,
  CreateFeedbackParams,
  GetComplaintParams,
  GetComplaintResponse,
  GetCurrentUserResponse,
  GetDashboardSummaryResponse,
  ListComplaintsQueryParams,
  ListComplaintsResponse,
  ListDepartmentsResponse,
  ListNotificationsResponse,
  LoginBody,
  LoginResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  RegisterBody,
  RegisterResponse,
  UpdateComplaintBody,
  UpdateComplaintParams,
  UpdateComplaintResponse,
} from "@workspace/api-zod";
import type {
  AiAnalysis,
  Complaint,
  ComplaintInput,
  ComplaintUpdate,
  DashboardSummary,
  Department,
  Feedback,
  Notification,
  TimelineEvent,
  User,
} from "@workspace/api-zod";

type Role = "citizen" | "staff" | "admin";
type AuthenticatedRequest = Request & { user?: DemoUser };

type DemoUser = User & { passwordHash: string };
type InternalComplaint = Complaint;

const router: IRouter = Router();
const secret = process.env.SESSION_SECRET ?? "nexora-development-secret";

const now = () => new Date().toISOString();
const isoHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const departments: Department[] = [
  { id: "public-works", name: "Public Works", color: "#35d0ba" },
  { id: "water-services", name: "Water Services", color: "#4f8cff" },
  { id: "sanitation", name: "Sanitation", color: "#f5b74f" },
  { id: "street-lighting", name: "Street Lighting", color: "#aa8cff" },
];

const demoUsers: DemoUser[] = [
  {
    id: "usr-ava",
    name: "Ava Thompson",
    email: "ava@nexora.city",
    role: "citizen",
    avatar: "AT",
    department: null,
    passwordHash: bcrypt.hashSync("Nexora123!", 10),
  },
  {
    id: "usr-marcus",
    name: "Marcus Lee",
    email: "marcus@nexora.city",
    role: "staff",
    avatar: "ML",
    department: "Public Works",
    passwordHash: bcrypt.hashSync("Nexora123!", 10),
  },
  {
    id: "usr-admin",
    name: "Priya Shah",
    email: "admin@nexora.city",
    role: "admin",
    avatar: "PS",
    department: "City Operations",
    passwordHash: bcrypt.hashSync("Nexora123!", 10),
  },
];

const event = (
  status: string,
  label: string,
  timestamp: string,
  note: string | null = null,
): TimelineEvent => ({ status, label, timestamp, note });

const demoComplaints: InternalComplaint[] = [
  {
    id: "NX-2048",
    title: "Deep pothole on 5th Avenue",
    description:
      "Large pothole near the eastbound bus stop. Vehicles are swerving into the bike lane to avoid it.",
    category: "Road damage",
    priority: "High",
    status: "In Progress",
    location: "5th Avenue & Pine Street",
    latitude: 40.7146,
    longitude: -74.0062,
    reporterName: "Ava Thompson",
    reporterId: "usr-ava",
    department: "Public Works",
    assignedTo: "Marcus Lee",
    confidence: 94,
    imageUrl: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    rating: null,
    createdAt: isoHoursAgo(30),
    updatedAt: isoHoursAgo(2),
    timeline: [
      event("Submitted", "Issue submitted", isoHoursAgo(30)),
      event("Verified", "AI verified the issue", isoHoursAgo(29), "Road damage · 94% confidence"),
      event("Assigned", "Assigned to Public Works", isoHoursAgo(24), "Marcus Lee"),
      event("In Progress", "Crew dispatched", isoHoursAgo(2), "Site visit scheduled today"),
    ],
  },
  {
    id: "NX-2047",
    title: "Overflowing recycling bins",
    description:
      "Recycling bins have been overflowing since the weekend around the community garden entrance.",
    category: "Garbage",
    priority: "Medium",
    status: "Verified",
    location: "Riverside Community Garden",
    latitude: 40.7181,
    longitude: -74.002,
    reporterName: "Ava Thompson",
    reporterId: "usr-ava",
    department: "Sanitation",
    assignedTo: null,
    confidence: 88,
    imageUrl: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    rating: null,
    createdAt: isoHoursAgo(53),
    updatedAt: isoHoursAgo(7),
    timeline: [
      event("Submitted", "Issue submitted", isoHoursAgo(53)),
      event("Verified", "Issue verified", isoHoursAgo(7), "Sanitation team review queued"),
    ],
  },
  {
    id: "NX-2046",
    title: "Water leak near Elm station",
    description:
      "A steady stream of water is running down the sidewalk beside the station entrance.",
    category: "Water leakage",
    priority: "Critical",
    status: "Resolved",
    location: "Elm Station, North Entrance",
    latitude: 40.7119,
    longitude: -74.011,
    reporterName: "Jordan Rivera",
    reporterId: "usr-jordan",
    department: "Water Services",
    assignedTo: "Water Response Unit",
    confidence: 97,
    imageUrl: null,
    resolutionNotes: "Main line valve replaced and sidewalk cleared.",
    resolutionPhoto: null,
    rating: 5,
    createdAt: isoHoursAgo(118),
    updatedAt: isoHoursAgo(68),
    timeline: [
      event("Submitted", "Issue submitted", isoHoursAgo(118)),
      event("Verified", "Issue verified", isoHoursAgo(116)),
      event("Assigned", "Emergency crew assigned", isoHoursAgo(114)),
      event("In Progress", "Repair in progress", isoHoursAgo(80)),
      event("Resolved", "Repair confirmed", isoHoursAgo(68), "Main line valve replaced"),
    ],
  },
  {
    id: "NX-2045",
    title: "Streetlight out at Park Row",
    description: "The streetlight outside the south entrance has been dark for three nights.",
    category: "Broken streetlight",
    priority: "Low",
    status: "Assigned",
    location: "Park Row & 9th Street",
    latitude: 40.7216,
    longitude: -74.008,
    reporterName: "Noah Williams",
    reporterId: "usr-noah",
    department: "Street Lighting",
    assignedTo: "Marcus Lee",
    confidence: 91,
    imageUrl: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    rating: null,
    createdAt: isoHoursAgo(144),
    updatedAt: isoHoursAgo(21),
    timeline: [
      event("Submitted", "Issue submitted", isoHoursAgo(144)),
      event("Verified", "Issue verified", isoHoursAgo(140)),
      event("Assigned", "Assigned to Street Lighting", isoHoursAgo(21)),
    ],
  },
];

const complaints = [...demoComplaints];
const feedback: Feedback[] = [];
const notifications = new Map<string, Notification[]>([
  [
    "usr-ava",
    [
      {
        id: "ntf-1",
        title: "Your issue is in progress",
        message: "A crew has been dispatched to your 5th Avenue report.",
        type: "status",
        createdAt: isoHoursAgo(2),
        read: false,
      },
      {
        id: "ntf-2",
        title: "Thanks for helping your city",
        message: "Your report helped the team identify a high-priority road hazard.",
        type: "impact",
        createdAt: isoHoursAgo(26),
        read: true,
      },
    ],
  ],
]);

const publicUser = (user: DemoUser): User => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const tokenFor = (user: DemoUser) =>
  jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: "7d" });

const userForRequest = (req: AuthenticatedRequest) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  try {
    const payload = jwt.verify(header.slice(7), secret) as { sub?: string };
    return demoUsers.find((user) => user.id === payload.sub);
  } catch {
    return undefined;
  }
};

const requireAuth = (req: AuthenticatedRequest, res: Response): DemoUser | undefined => {
  const user = userForRequest(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return undefined;
  }
  req.user = user;
  return user;
};

const requireRole =
  (...roles: Role[]) =>
  (req: AuthenticatedRequest, res: Response): DemoUser | undefined => {
    const user = requireAuth(req, res);
    if (!user) return undefined;
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "You do not have access to this workspace" });
      return undefined;
    }
    return user;
  };

const aiFor = (description: string, requestedCategory?: string): AiAnalysis => {
  const text = `${requestedCategory ?? ""} ${description}`.toLowerCase();
  if (text.includes("leak") || text.includes("water") || text.includes("pipe")) {
    return {
      category: "Water leakage",
      priority: "Critical",
      confidence: 96,
      department: "Water Services",
      summary: "Water flow is likely affecting public access or nearby infrastructure.",
    };
  }
  if (text.includes("garbage") || text.includes("trash") || text.includes("bin")) {
    return {
      category: "Garbage",
      priority: "Medium",
      confidence: 92,
      department: "Sanitation",
      summary: "Waste collection or public bin service should review this location.",
    };
  }
  if (text.includes("light") || text.includes("dark") || text.includes("lamp")) {
    return {
      category: "Broken streetlight",
      priority: "Low",
      confidence: 90,
      department: "Street Lighting",
      summary: "A lighting maintenance team should inspect the fixture and power supply.",
    };
  }
  if (text.includes("drain") || text.includes("flood")) {
    return {
      category: "Drainage",
      priority: "High",
      confidence: 93,
      department: "Public Works",
      summary: "Drainage capacity or obstruction may be affecting pedestrian safety.",
    };
  }
  return {
    category: requestedCategory || "Road damage",
    priority: requestedCategory === "Other" ? "Medium" : "High",
    confidence: requestedCategory === "Other" ? 82 : 94,
    department: "Public Works",
    summary: "Public Works should inspect the affected area and schedule a site visit.",
  };
};

const visibleComplaints = (user: DemoUser) => {
  if (user.role === "citizen") {
    return complaints.filter((complaint) => complaint.reporterId === user.id || complaint.id === "NX-2046");
  }
  if (user.role === "staff") {
    return complaints.filter((complaint) => complaint.assignedTo === user.name || complaint.department === user.department);
  }
  return complaints;
};

const summaryFor = (user: DemoUser): DashboardSummary => {
  const visible = visibleComplaints(user);
  const count = (status: string) => visible.filter((item) => item.status === status).length;
  const categories = [...new Set(visible.map((item) => item.category))];
  return {
    total: visible.length,
    pending: visible.filter((item) => ["Submitted", "Verified", "Assigned"].includes(item.status)).length,
    inProgress: count("In Progress"),
    resolved: count("Resolved"),
    highPriority: visible.filter((item) => ["High", "Critical"].includes(item.priority)).length,
    avgResolutionHours: 18.4,
    byCategory: categories.map((category) => ({
      category,
      count: visible.filter((item) => item.category === category).length,
    })),
    weeklyVolume: [
      { day: "Mon", count: 8 },
      { day: "Tue", count: 12 },
      { day: "Wed", count: 9 },
      { day: "Thu", count: 15 },
      { day: "Fri", count: 11 },
      { day: "Sat", count: 6 },
      { day: "Sun", count: 4 },
    ],
    recentActivity: visible.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      time: item.updatedAt,
    })),
  };
};

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  if (demoUsers.some((user) => user.email === email)) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const user: DemoUser = {
    id: `usr-${randomUUID().slice(0, 8)}`,
    name: parsed.data.name,
    email,
    role: "citizen",
    avatar: parsed.data.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    department: null,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
  };
  demoUsers.push(user);
  notifications.set(user.id, []);
  res.status(201).json(RegisterResponse.parse({ token: tokenFor(user), user: publicUser(user) }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = demoUsers.find((candidate) => candidate.email === parsed.data.email.toLowerCase());
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Email or password is incorrect" });
    return;
  }
  res.json(LoginResponse.parse({ token: tokenFor(user), user: publicUser(user) }));
});

router.get("/auth/me", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(GetCurrentUserResponse.parse(publicUser(user)));
});

router.post("/ai/analyze", (req, res): void => {
  const parsed = AnalyzeIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(AnalyzeIssueResponse.parse(aiFor(parsed.data.description, parsed.data.category)));
});

router.get("/complaints", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  const parsed = ListComplaintsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const query = parsed.data;
  let result = visibleComplaints(user);
  if (query.status) result = result.filter((item) => item.status === query.status);
  if (query.category) result = result.filter((item) => item.category === query.category);
  if (query.search) {
    const search = query.search.toLowerCase();
    result = result.filter((item) =>
      `${item.title} ${item.location} ${item.id}`.toLowerCase().includes(search),
    );
  }
  res.json(ListComplaintsResponse.parse(result));
});

router.post("/complaints", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const analysis = aiFor(parsed.data.description, parsed.data.category);
  const timestamp = now();
  const complaint: InternalComplaint = {
    id: `NX-${Math.floor(2050 + Math.random() * 900)}`,
    title: parsed.data.title,
    description: parsed.data.description,
    category: analysis.category,
    priority: analysis.priority as InternalComplaint["priority"],
    status: "Submitted",
    location: parsed.data.location,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    reporterName: user.name,
    reporterId: user.id,
    department: analysis.department,
    assignedTo: null,
    confidence: analysis.confidence,
    imageUrl: parsed.data.imageUrl ?? null,
    resolutionNotes: null,
    resolutionPhoto: null,
    rating: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    timeline: [event("Submitted", "Issue submitted", timestamp)],
  };
  complaints.unshift(complaint);
  res.status(201).json(CreateComplaintResponse.parse(complaint));
});

router.get("/complaints/:id", (req, res): void => {
  const parsed = GetComplaintParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const complaint = complaints.find((item) => item.id === parsed.data.id);
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }
  res.json(GetComplaintResponse.parse(complaint));
});

router.patch("/complaints/:id", (req: AuthenticatedRequest, res): void => {
  const user = requireRole("staff", "admin")(req, res);
  if (!user) return;
  const params = UpdateComplaintParams.safeParse(req.params);
  const parsed = UpdateComplaintBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid complaint update" });
    return;
  }
  const complaint = complaints.find((item) => item.id === params.data.id);
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }
  const update: ComplaintUpdate = parsed.data;
  Object.assign(complaint, {
    ...update,
    updatedAt: now(),
    assignedTo: update.assignedTo ?? complaint.assignedTo,
    department: update.department ?? complaint.department,
    resolutionNotes: update.resolutionNotes ?? complaint.resolutionNotes,
    resolutionPhoto: update.resolutionPhoto ?? complaint.resolutionPhoto,
  });
  if (update.status && update.status !== complaint.status) {
    complaint.timeline.push(
      event(update.status, update.status === "Resolved" ? "Issue resolved" : `Status updated to ${update.status}`, now(), update.resolutionNotes ?? null),
    );
  }
  res.json(UpdateComplaintResponse.parse(complaint));
});

router.post("/complaints/:id/feedback", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  const params = CreateFeedbackParams.safeParse(req.params);
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid feedback" });
    return;
  }
  const complaint = complaints.find((item) => item.id === params.data.id);
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }
  complaint.rating = parsed.data.rating;
  const created: Feedback = {
    id: `fb-${randomUUID().slice(0, 8)}`,
    complaintId: complaint.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  };
  feedback.push(created);
  res.status(201).json(CreateFeedbackResponse.parse(created));
});

router.get("/dashboard/summary", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(GetDashboardSummaryResponse.parse(summaryFor(user)));
});

router.get("/notifications", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json(ListNotificationsResponse.parse(notifications.get(user.id) ?? []));
});

router.patch("/notifications/:id/read", (req: AuthenticatedRequest, res): void => {
  const user = requireAuth(req, res);
  if (!user) return;
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const item = (notifications.get(user.id) ?? []).find((notification) => notification.id === params.data.id);
  if (!item) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  item.read = true;
  res.json(MarkNotificationReadResponse.parse(item));
});

router.get("/departments", (_req, res): void => {
  res.json(ListDepartmentsResponse.parse(departments));
});

export default router;