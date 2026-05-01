import { signAccessToken, verifyAccessToken, signAdminToken, verifyAdminToken } from '@/lib/auth/jwt';

// Set required env vars before tests
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-for-hs256';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-for-hs256';
  process.env.JWT_ADMIN_SECRET = 'test-admin-secret-that-is-long-enough-for-hs256';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
});

describe('signAccessToken / verifyAccessToken', () => {
  const payload = { sub: 'user-123', role: 'user' as const, sessionId: 'sess-abc' };

  it('signs and verifies an access token', async () => {
    const token = await signAccessToken(payload);
    expect(typeof token).toBe('string');
    const decoded = await verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.sessionId).toBe(payload.sessionId);
  });

  it('throws on a tampered token', async () => {
    const token = await signAccessToken(payload);
    const tampered = token.slice(0, -3) + 'xxx';
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });
});

describe('signAdminToken / verifyAdminToken', () => {
  const payload = { sub: 'admin-456', role: 'admin' as const, sessionId: 'sess-xyz' };

  it('signs and verifies an admin token', async () => {
    const token = await signAdminToken(payload);
    const decoded = await verifyAdminToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejects an admin token verified as access token', async () => {
    const token = await signAdminToken(payload);
    // Admin secret ≠ access secret → should fail
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});
