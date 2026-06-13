'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface LessonContentProps {
  pathId: string;
  lessonId: string;
  content: string;
  locale: 'th' | 'en';
}

export function LessonContent({ pathId, lessonId, content, locale }: LessonContentProps) {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  const markComplete = async () => {
    if (!user) return;
    setIsCompleting(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/learning-paths/${pathId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to save progress');
      }

      setIsCompleted(true);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Markdown Content */}
      <article className="rounded-3xl border border-text-secondary/10 bg-bg-card p-8 shadow-sm">
        <div className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-black prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-text-secondary
          prose-a:text-accent prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
          prose-code:rounded-md prose-code:bg-bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-medium
          prose-pre:rounded-2xl prose-pre:border prose-pre:border-text-secondary/10 prose-pre:bg-bg-secondary prose-pre:p-5
          prose-ul:space-y-2 prose-ol:space-y-2
          prose-li:text-text-secondary
          prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-xl prose-blockquote:px-5 prose-blockquote:py-3
          prose-img:rounded-2xl prose-img:shadow-sm prose-img:border prose-img:border-text-secondary/10
          prose-table:text-sm prose-th:bg-bg-secondary prose-th:px-4 prose-th:py-2
        ">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Mark Complete Button */}
      {user && (
        <div className="flex items-center justify-center gap-4">
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-6 py-3 text-sm font-bold text-success border border-success/15">
              <CheckCircle2 className="h-5 w-5" />
              {locale === 'th' ? 'เสร็จสิ้นบทเรียนนี้แล้ว!' : 'Lesson completed!'}
            </div>
          ) : (
            <Button
              onClick={markComplete}
              disabled={isCompleting}
              variant="primary"
              size="lg"
              className="shadow-sm shadow-accent/20"
            >
              {isCompleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {locale === 'th' ? 'ทำเครื่องหมายว่าเสร็จสิ้น' : 'Mark as Completed'}
            </Button>
          )}

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
