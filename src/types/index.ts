/* ============================================================
   Career Transition OS — domain types
   Single source of truth for every entity in the app.
   ============================================================ */

/** The seven areas a working day can be spent on. */
export const AREAS = [
  'Project',
  'Learning',
  'Job Search',
  'Networking',
  'Interview Prep',
  'Portfolio',
  'Review',
] as const;
export type Area = (typeof AREAS)[number];

/** Shared progress state, used by weekly goals and roadmap weeks alike. */
export const STATUSES = ['Not started', 'In progress', 'Blocked', 'Done'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

/* ---------- Roadmap ---------- */

export type RoadmapWeek = {
  id: string;
  week: number;
  /** ISO date, Monday. */
  start: string;
  /** ISO date, Sunday. */
  end: string;
  theme: string;
  /** What the product itself should gain this week. */
  projectDirection: string;
  definitionOfDone: string;
  status: Status;
  notes: string;
};

/* ---------- Weekly goals (one per area per week) ---------- */

export type WeeklyGoal = {
  id: string;
  week: number;
  area: Area;
  /** Short imperative title, e.g. "Ship the typed data layer". */
  title: string;
  /** Plain-language explanation of what to actually do. */
  detail: string;
  definitionOfDone: string;
  status: Status;
  priority: Priority;
  plannedHours: number;
  evidenceUrl: string;
  notes: string;
};

/* ---------- Schedule ---------- */

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type ScheduleBlock = {
  id: string;
  day: DayKey;
  /** "09:00" */
  start: string;
  /** "13:00" */
  end: string;
  /** Null for lunch and other non-work blocks. */
  area: Area | null;
  label: string;
  /** Weekend blocks are optional; weekdays are not. */
  optional: boolean;
};

/* ---------- Applications ---------- */

export const APPLICATION_STATUSES = [
  'Saved',
  'Preparing',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Statuses that prove the company came back to you — the response-rate numerator. */
export const RESPONDED_STATUSES: ApplicationStatus[] = ['Interviewing', 'Offer', 'Rejected'];
/** Statuses still live in the funnel. */
export const ACTIVE_STATUSES: ApplicationStatus[] = ['Interviewing', 'Offer'];

export const ROLE_FAMILIES = [
  'Full-Stack SWE',
  'Frontend SWE',
  'Technical Support',
  'Solutions Engineer',
  'Implementation Engineer',
  'QA Automation',
  'Customer Engineer',
] as const;
export type RoleFamily = (typeof ROLE_FAMILIES)[number];

export type Application = {
  id: string;
  company: string;
  role: string;
  family: RoleFamily | '';
  status: ApplicationStatus;
  url: string;
  location: string;
  salary: string;
  week: number | null;
  dateFound: string;
  deadline: string;
  dateApplied: string;
  followup: string;
  interviewStage: string;
  resumeVersion: string;
  contact: string;
  nextAction: string;
  result: string;
  notes: string;
};

/* ---------- Networking ---------- */

export const CONTACT_STATUSES = [
  'Not contacted',
  'Drafted',
  'Sent',
  'Connected',
  'Replied',
  'Meeting scheduled',
  'Follow-up due',
  'No response',
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_TYPES = ['Peer contact', 'Hiring influencer', 'Recruiter'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * One outreach target. Created automatically for every company you add,
 * then filled in as you identify a real human behind the profile.
 */
export type Contact = {
  id: string;
  company: string;
  person: string;
  targetProfile: string;
  contactType: ContactType;
  status: ContactStatus;
  searchUrl: string;
  companyUrl: string;
  link: string;
  angle: string;
  week: number | null;
  lastContact: string;
  dateSent: string;
  followup: string;
  meeting: string;
  nextAction: string;
  notes: string;
};

/* ---------- Companies ---------- */

export const COMPANY_PRIORITIES = ['A', 'B', 'C'] as const;
export type CompanyPriority = (typeof COMPANY_PRIORITIES)[number];

export const COMPANY_STATUSES = [
  'Researching',
  'Applying',
  'Applied',
  'Interviewing',
  'Rejected',
  'Offer',
  'Deprioritized',
] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export type Company = {
  id: string;
  name: string;
  sector: string;
  size: string;
  location: string;
  workMode: string;
  priority: CompanyPriority;
  fitScore: number;
  primaryRoles: string;
  secondaryRoles: string;
  whyItFits: string;
  stack: string;
  careersUrl: string;
  linkedinUrl: string;
  nextAction: string;
  status: CompanyStatus;
  lastReviewed: string;
  notes: string;
};

/* ---------- Resources ---------- */

export type Skill = {
  id: string;
  skill: string;
  currentLevel: string;
  target: string;
  priority: Priority;
  evidence: string;
  action: string;
};

export type MessageTemplate = {
  id: string;
  useCase: string;
  template: string;
};

/* ---------- Weekly review ---------- */

export type WeeklyReview = {
  shipped: string;
  evidenceUrls: string;
  applicationsSent: number;
  messagesSent: number;
  callsMeetups: number;
  interviewPrepDone: boolean;
  technicalLesson: string;
  mainBlocker: string;
  changeNextWeek: string;
  energyFocus: number | null;
  weekComplete: boolean;
};

/* ---------- Settings & logs ---------- */

export type Settings = {
  /** ISO date the programme actually began. */
  programStart: string;
  currentWeek: number;
  /** Overrides the real clock, for testing a different "today". */
  todayOverride: string | null;
};

/** dailyLog[isoDate][blockId] = completed */
export type DailyLog = Record<string, Record<string, boolean>>;

export type AppState = {
  roadmap: RoadmapWeek[];
  goals: WeeklyGoal[];
  schedule: ScheduleBlock[];
  applications: Application[];
  contacts: Contact[];
  companies: Company[];
  skills: Skill[];
  templates: MessageTemplate[];
  reviews: Record<string, WeeklyReview>;
  dailyLog: DailyLog;
  settings: Settings;
};
