import { AppError, UnauthorizedError, NotFoundError, RateLimitError, ConflictError, handleApiError } from '@/lib/utils/errors';
import { ZodError } from 'zod';

describe('Custom error classes', () => {
  it('AppError has correct statusCode and code', () => {
    const e = new AppError('test', 400, 'TEST');
    expect(e.message).toBe('test');
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe('TEST');
  });

  it('UnauthorizedError defaults to 401', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it('NotFoundError defaults to 404', () => {
    expect(new NotFoundError().statusCode).toBe(404);
  });

  it('RateLimitError defaults to 429', () => {
    expect(new RateLimitError().statusCode).toBe(429);
  });

  it('ConflictError defaults to 409', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });
});

describe('handleApiError', () => {
  it('returns correct status for AppError', async () => {
    const res = handleApiError(new NotFoundError('Nicht gefunden'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Nicht gefunden');
  });

  it('returns 422 for ZodError', async () => {
    const { z } = await import('zod');
    let zodErr: ZodError | null = null;
    try {
      z.string().min(10).parse('short');
    } catch (e) {
      zodErr = e as ZodError;
    }
    const res = handleApiError(zodErr!);
    expect(res.status).toBe(422);
  });

  it('returns 500 for unknown errors', () => {
    const res = handleApiError(new Error('oops'));
    expect(res.status).toBe(500);
  });
});
