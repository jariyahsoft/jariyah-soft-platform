import { NextRequest } from 'next/server';
import { errorResponse, successResponse, ApiErrors } from '@/lib/api/response';
import { fetchGithubProfile, GITHUB_USERNAME_PATTERN, normalizeGithubUsername } from '@/lib/github/profile';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get('username') || '';
    const username = normalizeGithubUsername(rawUsername);

    if (!username || !GITHUB_USERNAME_PATTERN.test(username)) {
      return errorResponse(
        ApiErrors.VALIDATION_ERROR.code,
        'Validation failed',
        ApiErrors.VALIDATION_ERROR.status,
        [{ field: 'username', reason: 'Enter a valid GitHub username' }]
      );
    }

    const profile = await fetchGithubProfile(username);
    if (!profile) {
      return errorResponse(
        ApiErrors.NOT_FOUND.code,
        'GitHub profile not found',
        ApiErrors.NOT_FOUND.status,
        [{ field: 'username', reason: 'No public GitHub account was found for that username' }]
      );
    }

    return successResponse({
      verified: true,
      profile,
      suggestions: profile.repositories.map((repo) => repo.htmlUrl),
    });
  } catch (error) {
    console.error('Failed to verify GitHub profile:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to verify GitHub profile',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
}
