import { describe, expect, it } from 'vitest';
import { $Enums } from '../../generated/prisma/index.js';
import * as enums from './enums.js';

/**
 * The identifiers are derived, not typed out, so this checks the derivation
 * still matches what Prisma generates. Rename a value in the schema and this
 * fails, rather than the routes throwing at runtime.
 */
function check<T extends string>(
  name: string,
  mapper: { toDb: (v: T) => string; fromDb: (v: string) => T },
  prismaEnum: Record<string, string>,
) {
  describe(name, () => {
    it('matches the generated client', () => {
      const generated = Object.values(prismaEnum).sort();
      const derived = Object.keys(prismaEnum)
        .map((k) => mapper.toDb(mapper.fromDb(k)))
        .sort();
      expect(derived).toEqual(generated);
    });

    it('round-trips every value', () => {
      for (const identifier of Object.values(prismaEnum)) {
        expect(mapper.toDb(mapper.fromDb(identifier))).toBe(identifier);
      }
    });
  });
}

describe('enum mapping', () => {
  check('ApplicationStatus', enums.applicationStatus, $Enums.ApplicationStatus);
  check('RoleFamily', enums.roleFamily, $Enums.RoleFamily);
  check('ContactStatus', enums.contactStatus, $Enums.ContactStatus);
  check('ContactType', enums.contactType, $Enums.ContactType);
  check('CompanyPriority', enums.companyPriority, $Enums.CompanyPriority);
  check('CompanyStatus', enums.companyStatus, $Enums.CompanyStatus);

  it('rejects a value that is not in the set', () => {
    expect(enums.applicationStatus.has('Nonsense')).toBe(false);
    expect(enums.applicationStatus.has('Applied')).toBe(true);
  });
});
