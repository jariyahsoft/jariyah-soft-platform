'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createEventSchema, EVENT_TYPES, VENUE_TYPES } from '@/lib/validators/event';
import { z } from 'zod';
import { Link } from '@/i18n/routing';

type FormData = z.infer<typeof createEventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      type: 'webinar',
      venueType: 'online',
      capacity: 50,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error?.message || 'Failed to create event');

      router.push('/dashboard/events');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-text-primary">Create Event</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-bg-card p-6 md:p-8 rounded-3xl border border-text-secondary/10 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">Event Title</label>
              <input
                {...register('title')}
                className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="e.g. Intro to Next.js"
              />
              {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">Description (Markdown)</label>
              <textarea
                {...register('description')}
                rows={5}
                className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
              {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Event Type</label>
                <select
                  {...register('type')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                >
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.type && <p className="mt-1 text-xs text-danger">{errors.type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Capacity</label>
                <input
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                {errors.capacity && <p className="mt-1 text-xs text-danger">{errors.capacity.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Venue Type</label>
                <select
                  {...register('venueType')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                >
                  {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Venue Details / Link</label>
                <input
                  {...register('venueDetails')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                {errors.venueDetails && <p className="mt-1 text-xs text-danger">{errors.venueDetails.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('startDate')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                {errors.startDate && <p className="mt-1 text-xs text-danger">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  {...register('endDate')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                {errors.endDate && <p className="mt-1 text-xs text-danger">{errors.endDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Registration Deadline</label>
                <input
                  type="datetime-local"
                  {...register('registrationDeadline')}
                  className="w-full rounded-xl border border-text-secondary/20 bg-bg-primary px-4 py-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                />
                {errors.registrationDeadline && <p className="mt-1 text-xs text-danger">{errors.registrationDeadline.message}</p>}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-text-secondary/10 flex justify-end">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Event
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
