import type {
  Area,
  ApplicationStatus,
  CompanyPriority,
  ContactStatus,
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

/** CSS class that carries the area's colour via the --area custom property. */
export function areaClass(area: Area | null): string {
  return area ? `area-${area.replace(/\s+/g, '')}` : '';
}
