export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(value: string, takenSlugs: Iterable<string>): string {
  const normalizedBase = slugify(value) || 'item';
  const reserved = new Set(takenSlugs);

  if (!reserved.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase}-${suffix}`;

  while (reserved.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}-${suffix}`;
  }

  return candidate;
}
