'use client';

import { ChangeEvent, useEffect, useState, useTransition } from 'react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { AlertCircle, CheckCircle2, ImagePlus, Save, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { storage } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/knowledge/MarkdownRenderer';
import { ARTICLE_CATEGORIES } from '@/lib/articles/types';
import { ArticleItem } from '@/lib/articles/types';

type SubmissionIntent = 'draft' | 'submit';

interface ArticleSubmissionFormProps {
  mode?: 'create' | 'edit';
  initialArticle?: ArticleItem;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  categoryId: string;
  tagIds: string;
  language: string;
  coverPath: string;
}

const defaultFormState: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  categoryId: ARTICLE_CATEGORIES[0]?.id ?? 'getting-started',
  tagIds: '',
  language: 'th',
  coverPath: '',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ArticleSubmissionForm({ mode = 'create', initialArticle }: ArticleSubmissionFormProps) {
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultFormState,
    ...initialArticle,
    tagIds: initialArticle?.tagNames?.join(', ') ?? '',
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (form.title && !form.slug && initialArticle?.slug === form.slug) {
      setForm((current) => ({ ...current, slug: slugify(form.title) }));
    }
  }, [form.title, form.slug, initialArticle]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function validateAndUpload(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Cover image must be JPEG, PNG, or WebP.');
    }

    if (file.size > maxBytes) {
      throw new Error('Cover image is larger than the 10 MB limit.');
    }

    if (!user) throw new Error('You must be signed in to upload files.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `articles/${user.uid}/${Date.now()}-${safeName}`;
    const uploadRef = ref(storage, path);
    const task = uploadBytesResumable(uploadRef, file, { contentType: file.type });

    return new Promise<string>((resolve, reject) => {
      task.on(
        'state_changed',
        () => {},
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const url = await validateAndUpload(file);
      updateField('coverPath', url);
      setMessage('Cover image uploaded successfully.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Cover upload failed.');
    }
  }

  async function submitForm(intent: SubmissionIntent) {
    if (!user) return;

    setError(null);
    setMessage(null);

    const token = await user.getIdToken();
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      tagIds: form.tagIds
        .split(',')
        .map((tag) => slugify(tag))
        .filter(Boolean),
    };

    const isEdit = mode === 'edit' && initialArticle?.id;
    const response = await fetch(isEdit ? `/api/v1/articles/${initialArticle.id}` : '/api/v1/articles', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${intent}-${user.uid}-${Date.now()}`,
        ...(isEdit ? { 'If-Match': initialArticle.etag ?? '*' } : {}),
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error?.message ?? 'Unable to save article.');
    }

    if (intent === 'submit' && !isEdit) {
      const savedId = body?.data?.id;
      if (savedId) {
        const submitResponse = await fetch(`/api/v1/articles/${savedId}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!submitResponse.ok) {
          const submitBody = await submitResponse.json().catch(() => null);
          throw new Error(submitBody?.error?.message ?? 'Draft saved, but submit for review failed.');
        }
      }
    }

    setMessage(intent === 'submit' ? 'Submitted for review.' : 'Draft saved.');
  }

  function handleSubmit(intent: SubmissionIntent) {
    startTransition(async () => {
      try {
        await submitForm(intent);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to save article.');
      }
    });
  }

  if (guardLoading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Checking developer access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        Developer role is required to submit articles.
      </div>
    );
  }

  const canEdit = !initialArticle || initialArticle.status === 'draft' || initialArticle.status === 'rejected';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant={mode === 'edit' ? 'warning' : 'info'}>
          {mode === 'edit' ? 'Edit draft' : 'New article'}
        </Badge>
        <h1 className="mt-3 text-3xl font-black">
          {mode === 'edit' ? 'Edit article submission' : 'Submit article'}
        </h1>
        <p className="mt-2 text-text-secondary">
          Write your article in Markdown, preview the rendered output, and submit when ready.
        </p>
      </div>

      {initialArticle?.status === 'rejected' && (
        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
          Rejection reason: {initialArticle.rejectionReason ?? 'Please review moderator notes before resubmitting.'}
        </div>
      )}

      <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-5">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 text-sm font-semibold rounded ${
              !showPreview ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 text-sm font-semibold rounded ${
              showPreview ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            Preview
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Title"
            value={form.title}
            disabled={!canEdit}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            disabled={!canEdit}
            placeholder={slugify(form.title)}
            helperText="Lowercase URL slug. Leave blank to generate from title."
            onChange={(e) => updateField('slug', e.target.value)}
          />
        </div>

        <Input
          label="Excerpt"
          value={form.excerpt}
          disabled={!canEdit}
          maxLength={240}
          helperText="Brief summary shown in article cards."
          onChange={(e) => updateField('excerpt', e.target.value)}
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Category"
            value={form.categoryId}
            disabled={!canEdit}
            options={ARTICLE_CATEGORIES.map((category) => ({ value: category.id, label: category.name }))}
            onChange={(e) => updateField('categoryId', e.target.value)}
          />
          <Select
            label="Language"
            value={form.language}
            disabled={!canEdit}
            options={[
              { value: 'th', label: 'ไทย (Thai)' },
              { value: 'en', label: 'English' },
            ]}
            onChange={(e) => updateField('language', e.target.value)}
          />
        </div>

        <Input
          label="Tags"
          value={form.tagIds}
          disabled={!canEdit}
          helperText="Comma-separated tags, up to 20."
          onChange={(e) => updateField('tagIds', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="article-body">
            Body (Markdown)
          </label>
          <textarea
            id="article-body"
            value={form.body}
            disabled={!canEdit}
            rows={15}
            onChange={(e) => updateField('body', e.target.value)}
            className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary font-mono outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            placeholder="Write your article content in Markdown..."
          />
        </div>

        {showPreview && (
          <div className="mt-6 pt-6 border-t border-text-secondary/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Preview</h3>
            <MarkdownRenderer content={form.body || '*Nothing to preview yet.*'} />
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
        <h2 className="font-bold mb-2">Cover image</h2>
        <p className="text-sm text-text-secondary">JPEG, PNG, or WebP. Max 10 MB.</p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-text-secondary/25 bg-bg-secondary p-6 text-center">
          {form.coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverPath} alt="Cover preview" className="h-32 w-full rounded-xl object-cover" />
          ) : (
            <ImagePlus className="h-10 w-10 text-text-secondary" />
          )}
          <span className="mt-3 text-sm font-semibold">Choose cover image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={!canEdit}
            onChange={handleCoverChange}
          />
        </label>
      </aside>

      {(message || error) && (
        <div
          className={`flex gap-3 rounded-2xl p-4 text-sm ${
            error ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
          }`}
        >
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{error ?? message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" loading={isPending} disabled={!canEdit} onClick={() => handleSubmit('draft')}>
          <Save className="mr-2 h-4 w-4" />
          Save draft
        </Button>
        <Button type="button" loading={isPending} disabled={!canEdit} onClick={() => handleSubmit('submit')}>
          <Send className="mr-2 h-4 w-4" />
          Submit for review
        </Button>
      </div>
    </div>
  );
}