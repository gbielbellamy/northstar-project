import { addDays } from './dates';
import { BLANK_COMPANY, contactsFor } from './companies';
import { newId } from './ids';
import type { Application, Company, Contact } from '../types';

/**
 * Adds a company and its outreach targets for any application whose company
 * is missing. Matches on name case-insensitively, so nothing is duplicated.
 */
export function backfillCompanies(
  applications: Application[],
  companies: Company[],
  contacts: Contact[],
): { companies: Company[]; contacts: Contact[] } {
  const nextCompanies = [...companies];
  const nextContacts = [...contacts];
  const known = new Set(companies.map((c) => c.name.trim().toLowerCase()));
  const hasContacts = new Set(contacts.map((c) => c.company.trim().toLowerCase()));

  for (const a of applications) {
    const name = a.company.trim();
    const key = name.toLowerCase();
    if (!name) continue;

    if (!known.has(key)) {
      known.add(key);
      nextCompanies.push({
        ...BLANK_COMPANY,
        id: newId('co'),
        name,
        status: 'Applied',
        lastReviewed: a.dateApplied || '',
      });
    }
    if (!hasContacts.has(key)) {
      hasContacts.add(key);
      for (const c of contactsFor({ name, linkedinUrl: '' })) {
        nextContacts.push({ ...c, id: newId('ct') });
      }
    }
  }
  return { companies: nextCompanies, contacts: nextContacts };
}

/**
 * Re-books any follow-up dated on or before its own application, ten days
 * after it. Idempotent, so it can run on every load.
 */
export function repairFollowups(applications: Application[]): Application[] {
  return applications.map((a) => {
    if (!a.dateApplied || !a.followup) return a;
    if (a.followup > a.dateApplied) return a;
    return { ...a, followup: addDays(a.dateApplied, 10) };
  });
}
