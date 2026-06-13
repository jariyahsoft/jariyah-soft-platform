'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuizResults } from '@/components/learning/QuizResults';
import {
  ChevronRight,
  Clock,
  Loader2,
  Send,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface QuizQuestion {
  questionText: string;
  options: string[];
  type: string;
}

interface QuizData {
  id: string;
  pathId: string;
  title: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit: number | null;
  questions: QuizQuestion[];
}

interface QuizResultData {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  correctAnswers?: number[];
  certificateGenerated?: boolean;
}

export default function QuizPage({ params: paramsPromise }: { params: Promise<{ locale: string; id: string }> }) {
  const locale = useLocale() as 'th' | 'en';
  const { user } = useAuth();

  const [pathId, setPathId] = useState('');
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz state
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResultData | null>(null);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Load params and quiz
  useEffect(() => {
    (async () => {
      const resolvedParams = await paramsPromise;
      setPathId(resolvedParams.id);

      try {
        // Load path doc to get quizId
        const pathDoc = await getDoc(doc(db, 'learning_paths', resolvedParams.id));
        if (!pathDoc.exists()) {
          setError(locale === 'th' ? 'ไม่พบหลักสูตร' : 'Learning path not found');
          setLoading(false);
          return;
        }

        const quizId = pathDoc.data()?.quizId;
        if (!quizId) {
          setError(locale === 'th' ? 'หลักสูตรนี้ไม่มีแบบทดสอบ' : 'No quiz for this path');
          setLoading(false);
          return;
        }

        // Load quiz (public fields only — no answer keys)
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (!quizDoc.exists()) {
          setError(locale === 'th' ? 'ไม่พบแบบทดสอบ' : 'Quiz not found');
          setLoading(false);
          return;
        }

        const quizData = { id: quizDoc.id, ...quizDoc.data() } as QuizData;
        setQuiz(quizData);
        setAnswers(new Array(quizData.questions.length).fill(null));

        if (quizData.timeLimit) {
          setTimeRemaining(quizData.timeLimit);
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(locale === 'th' ? 'ไม่สามารถโหลดแบบทดสอบได้' : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    })();
  }, [paramsPromise, locale]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || result) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, result]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeRemaining === 0 && !result && !submitting) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const setAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!user || !quiz) return;

    // Validate all answered
    const unanswered = answers.findIndex((a) => a === null);
    if (unanswered !== -1 && timeRemaining !== 0) {
      setError(
        locale === 'th'
          ? `กรุณาตอบข้อ ${unanswered + 1} ก่อนส่ง`
          : `Please answer question ${unanswered + 1} before submitting`
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/v1/quizzes/${quiz.id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answers.map((a) => a ?? -1),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to grade quiz');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers(new Array(quiz?.questions.length || 0).fill(null));
    setError('');
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-sm text-text-secondary">
            {locale === 'th' ? 'กำลังโหลดแบบทดสอบ...' : 'Loading quiz...'}
          </p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !quiz) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <p className="text-sm text-text-secondary">{error}</p>
          <Link href={`/learn/${pathId}`}>
            <Button variant="outline">{locale === 'th' ? 'กลับไปหลักสูตร' : 'Back to Path'}</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!quiz) return null;

  // Show results if submitted
  if (result) {
    return (
      <main className="min-h-screen bg-bg-primary px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <QuizResults
            score={result.score}
            totalQuestions={result.totalQuestions}
            percentage={result.percentage}
            passed={result.passed}
            attemptsUsed={result.attemptsUsed}
            attemptsRemaining={result.attemptsRemaining}
            correctAnswers={result.correctAnswers}
            questions={quiz.questions}
            userAnswers={answers.map((a) => a ?? -1)}
            certificateGenerated={result.certificateGenerated}
            pathId={pathId}
            locale={locale}
            onRetry={handleRetry}
          />
        </div>
      </main>
    );
  }

  // Quiz Form
  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-secondary">
          <Link href="/learn" className="hover:text-accent transition-colors">
            {locale === 'th' ? 'หลักสูตร' : 'Paths'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/learn/${pathId}`} className="hover:text-accent transition-colors">
            {locale === 'th' ? 'บทเรียน' : 'Path'}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-text-primary">
            {locale === 'th' ? 'แบบทดสอบ' : 'Quiz'}
          </span>
        </nav>

        {/* Quiz Header */}
        <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="warning" size="md" className="inline-flex items-center gap-1.5 mb-3">
                <HelpCircle className="h-3.5 w-3.5" />
                Quiz
              </Badge>
              <h1 className="text-2xl font-black tracking-tight text-text-primary">
                {quiz.title}
              </h1>
              <p className="mt-2 text-xs text-text-secondary">
                {quiz.questions.length} {locale === 'th' ? 'ข้อ' : 'questions'} •{' '}
                {locale === 'th' ? `ต้องได้ ${quiz.passingScore}% ขึ้นไป` : `${quiz.passingScore}% to pass`} •{' '}
                {locale === 'th' ? `สูงสุด ${quiz.maxAttempts} ครั้ง` : `Max ${quiz.maxAttempts} attempts`}
              </p>
            </div>

            {/* Timer */}
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-mono font-bold ${
                  timeRemaining <= 60
                    ? 'border-danger/20 bg-danger/5 text-danger animate-pulse'
                    : 'border-text-secondary/10 bg-bg-secondary text-text-primary'
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {quiz.questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <p className="text-sm font-bold text-text-primary mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black mr-2">
                  {qIdx + 1}
                </span>
                {q.questionText}
              </p>

              <div className="space-y-2.5">
                {q.options.map((option, oIdx) => {
                  const isSelected = answers[qIdx] === oIdx;
                  return (
                    <label
                      key={oIdx}
                      className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3.5 text-sm transition-all duration-200 ${
                        isSelected
                          ? 'border-accent/40 bg-accent/5 text-text-primary ring-1 ring-accent/20'
                          : 'border-text-secondary/10 bg-bg-primary text-text-secondary hover:border-text-secondary/20 hover:bg-bg-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qIdx}`}
                        checked={isSelected}
                        onChange={() => setAnswer(qIdx, oIdx)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-accent bg-accent text-white'
                            : 'border-text-secondary/20 text-text-secondary/50'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className={isSelected ? 'font-semibold' : ''}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Submit Bar */}
        <div className="sticky bottom-4 rounded-2xl border border-text-secondary/10 bg-bg-card p-4 shadow-lg flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            {locale === 'th'
              ? `ตอบแล้ว ${answeredCount}/${quiz.questions.length} ข้อ`
              : `Answered ${answeredCount}/${quiz.questions.length}`}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="primary"
            size="md"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {locale === 'th' ? 'ส่งคำตอบ' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </main>
  );
}
