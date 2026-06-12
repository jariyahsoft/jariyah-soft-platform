import { NextRequest } from 'next/server';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { getTypesenseClient } from '@/lib/search/client';

export const dynamic = 'force-dynamic';

interface SearchHit {
  document: {
    id: string;
    title?: string;
    name?: string;
    excerpt?: string;
    shortDescription?: string;
    categoryName?: string;
    highlight?: string;
  };
}

async function searchFallback(q: string, limit: number = 20) {
  return {
    items: [],
    source: 'fallback',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 20);

    if (!q || q.length < 2) {
      return successResponse({ query: q, items: [] });
    }

    try {
      const client = getTypesenseClient();

      const searchParams_multi = {
        q,
        query_by: 'title,name,excerpt,shortDescription,tags,categoryName',
        highlight_full_fields: 'title,name,excerpt,shortDescription',
        limit,
        per_page: limit,
      };

      const softwareResults = await client.collections('software').documents().search(searchParams_multi);
      const articleResults = await client.collections('articles').documents().search(searchParams_multi);
      const developerResults = await client.collections('developers').documents().search(searchParams_multi);

      const allResults = [
        ...(softwareResults.hits ?? []).map((hit: SearchHit) => ({
          id: hit.document.id,
          title: hit.document.name,
          excerpt: hit.document.shortDescription,
          categoryName: hit.document.categoryName,
          type: 'software' as const,
        })),
        ...(articleResults.hits ?? []).map((hit: SearchHit) => ({
          id: hit.document.id,
          title: hit.document.title,
          excerpt: hit.document.excerpt,
          categoryName: hit.document.categoryName,
          type: 'article' as const,
        })),
      ];

      return successResponse({ query: q, items: allResults });
    } catch (searchError) {
      console.warn('Typesense search failed, using fallback:', searchError);
      return successResponse({ ...searchFallback(q, 5), query: q });
    }
  } catch (error) {
    console.error('Error in search:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Search failed', ApiErrors.INTERNAL_ERROR.status);
  }
}