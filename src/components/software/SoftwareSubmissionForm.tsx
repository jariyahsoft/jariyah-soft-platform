'use client';

import { ChangeEvent, DragEvent, useEffect, useState, useTransition } from 'react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { AlertCircle, CheckCircle2, ImagePlus, Save, Send, UploadCloud } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { storage } from '@/lib/firebase/config';
import { slugify } from '@/lib/utils/slug';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  PLATFORM_LABELS,
  SOFTWARE_CATEGORIES,
  SOFTWARE_LICENSES,
  SoftwareItem,
} from '@/lib/software/types';

type SubmissionIntent = 'draft' | 'submit';

interface SoftwareSubmissionFormProps {
  mode?: 'create' | 'edit';
  initialSoftware?: SoftwareItem;
}

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  tagIds: string;
  platforms: string[];
  licenseId: string;
  repositoryURL: string;
  websiteURL: string;
  downloadURL: string;
  logoPath: string;
  screenshotPaths: string[];
  fileSize: string;
}

const defaultFormState: FormState = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryId: SOFTWARE_CATEGORIES[0]?.id ?? 'productivity',
  tagIds: '',
  platforms: ['web'],
  licenseId: SOFTWARE_LICENSES[0]?.id ?? 'MIT',
  repositoryURL: '',
  websiteURL: '',
  downloadURL: '',
  logoPath: '',
  screenshotPaths: [],
  fileSize: '',
};

function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(image.src);
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

