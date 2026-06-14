import 'server-only';

export const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;

export function normalizeGithubUsername(username: string) {
  return username.trim().replace(/^@/, '').toLowerCase();
}

export interface GithubRepositorySuggestion {
  name: string;
  htmlUrl: string;
  description: string;
  language: string;
}

export interface GithubProfile {
  username: string;
  profileUrl: string;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  verifiedAt: string;
  repositories: GithubRepositorySuggestion[];
}

async function fetchGithubJson(path: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'JariyahSoft',
    },
    next: { revalidate: 600 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  return response.json();
}

export async function fetchGithubProfile(username: string): Promise<GithubProfile | null> {
  const normalized = normalizeGithubUsername(username);
  if (!normalized || !GITHUB_USERNAME_PATTERN.test(normalized)) {
    return null;
  }

  const user = await fetchGithubJson(`/users/${encodeURIComponent(normalized)}`);
  if (!user) {
    return null;
  }

  const repositories = await fetchGithubJson(
    `/users/${encodeURIComponent(normalized)}/repos?per_page=6&sort=updated&direction=desc`
  );

  return {
    username: normalized,
    profileUrl: String(user.html_url ?? `https://github.com/${normalized}`),
    avatarUrl: String(user.avatar_url ?? ''),
    name: user.name ? String(user.name) : null,
    bio: user.bio ? String(user.bio) : null,
    company: user.company ? String(user.company) : null,
    location: user.location ? String(user.location) : null,
    websiteUrl: user.blog ? String(user.blog) : null,
    followers: Number(user.followers ?? 0),
    following: Number(user.following ?? 0),
    publicRepos: Number(user.public_repos ?? 0),
    verifiedAt: new Date().toISOString(),
    repositories: Array.isArray(repositories)
      ? repositories.slice(0, 6).map((repo) => ({
          name: String(repo.name ?? ''),
          htmlUrl: String(repo.html_url ?? ''),
          description: repo.description ? String(repo.description) : '',
          language: repo.language ? String(repo.language) : '',
        }))
      : [],
  };
}
