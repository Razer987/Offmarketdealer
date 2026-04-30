import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Nicht autorisiert') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Zugriff verweigert') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Nicht gefunden') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Zu viele Anfragen. Bitte warten.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Konflikt') {
    super(message, 409, 'CONFLICT');
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  console.error('Unhandled API error:', error);
  return NextResponse.json(
    { error: 'Interner Serverfehler' },
    { status: 500 }
  );
}
