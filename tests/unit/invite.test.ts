import { generateInviteCode, hashInviteCode, verifyInviteCode, getCodePrefix } from '@/lib/invite/generator';
import { INVITE_CODE_CHARSET, INVITE_CODE_LENGTH } from '@/lib/utils/constants';

describe('generateInviteCode', () => {
  it('generates a code of the correct length', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
  });

  it('only uses characters from the allowed charset', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateInviteCode();
      for (const char of code) {
        expect(INVITE_CODE_CHARSET).toContain(char);
      }
    }
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode));
    expect(codes.size).toBeGreaterThan(95);
  });
});

describe('hashInviteCode / verifyInviteCode', () => {
  it('hashes and verifies a code', async () => {
    const code = 'A3B4C5';
    const hash = await hashInviteCode(code);
    await expect(verifyInviteCode(code, hash)).resolves.toBe(true);
    await expect(verifyInviteCode('XXXXXX', hash)).resolves.toBe(false);
  });

  it('is case-insensitive', async () => {
    const hash = await hashInviteCode('a3b4c5');
    await expect(verifyInviteCode('A3B4C5', hash)).resolves.toBe(true);
  });
});

describe('getCodePrefix', () => {
  it('returns the first 2 chars uppercased', () => {
    expect(getCodePrefix('a3b4c5')).toBe('A3');
    expect(getCodePrefix('XY1234')).toBe('XY');
  });
});
