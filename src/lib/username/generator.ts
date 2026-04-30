import { prisma } from '@/lib/db/prisma';

const ADJECTIVES = [
  'Silver', 'Crimson', 'Velvet', 'Obsidian', 'Marble', 'Onyx',
  'Sterling', 'Platinum', 'Sapphire', 'Emerald', 'Ivory', 'Bronze',
  'Mercury', 'Cobalt', 'Amber', 'Pearl', 'Ruby', 'Jade', 'Topaz',
  'Midnight', 'Twilight', 'Aurora', 'Cosmic', 'Nebula', 'Quantum',
];

const NOUNS = [
  'Falcon', 'Stallion', 'Phoenix', 'Panther', 'Griffin', 'Raven',
  'Wolf', 'Tiger', 'Eagle', 'Lion', 'Jaguar', 'Cobra',
  'Hawk', 'Lynx', 'Stag', 'Boar', 'Bear', 'Fox',
  'Drake', 'Hydra', 'Sphinx', 'Pegasus', 'Centaur', 'Minotaur',
];

function generateCandidate(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
}

export async function generateUniqueUsername(): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generateCandidate();
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  // Fallback: add extra random suffix
  return `${generateCandidate()}${Math.floor(Math.random() * 100)}`;
}
