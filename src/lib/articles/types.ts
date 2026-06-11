export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'suspended' | 'archived';

export interface ArticleItem {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  contentType: string;
  categoryId: string;
  categoryName: string;
  tagIds: string[];
  tagNames: string[];
  language: string;
  coverPath?: string;
  status: ArticleStatus;
  viewCount: number;
  authorName: string;
  authorPhotoURL?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  readingTimeMinutes?: number;
  rejectionReason?: string;
  etag?: string;
}

export interface ArticleCategory {
  id: string;
  slug: string;
  name: string;
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: 'getting-started', slug: 'getting-started', name: 'Getting Started' },
  { id: 'tutorials', slug: 'tutorials', name: 'Tutorials' },
  { id: 'best-practices', slug: 'best-practices', name: 'Best Practices' },
  { id: 'case-studies', slug: 'case-studies', name: 'Case Studies' },
  { id: 'news', slug: 'news', name: 'News' },
];