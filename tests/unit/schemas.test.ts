import {
  registerSchema,
  loginSchema,
  validateInviteSchema,
  createListingSchema,
  createInquirySchema,
} from '@/lib/validation/schemas';

describe('registerSchema', () => {
  const valid = { email: 'test@example.com', password: 'MySecure!Pass1', inviteCode: 'A3B4C5' };

  it('accepts valid input', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => registerSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });

  it('rejects weak password', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'weak' })).toThrow();
  });

  it('rejects wrong-length invite code', () => {
    expect(() => registerSchema.parse({ ...valid, inviteCode: 'AB12' })).toThrow();
  });

  it('normalises email to lowercase', () => {
    const result = registerSchema.parse({ ...valid, email: 'TEST@EXAMPLE.COM' });
    expect(result.email).toBe('test@example.com');
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => loginSchema.parse({ email: 'x@y.de', password: 'any' })).not.toThrow();
  });

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'x@y.de', password: '' })).toThrow();
  });
});

describe('validateInviteSchema', () => {
  it('accepts uppercase 6-char code', () => {
    expect(() => validateInviteSchema.parse({ code: 'A3B4C5' })).not.toThrow();
  });

  it('rejects 5-char code', () => {
    expect(() => validateInviteSchema.parse({ code: 'A3B4C' })).toThrow();
  });

  it('rejects ambiguous chars (0, O, 1, I)', () => {
    expect(() => validateInviteSchema.parse({ code: 'A3B401' })).toThrow();
  });
});

describe('createListingSchema', () => {
  const valid = {
    teaserTitle: 'Exklusives Objekt im Angebot',
    teaserDescription: 'Ein außergewöhnliches Objekt aus privatem Besitz.',
    teaserImageUrl: '/teaser-images/generic.jpg',
    category: 'VEHICLES' as const,
    title: 'Ferrari F40 — 1992',
    generalDescription: 'Dieses Objekt befindet sich in einem ausgezeichneten Zustand.',
    priceCurrency: 'EUR',
  };

  it('accepts a complete valid listing', () => {
    expect(() => createListingSchema.parse(valid)).not.toThrow();
  });

  it('rejects title shorter than 3 chars', () => {
    expect(() => createListingSchema.parse({ ...valid, title: 'AB' })).toThrow();
  });

  it('rejects invalid category', () => {
    expect(() => createListingSchema.parse({ ...valid, category: 'SPACESHIPS' })).toThrow();
  });

  it('accepts all valid categories', () => {
    const categories = ['VEHICLES', 'REAL_ESTATE', 'WATCHES_JEWELRY', 'ART_ANTIQUES', 'YACHTS_BOATS', 'AIRCRAFT', 'BUSINESS_EQUITY', 'OTHER'] as const;
    categories.forEach((category) => {
      expect(() => createListingSchema.parse({ ...valid, category })).not.toThrow();
    });
  });
});

describe('createInquirySchema', () => {
  const base = {
    type: 'GENERAL' as const,
    message: 'Ich interessiere mich für dieses Objekt und würde gerne mehr erfahren.',
    preferredContact: 'EMAIL' as const,
  };

  it('accepts a valid general inquiry', () => {
    expect(() => createInquirySchema.parse(base)).not.toThrow();
  });

  it('rejects a message shorter than 20 chars', () => {
    expect(() => createInquirySchema.parse({ ...base, message: 'Zu kurz' })).toThrow();
  });

  it('rejects an invalid phone format', () => {
    expect(() =>
      createInquirySchema.parse({ ...base, contactPhone: 'not a phone!!' })
    ).toThrow();
  });
});