export function SoftwareSubmissionForm({ mode = 'create', initialSoftware }: SoftwareSubmissionFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultFormState,
    ...initialSoftware,
    tagIds: initialSoftware?.tagIds.join(', ') ?? '',
    repositoryURL: initialSoftware?.repositoryURL ?? '',
    websiteURL: initialSoftware?.websiteURL ?? '',
    downloadURL: initialSoftware?.downloadURL ?? '',
    logoPath: initialSoftware?.logoPath ?? '',
    screenshotPaths: initialSoftware?.screenshotPaths ?? [],
    fileSize: initialSoftware?.fileSize ?? '',
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty || !user) return;

    const timer = window.setInterval(() => {
      setMessage('Draft auto-saved locally. Use Save draft to sync it to the server.');
    }, 30000);

    return () => window.clearInterval(timer);
  }, [dirty, user]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  async function validateAndUpload(file: File, kind: 'logo' | 'screenshot') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = kind === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`${file.name} must be JPEG, PNG, or WebP.`);
    }

    if (file.size > maxBytes) {
      throw new Error(`${file.name} is larger than the ${kind === 'logo' ? '5 MB' : '10 MB'} limit.`);
    }

    if (kind === 'logo') {
      const dimensions = await imageDimensions(file);
      if (Math.abs(dimensions.width - dimensions.height) > 2) {
        throw new Error('Logo must use a 1:1 aspect ratio.');
      }
    }

    if (!user) throw new Error('You must be signed in to upload files.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `software/${user.uid}/${Date.now()}-${safeName}`;
    const uploadRef = ref(storage, path);
    const task = uploadBytesResumable(uploadRef, file, { contentType: file.type });

    return new Promise<string>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress((current) => ({
            ...current,
            [file.name]: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          }));
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const url = await validateAndUpload(file, 'logo');
      updateField('logoPath', url);
      setMessage('Logo uploaded successfully.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Logo upload failed.');
    }
  }

  async function handleScreenshots(files: FileList | File[]) {
    try {
      setError(null);
      const uploaded = await Promise.all(Array.from(files).map((file) => validateAndUpload(file, 'screenshot')));
      updateField('screenshotPaths', [...form.screenshotPaths, ...uploaded].slice(0, 8));
      setMessage('Screenshots uploaded successfully.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Screenshot upload failed.');
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      void handleScreenshots(event.dataTransfer.files);
    }
  }

  async function submitForm(intent: SubmissionIntent) {
    if (!user) return;

    setError(null);
    setMessage(null);

    const token = await user.getIdToken();
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      tagIds: form.tagIds
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const isEdit = mode === 'edit' && initialSoftware?.id;
    const response = await fetch(isEdit ? `/api/v1/software/${initialSoftware.id}` : '/api/v1/software', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${intent}-${user.uid}-${Date.now()}`,
        ...(isEdit ? { 'If-Match': initialSoftware.etag ?? '*' } : {}),
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error?.message ?? 'Unable to save software.');
    }

    const savedId = body?.data?.id ?? initialSoftware?.id;

    if (intent === 'submit' && savedId) {
      const submitResponse = await fetch(`/api/v1/software/${savedId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!submitResponse.ok) {
        const submitBody = await submitResponse.json().catch(() => null);
        throw new Error(submitBody?.error?.message ?? 'Draft saved, but submit for review failed.');
      }
    }

    setDirty(false);
    setMessage(intent === 'submit' ? 'Submitted for review.' : 'Draft saved.');
    router.push('/dashboard/software');
  }

  function handleSubmit(intent: SubmissionIntent) {
    startTransition(async () => {
      try {
        await submitForm(intent);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to save software.');
      }
    });
  }

  if (guardLoading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Checking developer access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        Developer role is required to submit software.
      </div>
    );
  }

  const canEdit = !initialSoftware || initialSoftware.status === 'draft' || initialSoftware.status === 'rejected';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant={mode === 'edit' ? 'warning' : 'info'}>{mode === 'edit' ? 'Edit draft' : 'New software'}</Badge>
        <h1 className="mt-3 text-3xl font-black">{mode === 'edit' ? 'Edit software submission' : 'Submit software'}</h1>
        <p className="mt-2 text-text-secondary">
          Save early, upload media with validation, and submit when the core details are ready.
        </p>
      </div>

      {initialSoftware?.status === 'rejected' && (
        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
          Rejection reason: {initialSoftware.rejectionReason ?? 'Please review moderator notes before resubmitting.'}
        </div>
      )}

      {!canEdit && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          This software is not editable because it is already submitted or published.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-3xl border border-text-secondary/10 bg-bg-card p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" value={form.name} disabled={!canEdit} onChange={(e) => updateField('name', e.target.value)} required />
            <Input
              label="Slug"
              value={form.slug}
              disabled={!canEdit}
              placeholder={slugify(form.name)}
              helperText="Lowercase URL slug. Leave blank to generate from name."
              onChange={(e) => updateField('slug', e.target.value)}
            />
          </div>

          <Input
            label="Short description"
            value={form.shortDescription}
            disabled={!canEdit}
            maxLength={240}
            onChange={(e) => updateField('shortDescription', e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="software-description">
              Description (Markdown)
            </label>
            <textarea
              id="software-description"
              value={form.description}
              disabled={!canEdit}
              rows={10}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              placeholder="Explain what it does, who it helps, and how to get started."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Category"
              value={form.categoryId}
              disabled={!canEdit}
              options={SOFTWARE_CATEGORIES.map((category) => ({ value: category.id, label: category.name }))}
              onChange={(e) => updateField('categoryId', e.target.value)}
            />
            <Select
              label="License"
              value={form.licenseId}
              disabled={!canEdit}
              options={SOFTWARE_LICENSES.map((license) => ({ value: license.id, label: license.name }))}
              onChange={(e) => updateField('licenseId', e.target.value)}
            />
          </div>

          <Input
            label="Tags"
            value={form.tagIds}
            disabled={!canEdit}
            helperText="Comma-separated tags, up to 20."
            onChange={(e) => updateField('tagIds', e.target.value)}
          />

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-text-primary/80">Platforms</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => {
                const checked = form.platforms.includes(value);
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold ${
                      checked ? 'border-accent bg-accent/10 text-accent' : 'border-text-secondary/15 bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canEdit}
                      onChange={(e) => {
                        updateField(
                          'platforms',
                          e.target.checked
                            ? [...form.platforms, value]
                            : form.platforms.filter((platform) => platform !== value)
                        );
                      }}
                      className="sr-only"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Repository URL" type="url" value={form.repositoryURL} disabled={!canEdit} onChange={(e) => updateField('repositoryURL', e.target.value)} placeholder="https://github.com/..." />
            <Input label="Website URL" type="url" value={form.websiteURL} disabled={!canEdit} onChange={(e) => updateField('websiteURL', e.target.value)} placeholder="https://..." />
            <Input label="Download URL" type="url" value={form.downloadURL} disabled={!canEdit} onChange={(e) => updateField('downloadURL', e.target.value)} placeholder="https://..." />
            <Input label="File size" value={form.fileSize} disabled={!canEdit} onChange={(e) => updateField('fileSize', e.target.value)} placeholder="48 MB or Web app" />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
            <h2 className="font-bold">Logo upload</h2>
            <p className="mt-1 text-sm text-text-secondary">JPEG, PNG, or WebP. Max 5 MB. 1:1 aspect ratio.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-text-secondary/25 bg-bg-secondary p-6 text-center">
              {form.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoPath} alt="Logo preview" className="h-24 w-24 rounded-2xl object-cover" />
              ) : (
                <ImagePlus className="h-10 w-10 text-text-secondary" />
              )}
              <span className="mt-3 text-sm font-semibold">Choose logo</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!canEdit} onChange={handleLogoChange} />
            </label>
          </div>

          <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
            <h2 className="font-bold">Screenshots</h2>
            <p className="mt-1 text-sm text-text-secondary">Up to 8 images, 10 MB each. Drag and drop supported.</p>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-text-secondary/25 bg-bg-secondary p-6 text-center"
            >
              <UploadCloud className="h-10 w-10 text-text-secondary" />
              <span className="mt-3 text-sm font-semibold">Upload screenshots</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={!canEdit}
                onChange={(event) => event.target.files && handleScreenshots(event.target.files)}
              />
            </label>
            {form.screenshotPaths.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {form.screenshotPaths.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="Screenshot preview" className="aspect-video rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>

          {Object.entries(uploadProgress).length > 0 && (
            <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5">
              <h2 className="font-bold">Upload progress</h2>
              <div className="mt-3 space-y-3">
                {Object.entries(uploadProgress).map(([name, progress]) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span className="truncate">{name}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-bg-secondary">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(message || error) && (
            <div className={`flex gap-3 rounded-2xl p-4 text-sm ${error ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
              <span>{error ?? message}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button type="button" variant="secondary" loading={isPending} disabled={!canEdit} onClick={() => handleSubmit('draft')}>
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button type="button" loading={isPending} disabled={!canEdit} onClick={() => handleSubmit('submit')}>
              <Send className="mr-2 h-4 w-4" />
              Submit for review
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
