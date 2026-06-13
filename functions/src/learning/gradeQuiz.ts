import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface GradeQuizRequest {
  quizId: string;
  answers: number[];
}

interface GradeQuizResponse {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  correctAnswers?: number[]; // Only returned after final attempt or on pass
  certificateGenerated?: boolean;
}

/**
 * Server-side quiz grading callable function.
 *
 * Security: Answer keys are stored in `quiz_answer_keys/{quizId}` which has
 * NO client-side Firestore Security Rules access. The client `quizzes/{quizId}`
 * document holds question text and options only — never correct answers.
 */
export const gradeQuiz = onCall<GradeQuizRequest>(
  { region: 'asia-southeast1', memory: '256MiB' },
  async (request) => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const uid = request.auth.uid;
    const { quizId, answers } = request.data;

    if (!quizId || !Array.isArray(answers) || answers.length === 0) {
      throw new HttpsError('invalid-argument', 'quizId and non-empty answers[] are required');
    }

    // 2. Load quiz metadata (public document — no answer key here)
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      throw new HttpsError('not-found', 'Quiz not found');
    }
    const quiz = quizDoc.data()!;
    const pathId: string = quiz.pathId;
    const maxAttempts: number = quiz.maxAttempts || 3;
    const passingScore: number = quiz.passingScore || 70;
    const timeLimit: number | null = quiz.timeLimit || null;
    const totalQuestions: number = (quiz.questions as any[]).length;

    // 3. Validate answer count
    if (answers.length !== totalQuestions) {
      throw new HttpsError(
        'invalid-argument',
        `Expected ${totalQuestions} answers, received ${answers.length}`
      );
    }

    // 4. Check attempt limit
    const progressRef = db
      .collection('user_progress')
      .doc(uid)
      .collection('paths')
      .doc(pathId);

    const progressDoc = await progressRef.get();
    const progress = progressDoc.exists
      ? progressDoc.data()!
      : {
          completedLessons: {},
          quizAttempts: 0,
          quizPassed: false,
          lastQuizScore: 0,
          completedAt: null,
          percentage: 0,
        };

    if (progress.quizPassed) {
      throw new HttpsError('already-exists', 'Quiz already passed');
    }

    if (progress.quizAttempts >= maxAttempts) {
      throw new HttpsError(
        'resource-exhausted',
        `Maximum attempts (${maxAttempts}) exceeded`
      );
    }

    // 5. Check time limit (if set — the client sends the quiz start time in a claim)
    if (timeLimit && quiz.startedAt) {
      const elapsedSeconds =
        (Date.now() - new Date(quiz.startedAt).getTime()) / 1000;
      if (elapsedSeconds > timeLimit) {
        throw new HttpsError('deadline-exceeded', 'Quiz time limit exceeded');
      }
    }

    // 6. Load answer key (server-only collection!)
    const answerKeyDoc = await db
      .collection('quiz_answer_keys')
      .doc(quizId)
      .get();

    if (!answerKeyDoc.exists) {
      throw new HttpsError('internal', 'Answer key not configured for this quiz');
    }

    const answerKey = answerKeyDoc.data()!;
    const correctAnswerList: { questionIndex: number; correctOptionIndex: number }[] =
      answerKey.answers;

    // 7. Grade
    let correctCount = 0;
    const correctIndices: number[] = [];

    for (const entry of correctAnswerList) {
      correctIndices[entry.questionIndex] = entry.correctOptionIndex;
      if (answers[entry.questionIndex] === entry.correctOptionIndex) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= passingScore;
    const attemptsUsed = progress.quizAttempts + 1;
    const attemptsRemaining = maxAttempts - attemptsUsed;

    // 8. Update progress
    const updatedProgress: Record<string, any> = {
      quizAttempts: attemptsUsed,
      lastQuizScore: percentage,
      quizPassed: passed,
    };

    // Check if path is now fully completed (all lessons + quiz passed)
    let certificateGenerated = false;
    if (passed) {
      // Load lesson count from the path
      const pathDoc = await db.collection('learning_paths').doc(pathId).get();
      const lessonCount = pathDoc.exists ? (pathDoc.data()!.lessonCount || 0) : 0;
      const completedLessonCount = Object.keys(progress.completedLessons || {}).length;

      if (completedLessonCount >= lessonCount) {
        updatedProgress.completedAt = new Date().toISOString();
        updatedProgress.percentage = 100;

        // Trigger certificate generation
        try {
          const { generateCertificateForUser } = await import('./generateCertificate');
          const userName = request.auth.token.name || request.auth.token.email || 'Unknown';
          const pathTitle = pathDoc.exists ? pathDoc.data()!.title : 'Learning Path';

          await generateCertificateForUser({
            userId: uid,
            pathId,
            pathTitle,
            userName,
          });
          certificateGenerated = true;
        } catch (err) {
          console.error('Certificate generation failed:', err);
          // Don't block quiz result — certificate can be retried
        }
      }
    }

    await progressRef.set(updatedProgress, { merge: true });

    // 9. Build response
    const response: GradeQuizResponse = {
      score: correctCount,
      totalQuestions,
      percentage,
      passed,
      attemptsUsed,
      attemptsRemaining,
      certificateGenerated,
    };

    // Reveal correct answers only on pass or last attempt
    if (passed || attemptsRemaining <= 0) {
      response.correctAnswers = correctIndices;
    }

    return response;
  }
);
