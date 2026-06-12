import { articleDraftSchema, articleEditSchema } from '@/lib/validators/article';

describe('articleDraftSchema', () => {
  it('accepts valid article drafts and applies defaults', () => {
    const result = articleDraftSchema.safeParse({
      body: 'This article body is intentionally long enough to satisfy the validator minimum length.',
      categoryId: 'tutorials',
      excerpt: 'This excerpt is long enough to pass validation in the article draft schema.',
      title: 'How to Ship Better Articles',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('th');
      expect(result.data.tagIds).toEqual([]);
    }
  });

  it('rejects short titles, excerpts, and unsupported languages', () => {
    const result = articleDraftSchema.safeParse({
      body: 'short body',
      categoryId: '',
      excerpt: 'too short',
      language: 'jp',
      title: 'Nope',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'));
      expect(fields).toEqual(expect.arrayContaining(['title', 'excerpt', 'body', 'categoryId', 'language']));
    }
  });

  it('allows partial article edits', () => {
    const result = articleEditSchema.safeParse({
      title: 'Just updating the title',
    });

    expect(result.success).toBe(true);
  });
});
