import { softwareDraftSchema, softwareEditSchema } from '@/lib/validators/software';

describe('softwareDraftSchema', () => {
  it('accepts a valid software draft payload', () => {
    const result = softwareDraftSchema.safeParse({
      categoryId: 'developer-tools',
      description: 'A full software description for validation coverage.',
      downloadURL: 'https://example.com/download',
      licenseId: 'MIT',
      name: 'Thai Utility Suite',
      platforms: ['web', 'windows'],
      shortDescription: 'A clear short description for a software listing.',
      websiteURL: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.websiteURL).toBeUndefined();
    }
  });

  it('rejects invalid slugs, missing platforms, and non-https URLs', () => {
    const result = softwareDraftSchema.safeParse({
      categoryId: 'developer-tools',
      downloadURL: 'http://example.com/download',
      licenseId: 'MIT',
      name: 'Bad Software',
      platforms: [],
      shortDescription: 'Too few safeguards in this payload.',
      slug: 'Bad Slug',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.'));
      expect(fields).toEqual(expect.arrayContaining(['slug', 'platforms', 'downloadURL']));
    }
  });

  it('treats edit payloads as partial drafts', () => {
    const result = softwareEditSchema.safeParse({
      shortDescription: 'Editing only one allowed field in a draft.',
    });

    expect(result.success).toBe(true);
  });
});
