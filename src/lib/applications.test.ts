import { describe, expect, it } from 'vitest';
import { backfillCompanies, repairFollowups } from './applications';
import { BLANK_COMPANY } from './companies';
import type { Application, Company, Contact } from '../types';

function app(extra: Partial<Application> = {}): Application {
  return {
    id: `ap-${Math.random()}`,
    company: 'Acme',
    role: 'Developer',
    family: '',
    status: 'Applied',
    url: '',
    location: '',
    salary: '',
    week: 1,
    dateFound: '',
    deadline: '',
    dateApplied: '2026-08-03',
    followup: '',
    interviewStage: '',
    resumeVersion: '',
    contact: '',
    nextAction: '',
    result: '',
    notes: '',
    ...extra,
  };
}

function company(name: string): Company {
  return { ...BLANK_COMPANY, id: `co-${name}`, name };
}

function contact(companyName: string): Contact {
  return {
    id: `ct-${companyName}`,
    company: companyName,
    person: '',
    targetProfile: '',
    contactType: 'Peer contact',
    status: 'Not contacted',
    searchUrl: '',
    companyUrl: '',
    link: '',
    angle: '',
    week: null,
    lastContact: '',
    dateSent: '',
    followup: '',
    meeting: '',
    nextAction: '',
    notes: '',
  };
}

describe('repairFollowups', () => {
  it('re-books a follow-up that lands before its own application', () => {
    const [fixed] = repairFollowups([
      app({ dateApplied: '2026-08-03', followup: '2026-07-28' }),
    ]);
    expect(fixed.followup).toBe('2026-08-13');
  });

  it('re-books one that lands on the same day', () => {
    // Same-day is not a follow-up.
    const [fixed] = repairFollowups([
      app({ dateApplied: '2026-08-03', followup: '2026-08-03' }),
    ]);
    expect(fixed.followup).toBe('2026-08-13');
  });

  it('leaves a sensible follow-up alone', () => {
    const [same] = repairFollowups([app({ dateApplied: '2026-08-03', followup: '2026-08-20' })]);
    expect(same.followup).toBe('2026-08-20');
  });

  it('leaves an application with no follow-up alone', () => {
    const [same] = repairFollowups([app({ followup: '' })]);
    expect(same.followup).toBe('');
  });

  it('leaves one that has not been sent alone', () => {
    const [same] = repairFollowups([app({ dateApplied: '', followup: '2026-07-01' })]);
    expect(same.followup).toBe('2026-07-01');
  });

  it('is idempotent — it runs on every load', () => {
    const once = repairFollowups([app({ dateApplied: '2026-08-03', followup: '2026-07-28' })]);
    const twice = repairFollowups(once);
    expect(twice).toEqual(once);
  });

  it('does not mutate what it was given', () => {
    const original = app({ dateApplied: '2026-08-03', followup: '2026-07-28' });
    repairFollowups([original]);
    expect(original.followup).toBe('2026-07-28');
  });
});

describe('backfillCompanies', () => {
  it('adds a company you applied to but never listed', () => {
    const { companies } = backfillCompanies([app({ company: 'Globex' })], [], []);
    expect(companies.map((c) => c.name)).toEqual(['Globex']);
    expect(companies[0].status).toBe('Applied');
  });

  it('dates the company from the application', () => {
    const { companies } = backfillCompanies(
      [app({ company: 'Globex', dateApplied: '2026-08-04' })],
      [],
      [],
    );
    expect(companies[0].lastReviewed).toBe('2026-08-04');
  });

  it('gives every new company someone to contact', () => {
    const { contacts } = backfillCompanies([app({ company: 'Globex' })], [], []);
    expect(contacts).toHaveLength(2);
    expect(contacts.map((c) => c.contactType)).toEqual(['Peer contact', 'Hiring influencer']);
  });

  it('leaves a company that is already listed alone', () => {
    const { companies } = backfillCompanies(
      [app({ company: 'Acme' })],
      [company('Acme')],
      [contact('Acme')],
    );
    expect(companies).toHaveLength(1);
  });

  it('matches on name regardless of case or stray spaces', () => {
    const { companies, contacts } = backfillCompanies(
      [app({ company: '  acme  ' })],
      [company('Acme')],
      [contact('Acme')],
    );
    expect(companies).toHaveLength(1);
    expect(contacts).toHaveLength(1);
  });

  it('does not duplicate when two applications share a company', () => {
    const { companies, contacts } = backfillCompanies(
      [app({ company: 'Globex' }), app({ company: 'Globex', role: 'Another role' })],
      [],
      [],
    );
    expect(companies).toHaveLength(1);
    expect(contacts).toHaveLength(2);
  });

  it('seeds contacts for a listed company that has none', () => {
    const { contacts } = backfillCompanies([app({ company: 'Acme' })], [company('Acme')], []);
    expect(contacts).toHaveLength(2);
  });

  it('ignores a blank company name', () => {
    const { companies, contacts } = backfillCompanies([app({ company: '   ' })], [], []);
    expect(companies).toHaveLength(0);
    expect(contacts).toHaveLength(0);
  });

  it('does not mutate the arrays it was given', () => {
    const companies: Company[] = [];
    const contacts: Contact[] = [];
    backfillCompanies([app({ company: 'Globex' })], companies, contacts);
    expect(companies).toHaveLength(0);
    expect(contacts).toHaveLength(0);
  });
});
