import {
  Bookmark,
  CalendarCheck,
  ChevronDown,
  ChevronsUp,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CircleX,
  Clock,
  Equal,
  Flame,
  Ghost,
  GitFork,
  GitMerge,
  GitPullRequestArrow,
  GitPullRequestClosed,
  GitPullRequestDraft,
  Link2,
  MessageCircleReply,
  MessagesSquare,
  PenLine,
  Send,
  Star,
  Terminal,
  Trophy,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  Area,
  ApplicationStatus,
  CompanyPriority,
  CompanyStatus,
  ContactStatus,
  OssKind,
  OssStage,
  Priority,
  Status,
} from '../types';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'muted';

export const statusVariant: Record<Status, BadgeVariant> = {
  'Not started': 'muted',
  'In progress': 'warning',
  Blocked: 'error',
  Done: 'success',
};

export const priorityVariant: Record<Priority, BadgeVariant> = {
  Critical: 'error',
  High: 'warning',
  Medium: 'info',
  Low: 'muted',
};

export const applicationVariant: Record<ApplicationStatus, BadgeVariant> = {
  Saved: 'muted',
  Preparing: 'muted',
  Applied: 'info',
  Interviewing: 'warning',
  Offer: 'success',
  Rejected: 'error',
  Ghosted: 'muted',
  Withdrawn: 'muted',
};

export const contactVariant: Record<ContactStatus, BadgeVariant> = {
  'Not contacted': 'muted',
  Drafted: 'muted',
  Sent: 'info',
  Connected: 'info',
  Replied: 'success',
  'Meeting scheduled': 'success',
  'Follow-up due': 'warning',
  'No response': 'error',
};

export const companyPriorityVariant: Record<CompanyPriority, BadgeVariant> = {
  A: 'success',
  B: 'warning',
  C: 'muted',
};

export const companyStatusVariant: Record<CompanyStatus, BadgeVariant> = {
  Researching: 'muted',
  Applying: 'info',
  Applied: 'info',
  Interviewing: 'warning',
  Rejected: 'error',
  Offer: 'success',
  Deprioritized: 'muted',
};

/* ---------- Icons ----------
   One per value, so a status can be read at a glance without repeating the
   word next to itself. Paired with <StatusSelect>. */

export const statusIcon: Record<Status, LucideIcon> = {
  'Not started': Circle,
  'In progress': CircleDashed,
  Blocked: CircleAlert,
  Done: CircleCheck,
};

export const priorityIcon: Record<Priority, LucideIcon> = {
  Critical: Flame,
  High: ChevronsUp,
  Medium: Equal,
  Low: ChevronDown,
};

export const applicationIcon: Record<ApplicationStatus, LucideIcon> = {
  Saved: Bookmark,
  Preparing: PenLine,
  Applied: Send,
  Interviewing: MessagesSquare,
  Offer: Trophy,
  Rejected: CircleX,
  Ghosted: Ghost,
  Withdrawn: Undo2,
};

export const contactIcon: Record<ContactStatus, LucideIcon> = {
  'Not contacted': Circle,
  Drafted: PenLine,
  Sent: Send,
  Connected: Link2,
  Replied: MessageCircleReply,
  'Meeting scheduled': CalendarCheck,
  'Follow-up due': Clock,
  'No response': CircleSlash,
};

export const companyPriorityIcon: Record<CompanyPriority, LucideIcon> = {
  A: Star,
  B: CircleDot,
  C: Circle,
};

export const ossStageVariant: Record<OssStage, BadgeVariant> = {
  Shortlisted: 'muted',
  'Running locally': 'muted',
  'Issue claimed': 'info',
  'PR open': 'warning',
  'Changes requested': 'warning',
  Merged: 'success',
  Closed: 'error',
};

/** GitHub's own vocabulary, so the states read the way they do on the site. */
export const ossStageIcon: Record<OssStage, LucideIcon> = {
  Shortlisted: GitFork,
  'Running locally': Terminal,
  'Issue claimed': CircleDot,
  'PR open': GitPullRequestArrow,
  'Changes requested': GitPullRequestDraft,
  Merged: GitMerge,
  Closed: GitPullRequestClosed,
};

export const ossKindVariant: Record<OssKind, BadgeVariant> = {
  Docs: 'info',
  Tests: 'success',
  'Bug fix': 'warning',
  Feature: 'neutral',
  Triage: 'muted',
};

export const companyStatusIcon: Record<CompanyStatus, LucideIcon> = {
  Researching: CircleDashed,
  Applying: PenLine,
  Applied: Send,
  Interviewing: MessagesSquare,
  Rejected: CircleX,
  Offer: Trophy,
  Deprioritized: CircleSlash,
};

/** CSS class that carries the area's colour via the --area custom property. */
export function areaClass(area: Area | null): string {
  return area ? `area-${area.replace(/\s+/g, '')}` : '';
}
