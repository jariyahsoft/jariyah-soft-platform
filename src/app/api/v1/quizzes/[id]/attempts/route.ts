import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { quizAttemptSchema } from '@/lib/validators/learning';

// POST /api/v1/quizzes/{id}/attempts — server-side quiz grading
export const POST = withRateLimit(
  { max: 10, windowMs: 60000 },
  withRole('member', async (req: any, context: any) => {
    try {
      const { id: quizId } = await context.params;
      const uid = req.user.uid;

      const body = await req.json();
      const parsed = quizAttemptSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          ApiErrors.VALIDATION_ERROR.message,
          ApiErrors.VALIDATION_ERROR.status,
          parsed.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            reason: e.message,
          }))
        );
      }

      // 1. Load quiz metadata (public fields only — no answer key)
      const quizDoc = await adminDb.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Quiz not found', ApiErrors.NOT_FOUND.status);
      }

      const quiz = quizDoc.data()!;
      const pathId: string = quiz.pathId;
      const maxAttempts: number = quiz.maxAttempts || 3;
      const passingScore: number = quiz.passingScore || 70;
      const totalQuestions: number = (quiz.questions as any[]).length;
      const answers = parsed.data.answers;

      // 2. Validate answer count
      if (answers.length !== totalQuestions) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          `Expected ${totalQuestions} answers, received ${answers.length}`,
          ApiErrors.VALIDATION_ERROR.status
        );
      }

      // 3. Check attempt limit
      const progressRef = adminDb
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
        return errorResponse(
          ApiErrors.CONFLICT.code,
          'Quiz already passed',
          ApiErrors.CONFLICT.status
        );
      }

      if (progress.quizAttempts >= maxAttempts) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          `Maximum attempts (${maxAttempts}) exceeded`,
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      // 4. Load answer key (server-only collection!)
      const answerKeyDoc = await adminDb.collection('quiz_answer_keys').doc(quizId).get();
      if (!answerKeyDoc.exists) {
        return errorResponse(
          ApiErrors.INTERNAL_ERROR.code,
          'Answer key not configured',
          ApiErrors.INTERNAL_ERROR.status
        );
      }

      const answerKey = answerKeyDoc.data()!;
      const correctAnswerList: { questionIndex: number; correctOptionIndex: number }[] =
        answerKey.answers;

      // 5. Grade
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

      // 6. Update progress
      const updatedProgress: Record<string, any> = {
        quizAttempts: attemptsUsed,
        lastQuizScore: percentage,
        quizPassed: passed,
      };

      // Check if path is fully completed
      let certificateGenerated = false;
      if (passed) {
        const pathDoc = await adminDb.collection('learning_paths').doc(pathId).get();
        const lessonCount = pathDoc.exists ? (pathDoc.data()!.lessonCount || 0) : 0;
        const completedLessonCount = Object.keys(progress.completedLessons || {}).length;

        if (completedLessonCount >= lessonCount) {
          updatedProgress.completedAt = new Date().toISOString();
          updatedProgress.percentage = 100;

          // Generate certificate
          try {
            const userName = req.user.name || req.user.email || 'Unknown';
            const pathTitle = pathDoc.exists ? pathDoc.data()!.title : 'Learning Path';
            const certId = adminDb.collection('certificates').doc().id;
            const verificationCode = generateVerificationCode();
            const certNumber = `JC-${new Date().getFullYear()}-${certId.slice(0, 6).toUpperCase()}`;

            await adminDb.collection('certificates').doc(certId).set({
              userId: uid,
              pathId,
              pathTitle,
              userName,
              certificateNumber: certNumber,
              verificationCode,
              pdfPath: `certificates/${certId}.html`,
              issuedAt: new Date().toISOString(),
              revokedAt: null,
            });

            certificateGenerated = true;
          } catch (err) {
            console.error('Certificate generation failed:', err);
          }
        }
      }

      await progressRef.set(updatedProgress, { merge: true });

      // 7. Build response
      const response: Record<string, any> = {
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

      return successResponse(response);
    } catch (error) {
      console.error('Error grading quiz:', error);
      return errorResponse(
        ApiErrors.INTERNAL_ERROR.code,
        'Failed to grade quiz',
        ApiErrors.INTERNAL_ERROR.status
      );
    }
  })
);

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
