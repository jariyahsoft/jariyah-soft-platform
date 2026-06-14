'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Save, Send } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { JOB_TYPES, WORK_MODES } from '@/lib/validators/job';

type SubmissionIntent = 'draft' | 'submit';

interface FormState {
  title: string;
  organization: string;
  description: string;
  jobType: string;
  workMode: string;
  location: string;
  skills: string;
  applicationURL: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  durationDays: string;
}

const defaultFormState: FormState = {
  title: '',
  organization: '',
  description: '',
  jobType: 'full_time',
  workMode: 'remote',
  location: '',
  skills: '',
  applicationURL: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'THB',
  durationDays: '30',
};

interface JobSubmissionFormProps {
  mode?: 'create' | 'edit';
  initialJob?: any;
}

export function JobSubmissionForm({ mode = 'create', initialJob }: JobSubmissionFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<FormState>(() => {
    if (initialJob) {
      return {
        title: initialJob.title || '',
        organization: initialJob.organization || '',
        description: initialJob.description || '',
        jobType: initialJob.jobType || 'full_time',
        workMode: initialJob.workMode || 'remote',
        location: initialJob.location || '',
        skills: initialJob.skills?.join(', ') || '',
        applicationURL: initialJob.applicationURL || '',
        salaryMin: initialJob.salaryRange?.min?.toString() || '',
        salaryMax: initialJob.salaryRange?.max?.toString() || '',
        salaryCurrency: initialJob.salaryRange?.currency || 'THB',
        durationDays: '30', // default to 30 days
      };
    }
    return defaultFormState;
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm(intent: SubmissionIntent) {
    if (!user) return;

    setError(null);
    setMessage(null);

    const token = await user.getIdToken();

    // Parse and validate skills
    const parsedSkills = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedSkills.length === 0) {
      throw new Error('Please enter at least one skill requirement.');
    }

    // Build expiresAt
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(form.durationDays, 10));

    // Construct request body
    const salaryMinVal = form.salaryMin ? parseInt(form.salaryMin, 10) : undefined;
    const salaryMaxVal = form.salaryMax ? parseInt(form.salaryMax, 10) : undefined;

    const payload: any = {
      title: form.title,
      organization: form.organization,
      description: form.description,
      jobType: form.jobType,
      workMode: form.workMode,
      location: form.location || undefined,
      skills: parsedSkills,
      applicationURL: form.applicationURL,
      expiresAt: expiryDate.toISOString(),
    };

    if (salaryMinVal !== undefined || salaryMaxVal !== undefined) {
      payload.salaryRange = {
        min: salaryMinVal,
        max: salaryMaxVal,
        currency: form.salaryCurrency,
      };
    }

    const isEdit = mode === 'edit' && initialJob?.id;
    const response = await fetch(isEdit ? `/api/v1/jobs/${initialJob.id}` : '/api/v1/jobs', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Unable to save job opportunity.');
    }

    const savedId = body?.data?.id ?? initialJob?.id;

    if (intent === 'submit' && savedId) {
      const submitResponse = await fetch(`/api/v1/jobs/${savedId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!submitResponse.ok) {
        const submitBody = await submitResponse.json().catch(() => null);
        throw new Error(submitBody?.error || 'Draft saved, but submission for review failed.');
      }
    }

    setMessage(intent === 'submit' ? 'Job submitted for review successfully.' : 'Job draft saved successfully.');
    router.push('/jobs');
  }

  function handleSubmit(intent: SubmissionIntent) {
    startTransition(async () => {
      try {
        await submitForm(intent);
      } catch (submitError: any) {
        setError(submitError.message || 'Unable to save job.');
      }
    });
  }

  if (guardLoading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Checking developer access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        Developer role is required to post job opportunities.
      </div>
    );
  }

  const canEdit = !initialJob || initialJob.status === 'draft' || initialJob.status === 'rejected';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant={mode === 'edit' ? 'warning' : 'info'}>{mode === 'edit' ? 'Edit Draft' : 'New Job'}</Badge>
        <h1 className="mt-3 text-3xl font-black">{mode === 'edit' ? 'Edit Job Posting' : 'Post a Job Opportunity'}</h1>
        <p className="mt-2 text-text-secondary text-sm md:text-base">
          Fill in details about the role, location, salary range, and candidate requirements. Drafts can be edited later.
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          This job is not editable because it has already been submitted or published.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Form Panel */}
        <div className="space-y-6 rounded-3xl border border-text-secondary/10 bg-bg-card p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Job Title"
              value={form.title}
              disabled={!canEdit}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Senior Fullstack Engineer"
              required
            />
            <Input
              label="Organization / Company"
              value={form.organization}
              disabled={!canEdit}
              onChange={(e) => updateField('organization', e.target.value)}
              placeholder="e.g. Jariyah Soft"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="job-description">
              Job Description & Requirements
            </label>
            <textarea
              id="job-description"
              value={form.description}
              disabled={!canEdit}
              rows={10}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              placeholder="Describe roles, day-to-day work, requirements, and qualifications..."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Job Type"
              value={form.jobType}
              disabled={!canEdit}
              options={JOB_TYPES.map((type) => ({
                value: type,
                label: type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              }))}
              onChange={(e) => updateField('jobType', e.target.value)}
            />
            <Select
              label="Work Mode"
              value={form.workMode}
              disabled={!canEdit}
              options={WORK_MODES.map((mode) => ({
                value: mode,
                label: mode.charAt(0).toUpperCase() + mode.slice(1),
              }))}
              onChange={(e) => updateField('workMode', e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Location"
              value={form.location}
              disabled={!canEdit}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g. Bangkok, Thailand (or leave blank if remote)"
            />
            <Input
              label="Skills Required"
              value={form.skills}
              disabled={!canEdit}
              onChange={(e) => updateField('skills', e.target.value)}
              placeholder="React, Node.js, TypeScript"
              helperText="Comma-separated tag list"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-end">
            <Input
              label="Min Salary (Optional)"
              type="number"
              value={form.salaryMin}
              disabled={!canEdit}
              onChange={(e) => updateField('salaryMin', e.target.value)}
              placeholder="e.g. 50000"
            />
            <Input
              label="Max Salary (Optional)"
              type="number"
              value={form.salaryMax}
              disabled={!canEdit}
              onChange={(e) => updateField('salaryMax', e.target.value)}
              placeholder="e.g. 80000"
            />
            <Select
              label="Currency"
              value={form.salaryCurrency}
              disabled={!canEdit}
              options={[
                { value: 'THB', label: 'THB (฿)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
              ]}
              onChange={(e) => updateField('salaryCurrency', e.target.value)}
            />
          </div>

          <Input
            label="Application Link"
            type="url"
            value={form.applicationURL}
            disabled={!canEdit}
            onChange={(e) => updateField('applicationURL', e.target.value)}
            placeholder="https://linkedin.com/jobs/... or https://forms.gle/..."
            helperText="Must be a valid HTTPS link to allowed job boards or form applications."
            required
          />
        </div>

        {/* Sidebar Controls */}
        <aside className="space-y-5">
          <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-5 space-y-4">
            <h2 className="font-bold text-text-primary">Posting Expiry</h2>
            <Select
              label="Listing Duration"
              value={form.durationDays}
              disabled={!canEdit}
              options={[
                { value: '30', label: '30 Days' },
                { value: '60', label: '60 Days' },
                { value: '90', label: '90 Days' },
              ]}
              onChange={(e) => updateField('durationDays', e.target.value)}
              helperText="How long the job posting remains active before auto-expiration."
            />
          </div>

          {/* Messages Banner */}
          {(message || error) && (
            <div
              className={`flex gap-3 rounded-2xl p-4 text-sm ${
                error ? 'bg-danger/10 text-danger border border-danger/15' : 'bg-success/10 text-success border border-success/15'
              }`}
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error ?? message}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              loading={isPending}
              disabled={!canEdit}
              onClick={() => handleSubmit('draft')}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={isPending}
              disabled={!canEdit}
              onClick={() => handleSubmit('submit')}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
