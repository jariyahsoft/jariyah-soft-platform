import { reviewSchema } from '@/lib/validators/review';

describe('reviewSchema', () => {
  it('accepts valid review payloads', () => {
    const result = reviewSchema.safeParse({
      body: 'This software solved a real workflow problem for our team.',
      rating: 5,
    });

    expect(result.success).toBe(true);
  });

  it('rejects out-of-range ratings and short review bodies', () => {
    const result = reviewSchema.safeParse({
      body: 'Too short',
      rating: 6,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'));
      expect(fields).toEqual(expect.arrayContaining(['rating', 'body']));
    }
  });
});
