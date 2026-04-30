import { SignJWT, jwtVerify } from 'jose';

export type TokenPayload = {
  sub: string;
  role: 'user' | 'admin';
  sessionId: string;
  iat?: number;
  exp?: number;
};

function getSecret(key: string): Uint8Array {
  const secret = process.env[key];
  if (!secret) throw new Error(`Missing env var: ${key}`);
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret('JWT_ACCESS_SECRET'));
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret('JWT_REFRESH_SECRET'));
}

export async function signAdminToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getSecret('JWT_ADMIN_SECRET'));
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret('JWT_ACCESS_SECRET'));
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret('JWT_REFRESH_SECRET'));
  return payload as unknown as TokenPayload;
}

export async function verifyAdminToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret('JWT_ADMIN_SECRET'));
  return payload as unknown as TokenPayload;
}
