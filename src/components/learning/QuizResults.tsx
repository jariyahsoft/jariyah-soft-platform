'use client';

import { Link } from '@/i18n/routing';
import { Trophy, XCircle, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  correctAnswers?: number[];
  questions?: { questionText: string; options: string[] }[];
  userAnswers: number[];
  certificateGenerated?: boolean;
  pathId: string;
  locale: 'th' | 'en';
  onRetry: () => void;
}

export function QuizResults({
  score,
  totalQuestions,
  percentage,
  passed,
  attemptsUsed,
  attemptsRemaining,
  correctAnswers,
  questions,
  userAnswers,
  certificateGenerated,
  pathId,
  locale,
  onRetry,
}: QuizResultsProps) {
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Score Circle */}
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-text-secondary/10 bg-bg-card p-10 shadow-sm">
        {/* Animated SVG circle */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              className="text-text-secondary/10"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              className={passed ? 'text-success' : 'text-danger'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 1.5s ease-in-out',
              }}
            />
          </svg>
          <div className="text-center">
            <div className="text-3xl font-black text-text-primary">{percentage}%</div>
            <div className="text-xs text-text-secondary">
              {score}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Pass/Fail status */}
        <div className="text-center space-y-2">
          {passed ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-5 py-2.5 text-sm font-bold text-success border border-success/15">
                <Trophy className="h-5 w-5" />
                {locale === 'th' ? 'ผ่านแบบทดสอบ!' : 'Quiz Passed!'}
              </div>
              <p className="text-sm text-text-secondary">
                {locale === 'th'
                  ? 'ยินดีด้วย! คุณสอบผ่านเรียบร้อยแล้ว'
                  : 'Congratulations! You have successfully passed the quiz.'}
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-danger/10 px-5 py-2.5 text-sm font-bold text-danger border border-danger/15">
                <XCircle className="h-5 w-5" />
                {locale === 'th' ? 'ยังไม่ผ่าน' : 'Not Passed'}
              </div>
              <p className="text-sm text-text-secondary">
                {locale === 'th'
                  ? `คุณสามารถทำแบบทดสอบได้อีก ${attemptsRemaining} ครั้ง`
                  : `You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`}
              </p>
            </>
          )}
        </div>

        {/* Attempt info */}
        <div className="text-xs text-text-secondary">
          {locale === 'th'
            ? `ทำแบบทดสอบครั้งที่ ${attemptsUsed}`
            : `Attempt ${attemptsUsed}`}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!passed && attemptsRemaining > 0 && (
            <Button onClick={onRetry} variant="primary" size="md">
              <RotateCcw className="mr-2 h-4 w-4" />
              {locale === 'th' ? 'ทำอีกครั้ง' : 'Retry Quiz'}
            </Button>
          )}

          {certificateGenerated && (
            <Link href="/dashboard/certificates">
              <Button variant="outline" size="md">
                <Award className="mr-2 h-4 w-4" />
                {locale === 'th' ? 'ดูใบประกาศนียบัตร' : 'View Certificate'}
              </Button>
            </Link>
          )}

          <Link href={`/learn/${pathId}`}>
            <Button variant="ghost" size="md">
              {locale === 'th' ? 'กลับไปหลักสูตร' : 'Back to Path'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Answer Review (only shown after pass or final attempt) */}
      {correctAnswers && questions && (
        <div className="rounded-3xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-text-primary">
            {locale === 'th' ? 'ทบทวนคำตอบ' : 'Answer Review'}
          </h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const correct = correctAnswers[idx];
              const isCorrect = userAnswer === correct;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 ${
                    isCorrect
                      ? 'border-success/20 bg-success/5'
                      : 'border-danger/20 bg-danger/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {idx + 1}. {q.questionText}
                      </p>
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`rounded-lg px-3 py-1.5 text-xs ${
                              optIdx === correct
                                ? 'bg-success/15 text-success font-bold'
                                : optIdx === userAnswer && optIdx !== correct
                                ? 'bg-danger/15 text-danger line-through'
                                : 'text-text-secondary'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
