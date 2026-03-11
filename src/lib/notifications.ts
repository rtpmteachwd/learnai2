import { db } from '@/lib/db';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyStudentEnrollment(studentId: string, courseName: string) {
  await createNotification(
    studentId,
    'New Course Enrollment',
    `You have been enrolled in "${courseName}"`,
    'success'
  );
}

export async function notifyNewQuiz(studentId: string, quizName: string, courseName: string) {
  await createNotification(
    studentId,
    'New Quiz Available',
    `A new quiz "${quizName}" is available in ${courseName}`,
    'info'
  );
}

export async function notifyNewAssignment(studentId: string, assignmentName: string, courseName: string) {
  await createNotification(
    studentId,
    'New Assignment',
    `A new assignment "${assignmentName}" has been posted in ${courseName}`,
    'warning'
  );
}

export async function notifyQuizGraded(studentId: string, quizName: string, score: number, passed: boolean) {
  await createNotification(
    studentId,
    passed ? 'Quiz Passed!' : 'Quiz Completed',
    `Your quiz "${quizName}" has been graded. Score: ${score.toFixed(1)}%`,
    passed ? 'success' : 'warning'
  );
}

export async function notifyEssayNeedsGrading(teacherId: string, studentName: string, quizName: string) {
  await createNotification(
    teacherId,
    'Essay Needs Grading',
    `${studentName} submitted an essay in "${quizName}" that requires your review`,
    'warning'
  );
}

export async function notifyTeacherNewSubmission(teacherId: string, studentName: string, assignmentName: string) {
  await createNotification(
    teacherId,
    'New Assignment Submission',
    `${studentName} submitted "${assignmentName}"`,
    'info'
  );
}
