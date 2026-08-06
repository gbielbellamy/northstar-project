import type { Company, Contact } from '../types';

export const BLANK_COMPANY: Omit<Company, 'id'> = {
  name: '',
  sector: '',
  size: '',
  location: '',
  workMode: '',
  priority: 'B',
  fitScore: 70,
  primaryRoles: '',
  secondaryRoles: '',
  whyItFits: '',
  stack: '',
  careersUrl: '',
  linkedinUrl: '',
  nextAction: '',
  status: 'Researching',
  lastReviewed: '',
  notes: '',
};

/** Every company needs a human behind it, so adding one seeds these two targets. */
export function contactsFor(
  company: Pick<Company, 'name' | 'linkedinUrl'>,
): Omit<Contact, 'id'>[] {
  const base = {
    company: company.name,
    person: '',
    status: 'Not contacted' as const,
    companyUrl: company.linkedinUrl,
    link: '',
    week: null,
    lastContact: '',
    dateSent: '',
    followup: '',
    meeting: '',
    nextAction: '',
    notes: '',
  };
  const search = (title: string) =>
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company.name} ${title}`)}`;

  return [
    {
      ...base,
      targetProfile: 'Technical Support / Solutions Engineer',
      contactType: 'Peer contact',
      searchUrl: search('Technical Support Solutions Engineer'),
      angle:
        'Ask about the day-to-day, the hiring bar, and whether the team hires people from non-traditional backgrounds.',
    },
    {
      ...base,
      targetProfile: 'Engineering Manager / Support Manager',
      contactType: 'Hiring influencer',
      searchUrl: search('Engineering Manager Support Manager'),
      angle: 'Share a short portfolio link and ask one specific question about what the team needs.',
    },
  ];
}
