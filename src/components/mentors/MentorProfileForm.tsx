'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Save, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface MentorProfileFormProps {
  initialProfile: {
    expertise: string[];
    bio: string;
    availability: string;
    maxProjects: number;
  } | null;
  locale: 'th' | 'en';
}

export function MentorProfileForm({ initialProfile, locale }: MentorProfileFormProps) {
  const { user } = useAuth();
  const { loading: guardLoading, authorized } = useAuthGuard({ requiredRole: 'developer' });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [form, setForm] = useState({
    expertise: initialProfile?.expertise.join(', ') || '',
    bio: initialProfile?.bio || '',
    availability: initialProfile?.availability || 'available',
    maxProjects: initialProfile?.maxProjects?.toString() || '3',
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm() {
    if (!user) return;

    setError(null);
    setMessage(null);

    const token = await user.getIdToken();

    const parsedExpertise = form.expertise
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedExpertise.length === 0) {
      throw new Error(locale === 'th' ? 'กรุณากรอกความเชี่ยวชาญอย่างน้อย 1 อย่าง' : 'Please enter at least one area of expertise.');
    }

    const payload = {
      expertise: parsedExpertise,
      bio: form.bio,
      availability: form.availability,
      maxProjects: parseInt(form.maxProjects, 10),
    };

    const response = await fetch('/api/v1/mentors', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Failed to save mentor profile.');
    }

    toast(
      locale === 'th'
        ? 'บันทึกข้อมูลประวัติการให้คำปรึกษาเรียบร้อยแล้ว!'
        : 'Mentor profile updated successfully!',
      'success'
    );
    setMessage(locale === 'th' ? 'บันทึกข้อมูลเรียบร้อยแล้ว' : 'Mentor settings saved.');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitForm();
      } catch (submitError: any) {
        setError(submitError.message || 'Unable to save profile.');
      }
    });
  }

  if (guardLoading) {
    return <div className="rounded-2xl bg-bg-card p-8 text-text-secondary">Checking developer access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-danger">
        Developer role is required to configure a mentor profile.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge variant="bronze">Mentor settings</Badge>
        <h1 className="mt-3 text-3xl font-black">{locale === 'th' ? 'การตั้งค่าอาจารย์ที่ปรึกษา' : 'Mentor Profile Settings'}</h1>
        <p className="mt-2 text-text-secondary text-sm md:text-base">
          {locale === 'th'
            ? 'ให้คำแนะนำโครงการและช่วยเหลือผู้พัฒนาในโครงการบ่มเพาะของชุมชน'
            : 'Provide guidance and mentorship to community projects under the Incubator program.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-text-secondary/10 bg-bg-card p-6 md:p-8">
        <Input
          label={locale === 'th' ? 'สาขาความเชี่ยวชาญ (คั่นด้วยเครื่องหมายจุลภาค ,)' : 'Expertise Tags (separated by commas)'}
          value={form.expertise}
          onChange={(e) => updateField('expertise', e.target.value)}
          placeholder="e.g. React, Node.js, System Architecture"
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-primary/80" htmlFor="mentor-bio">
            {locale === 'th' ? 'ประวัติแนะนำตัวและการให้คำปรึกษา' : 'Mentor Bio / Introduction'}
          </label>
          <textarea
            id="mentor-bio"
            value={form.bio}
            rows={6}
            onChange={(e) => updateField('bio', e.target.value)}
            className="w-full rounded-lg border border-text-secondary/15 bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            placeholder={
              locale === 'th'
                ? 'บอกประสบการณ์การทำงาน ความถนัด และวิธีการให้คำแนะนำของคุณ...'
                : 'Introduce your background, working style, and mentoring approach...'
            }
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={locale === 'th' ? 'สถานะความพร้อม' : 'Availability'}
            value={form.availability}
            options={[
              { value: 'available', label: locale === 'th' ? 'พร้อมให้คำปรึกษา (Available)' : 'Available' },
              { value: 'limited', label: locale === 'th' ? 'จำกัดชั่วโมง (Limited)' : 'Limited Availability' },
              { value: 'unavailable', label: locale === 'th' ? 'ยังไม่พร้อม (Unavailable)' : 'Unavailable' },
            ]}
            onChange={(e) => updateField('availability', e.target.value)}
          />

          <Input
            label={locale === 'th' ? 'จำนวนโครงการสูงสุดที่พร้อมรับดูแล' : 'Max Projects to Mentor'}
            type="number"
            min="1"
            max="10"
            value={form.maxProjects}
            onChange={(e) => updateField('maxProjects', e.target.value)}
            required
          />
        </div>

        {/* Status display banner */}
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

        <div className="flex justify-end pt-4 border-t border-text-secondary/5">
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            className="font-bold flex items-center gap-2 shadow-lg"
          >
            <Save className="h-4 w-4 text-white" />
            <span>{locale === 'th' ? 'บันทึกการตั้งค่า' : 'Save Mentor Profile'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
