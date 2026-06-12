import { generateUniqueSlug, slugify } from '@/lib/utils/slug';

describe('slug helpers', () => {
  it('normalizes mixed case text into URL-safe slugs', () => {
    expect(slugify('  Thai Software Platform  ')).toBe('thai-software-platform');
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('generates unique slugs when collisions exist', () => {
    const taken = ['thai-software-platform', 'thai-software-platform-2'];

    expect(generateUniqueSlug('Thai Software Platform', taken)).toBe('thai-software-platform-3');
    expect(generateUniqueSlug('Fresh Idea', taken)).toBe('fresh-idea');
  });

  it('falls back to a stable base when the original title has no slug characters', () => {
    expect(generateUniqueSlug('!!!', [])).toBe('item');
  });
});
