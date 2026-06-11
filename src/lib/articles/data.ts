import 'server-only';

import { cache } from 'react';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import {
  ARTICLE_CATEGORIES,
  ArticleItem,
} from '@/lib/articles/types';

interface ListArticlesOptions {
  category?: string;
  tag?: string;
  language?: string;
  author?: string;
  sort?: string;
  limit?: number;
}

const now = new Date().toISOString();

const sampleArticles: ArticleItem[] = [
  {
    id: 'sample-getting-started-digital-citizen',
    authorId: 'sample-dev',
    title: 'Getting Started with Digital Citizenship',
    slug: 'getting-started-digital-citizen',
    excerpt: 'A guide for Thai citizens navigating the digital world safely and responsibly.',
    body: `
# Getting Started with Digital Citizenship

In today's interconnected world, understanding how to navigate digital spaces safely is crucial. This guide covers the fundamentals every Thai citizen should know.

## Why Digital Citizenship Matters

Digital citizenship involves using technology responsibly and safely. Key principles include:

- **Respect**: Treat others online as you would in person
- **Educate**: Learn about digital rights and responsibilities
- **Protect**: Keep your personal information secure

## Essential Skills

Every digital citizen should master these core competencies...

## Resources

For more information, visit [relevant Thai digital literacy resources](https://example.com).
    `,
    contentType: 'markdown',
    categoryId: 'getting-started',
    categoryName: 'Getting Started',
    tagIds: ['digital-literacy', 'thailand'],
    tagNames: ['Digital Literacy', 'Thailand'],
    language: 'en',
    status: 'published',
    viewCount: 1240,
    authorName: 'Jariyah Labs',
    readingTimeMinutes: 5,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sample-thai-ai-development',
    authorId: 'sample-dev',
    title: 'เริ่มต้นการพัฒนา AI ด้วยภาษาไทย',
    slug: 'thai-ai-development',
    excerpt: 'คำแนะนำสำหรับนักพัฒนาที่ต้องการสร้างแอปพลิเคชัน AI ที่ทำงานกับข้อความภาษาไทย',
    body: `
# เริ่มต้นการพัฒนา AI ด้วยภาษาไทย

การพัฒนา AI ที่ทำงานกับภาษาไทยมีความท้าทายเฉพาะ

## ความสำคัญของการทำความเข้าใจภาษาไทย

ภาษาไทยมีลักษณะเป็นภาษาตัวอักษร (abugida) ซึ่งแตกต่างจากภาษาอังกฤษ

## เครื่องมือแนะนำ

- **PyThaiNLP**: ไลบรารีประมวลผลภาษาไทย
- **WangChanGLM**: โมเดลภาษาไทยขนาดใหญ่
    `,
    contentType: 'markdown',
    categoryId: 'tutorials',
    categoryName: 'Tutorials',
    tagIds: ['ai', 'thai', 'nlp'],
    tagNames: ['AI', 'Thai', 'NLP'],
    language: 'th',
    status: 'published',
    viewCount: 890,
    authorName: 'Jariyah Labs',
    readingTimeMinutes: 8,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

function timestampToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return undefined;
}

function resolveCategoryName(categoryId?: string): string {
  return ARTICLE_CATEGORIES.find((category) => category.id === categoryId)?.name ?? categoryId ?? 'General';
}

function toArticleItem(doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot): ArticleItem {
  const data = doc.data() ?? {};
  const createdAt = timestampToIso(data.createdAt);
  const updatedAt = timestampToIso(data.updatedAt);

  return {
    id: doc.id,
    authorId: data.authorId ?? '',
    title: data.title ?? 'Untitled article',
    slug: data.slug ?? doc.id,
    excerpt: data.excerpt ?? '',
    body: data.body ?? '',
    contentType: data.contentType ?? 'markdown',
    categoryId: data.categoryId ?? 'general',
    categoryName: data.categoryName ?? resolveCategoryName(data.categoryId),
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
    tagNames: Array.isArray(data.tagNames) ? data.tagNames : [],
    language: data.language ?? 'th',
    coverPath: data.coverPath,
    status: data.status ?? 'draft',
    viewCount: Number(data.viewCount ?? 0),
    authorName: data.authorName ?? 'Anonymous',
    authorPhotoURL: data.authorPhotoURL,
    publishedAt: timestampToIso(data.publishedAt),
    createdAt,
    updatedAt,
    readingTimeMinutes: data.readingTimeMinutes ?? Math.ceil((data.body?.length ?? 0) / 1000),
    rejectionReason: data.rejectionReason ?? data.moderationReason,
    etag: updatedAt ? `"${new Date(updatedAt).getTime()}"` : undefined,
  };
}

function sortArticles(items: ArticleItem[], sort = 'relevance') {
  return [...items].sort((a, b) => {
    if (sort === 'recency') {
      return new Date(b.publishedAt ?? b.updatedAt ?? 0).getTime() - new Date(a.publishedAt ?? a.updatedAt ?? 0).getTime();
    }
    return b.viewCount - a.viewCount;
  });
}

export const listPublishedArticles = cache(async (options: ListArticlesOptions = {}) => {
  const { category, tag, language, author, sort, limit = 24 } = options;

  try {
    let query: admin.firestore.Query = adminDb.collection('articles').where('status', '==', 'published');

    if (category) query = query.where('categoryId', '==', category);
    if (language) query = query.where('language', '==', language);
    if (author) query = query.where('authorId', '==', author);
    if (sort === 'recency') {
      query = query.orderBy('publishedAt', 'desc');
    } else {
      query = query.orderBy('viewCount', 'desc');
    }

    const snapshot = await query.limit(limit).get();
    let items = snapshot.docs.map(toArticleItem);

    if (tag) {
      items = items.filter((item) => item.tagIds.includes(tag));
    }

    return { items: sortArticles(items, sort), source: 'firestore' as const, error: null };
  } catch (error) {
    console.warn('Using sample articles fallback:', error);
    const filtered = sampleArticles.filter((item) => {
      return (
        (!category || item.categoryId === category) &&
        (!language || item.language === language) &&
        (!tag || item.tagIds.includes(tag))
      );
    });
    return { items: sortArticles(filtered, sort).slice(0, limit), source: 'sample' as const, error };
  }
});

export const getPublishedArticleBySlug = cache(async (slug: string) => {
  try {
    const directDoc = await adminDb.collection('articles').doc(slug).get();
    if (directDoc.exists && directDoc.data()?.status === 'published') {
      return toArticleItem(directDoc);
    }

    const snapshot = await adminDb
      .collection('articles')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    const firstDoc = snapshot.docs.at(0);
    if (firstDoc) return toArticleItem(firstDoc);
  } catch (error) {
    console.warn('Using sample article detail fallback:', error);
  }

  return sampleArticles.find((item) => item.slug === slug || item.id === slug) ?? null;
});

export const getArticlesByAuthor = cache(async (authorId: string, options: { status?: string; limit?: number } = {}) => {
  try {
    let query: admin.firestore.Query = adminDb.collection('articles').where('authorId', '==', authorId);

    if (options.status) {
      query = query.where('status', '==', options.status);
    }
    query = query.orderBy('updatedAt', 'desc').limit(options.limit ?? 20);

    const snapshot = await query.get();
    return snapshot.docs.map(toArticleItem);
  } catch (error) {
    console.warn('Error fetching author articles:', error);
    return sampleArticles.filter((item) => item.authorId === authorId);
  }
});