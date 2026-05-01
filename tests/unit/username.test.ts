import { generateUniqueUsername } from '@/lib/username/generator';

// Mock Prisma so the test doesn't need a real DB
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

describe('generateUniqueUsername', () => {
  it('generates a username matching the expected pattern', async () => {
    const username = await generateUniqueUsername();
    // Pattern: [Adjective][Noun][4-digit number], e.g. "SilverFalcon4827"
    expect(username).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{4,}$/);
  });

  it('generates different usernames on repeated calls', async () => {
    const names = await Promise.all(Array.from({ length: 10 }, generateUniqueUsername));
    const unique = new Set(names);
    expect(unique.size).toBeGreaterThan(5);
  });
});
