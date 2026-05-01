import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password', async () => {
    const pw = 'MySecure!Pass1';
    const hash = await hashPassword(pw);
    expect(hash).not.toBe(pw);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    await expect(verifyPassword(pw, hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('accepts a strong password', () => {
    const { valid, errors } = validatePasswordStrength('MySecure!Pass1');
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('rejects a short password', () => {
    const { valid, errors } = validatePasswordStrength('Short1!');
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('Mindestens'))).toBe(true);
  });

  it('rejects a password without uppercase', () => {
    const { valid } = validatePasswordStrength('nouppercase1!ab');
    expect(valid).toBe(false);
  });

  it('rejects a password without special character', () => {
    const { valid } = validatePasswordStrength('NoSpecial1ABCD');
    expect(valid).toBe(false);
  });

  it('rejects a password without a digit', () => {
    const { valid } = validatePasswordStrength('NoDigitHere!ABC');
    expect(valid).toBe(false);
  });
});
