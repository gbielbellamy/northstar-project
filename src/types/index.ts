/* ============================================================
   Career Transition OS — domain types
   Single source of truth for every entity in the app.
   ============================================================ */

/** The seven areas a working day can be spent on. */
export const AREAS = [
  'Project',
  'Learning',
  'Algorithms',
  'Job Search',
  'Networking',
  'Contributions',
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
  /** What finishing this one sitting looks like. */
  sessionDone?: string;
  /** Ordered steps for the sitting, shown under the block on the day view. */
  steps?: string[];
  /** Inclusive week range the block applies to; null on either for "always". */
  fromWeek?: number | null;
  toWeek?: number | null;
};

/** Whether a block is part of the timetable in the given programme week. */
export function blockAppliesTo(block: ScheduleBlock, week: number): boolean {
  if (block.fromWeek != null && week < block.fromWeek) return false;
  if (block.toWeek != null && week > block.toWeek) return false;
  return true;
}

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

/** The company replied. Numerator of the response rate. */
export const RESPONDED_STATUSES: ApplicationStatus[] = ['Interviewing', 'Offer', 'Rejected'];
/** Statuses still live in the funnel. */
export const ACTIVE_STATUSES: ApplicationStatus[] = ['Interviewing', 'Offer'];
/** Statuses where the conversation is over. Excluded from follow-ups due. */
export const CLOSED_STATUSES: ApplicationStatus[] = [
  'Offer',
  'Rejected',
  'Withdrawn',
  'Ghosted',
];

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

/** One outreach target, created automatically for every company added. */
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

/* ---------- Open source ---------- */

/** The real shape of a contribution, from finding a project to getting merged. */
export const OSS_STAGES = [
  'Shortlisted',
  'Running locally',
  'Issue claimed',
  'PR open',
  'Changes requested',
  'Merged',
  'Closed',
] as const;
export type OssStage = (typeof OSS_STAGES)[number];

/** Documentation and tests count. */
export const OSS_KINDS = ['Docs', 'Tests', 'Bug fix', 'Feature', 'Triage'] as const;
export type OssKind = (typeof OSS_KINDS)[number];

export type OssContribution = {
  id: string;
  /** The project, e.g. "Zustand". */
  project: string;
  repoUrl: string;
  /** What the change is, in one line. */
  title: string;
  kind: OssKind;
  stage: OssStage;
  issueUrl: string;
  prUrl: string;
  /** Why this one was picked. */
  why: string;
  /** What the review taught you. */
  reviewLesson: string;
  dateStarted: string;
  dateMerged: string;
  notes: string;
};

/* ---------- Resources ---------- */

export const RESOURCE_KINDS = [
  'Docs',
  'Course',
  'Video',
  'Article',
  'Practice',
  'Reference',
] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

/** One resource link, with the reason it earned its place. */
export type SkillResource = {
  id: string;
  title: string;
  url: string;
  kind: ResourceKind;
  note: string;
};

/** One sitting of the Learning block, ordered so the skill reads as a path. */
export type SkillSession = {
  id: string;
  order: number;
  title: string;
  /** What you understand when it's over. */
  goal: string;
  /** What you write yourself. */
  exercise: string;
  resourceUrl: string;
  minutes: number;
  done: boolean;
};

export type Skill = {
  id: string;
  skill: string;
  currentLevel: string;
  target: string;
  priority: Priority;
  evidence: string;
  action: string;
  /** Why this skill matters. */
  why: string;
  /** What you build to prove it. */
  miniProject: string;
  miniProjectDod: string;
  resources: SkillResource[];
  sessions: SkillSession[];
  /** Groups the roadmap into readable sections. */
  category: SkillCategory;
  /** One or two letters for the tech badge, e.g. "TS". */
  badge: string;
  /** Brand colour behind the badge. */
  colour: string;
  /**
   * simple-icons slug for the official logo, e.g. "typescript". Empty when the
   * brand has no icon in the set, and the badge letters are used instead.
   */
  icon: string;
  /** Optional: not part of the weekday plan. */
  optional: boolean;
};

export const SKILL_CATEGORIES = [
  'Foundations',
  'Styling',
  'Frontend framework',
  'State management',
  'Backend',
  'Data',
  'Testing',
  'Delivery',
  'Hosting',
  'Tooling',
  'AI-assisted work',
  'Career craft',
  'Weekend & extras',
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

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

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Typefaces to choose from. Bundled locally rather than fetched from a CDN. */
export const FONTS = [
  'System',
  'Inter',
  'Manrope',
  'Plus Jakarta Sans',
  'Figtree',
  'Space Grotesk',
] as const;
export type FontChoice = (typeof FONTS)[number];

/** The numbers the dashboard measures against. */
export type Targets = {
  /** Tailored applications for Software/Full-Stack Engineer roles. */
  directApplicationsPerWeek: number;
  /** Bridge roles: support, solutions, implementation, QA. */
  bridgeApplicationsPerWeek: number;
  contactsPerWeek: number;
  /** Percentage, 0–100. */
  responseRate: number;
  liveConversations: number;
  weeklyHours: number;
};

export type Settings = {
  /** ISO date the programme actually began. */
  programStart: string;
  currentWeek: number;
  /** Overrides the real clock. Used to test a different "today". */
  todayOverride: string | null;
  theme: Theme;
  font: FontChoice;
  targets: Targets;
  /** Bumped in the seed when the plan is rewritten; a behind value triggers replacement. */
  planVersion: number;
};

/* ---------- Days that don't go to plan ---------- */

export const EXCEPTION_KINDS = [
  'Networking event',
  'Interview',
  'Technical blocker',
  'Personal',
  'Sick',
  'Holiday',
] as const;
export type ExceptionKind = (typeof EXCEPTION_KINDS)[number];

/** A day the plan was displaced. Records the hours owed and when they are made up. */
export type DayException = {
  id: string;
  /** ISO date the plan was displaced. */
  date: string;
  kind: ExceptionKind;
  note: string;
  /** Hours owed. Defaults to the day's planned work, but you can do half a day. */
  hoursOwed: number;
  /** ISO date the hours are made up. */
  recoverOn: string;
  recovered: boolean;
};

/** dailyLog[isoDate][blockId] = completed */
export type DailyLog = Record<string, Record<string, boolean>>;

/**
 * A skipped occurrence. The slot stays put; its content moves to the area's
 * next occurrence. Lag is derived from this list rather than stored.
 */
export type Deferral = {
  id: string;
  /** The date the occurrence was originally due. */
  date: string;
  blockId: string;
  area: Area;
};

export type AppState = {
  roadmap: RoadmapWeek[];
  goals: WeeklyGoal[];
  schedule: ScheduleBlock[];
  exceptions: DayException[];
  deferrals: Deferral[];
  oss: OssContribution[];
  applications: Application[];
  contacts: Contact[];
  companies: Company[];
  skills: Skill[];
  templates: MessageTemplate[];
  reviews: Record<string, WeeklyReview>;
  dailyLog: DailyLog;
  settings: Settings;
};
