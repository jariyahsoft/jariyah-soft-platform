'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { INCUBATOR_STAGES } from '@/lib/validators/incubator';

interface ProjectSubmissionFormProps {
  mode?: 'create' | 'edit';
  initialProject?: any;
}

interface FormState {
  name: string;
  description: string;
  stage: string;
  repositoryURL: string;
  skillNeeds: string;
}

const defaultFormState: FormState = {
  name: '',
  description: '',
  stage: 'idea',
  repositoryURL: '',
  skillNeeds: '',
};

export function ProjectSubmissionForm({ mode = 'create', initialProject }: ProjectSubmissionFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<FormState>(() => {
    if (initialProject) {
      return {
        name: initialProject.name || '',
        description: initialProject.description || '',
        stage: initialProject.stage || 'idea',
        repositoryURL: initialProject.repositoryURL || '',
        skillNeeds: initialProject.skillNeeds?.join(', ') || '',
      };
    }
    return defaultFormState;
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm() {
    if (!user) return;

    setError(null);
    setMessage(null);

    const token = await user.getIdToken();

    // Validate and parse skill needs
    const parsedSkills = form.skillNeeds
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedSkills.length === 0) {
      throw new Error('Please enter at least one skill requirement for the project.');
    }

    const payload: any = {
      name: form.name,
      description: form.description,
      stage: form.stage,
      repositoryURL: form.repositoryURL || undefined,
      skillNeeds: parsedSkills,
    };

    const isEdit = mode === 'edit' && initialProject?.id;
    const response = await fetch(isEdit ? `/api/v1/incubator/${initialProject.id}` : '/api/v1/incubator', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Unable to save project proposal.');
    }

    setMessage('Project proposal draft saved successfully.');
    router.push('/incubator');
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await submitForm();
      } catch (submitError: any) {
        setError(submitError.message || 'Unable to save project.');
      }
    });
  }

  if (guardLoading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Checking developer access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        Developer role is required to launch incubator projects.
      </div>
    );
  }

  const canEdit = !initialProject || initialProject.status === 'draft' || initialProject.status === 'rejected';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant={mode === 'edit' ? 'warning' : 'info'}>{mode === 'edit' ? 'Edit Draft' : 'New Project'}</Badge>
        <h1 className="mt-3 text-3xl font-black">{mode === 'edit' ? 'Edit Project Proposal' : 'Launch an Incubator Project'}</h1>
        <p className="mt-2 text-text-secondary text-sm md:text-base">
          Present your open-source tool, prototype, or stable software project to gather contributors and mentors.
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          This project is not editable because it is already published.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Form Panel */}
        <div className="space-y-6 rounded-3xl border border-text-secondary/10 bg-bg-card p-6 md:p-8">
          <Input
            label="Project Name"
            value={form.name}
            disabled={!canEdit}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g. Project Antigravity"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="project-description">
              Project Description
            </label>
            <textarea
              id="project-description"
              value={form.description}
              disabled={!canEdit}
              rows={12}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              placeholder="Detail your project's goals, current architecture, roadmap, and how others can contribute..."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Development Stage"
              value={form.stage}
              disabled={!canEdit}
              options={INCUBATOR_STAGES.map((stage) => ({
                value: stage,
                label: stage.charAt(0).toUpperCase() + stage.slice(1),
              }))}
              onChange={(e) => updateField('stage', e.target.value)}
            />
            <Input
              label="Skills Needed"
              value={form.skillNeeds}
              disabled={!canEdit}
              onChange={(e) => updateField('skillNeeds', e.target.value)}
              placeholder="e.g. React, TailwindCSS, Rust, Solidity"
              helperText="Comma-separated skill requirements"
              required
            />
          </div>

          <Input
            label="Code Repository URL (Optional)"
            type="url"
            value={form.repositoryURL}
            disabled={!canEdit}
            onChange={(e) => updateField('repositoryURL', e.target.value)}
            placeholder="e.g. https://github.com/organization/repo"
            helperText="Link to the repository if open source."
          />
        </div>

        {/* Sidebar Controls */}
        <aside className="space-y-5">
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
              variant="primary"
              loading={isPending}
              disabled={!canEdit}
              onClick={handleSubmit}
              className="w-full font-bold shadow-md shadow-accent/10"
            >
              <Save className="mr-2 h-4 w-4 text-white" />
              Save Project Draft
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
