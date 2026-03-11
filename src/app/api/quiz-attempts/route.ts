import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification, notifyEssayNeedsGrading, notifyQuizGraded } from '@/lib/notifications';

// Get quiz attempts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    const studentId = searchParams.get('studentId');
    const needsGrading = searchParams.get('needsGrading');

    if (needsGrading === 'true') {
      // Get all attempts that need grading for a teacher
      const attempts = await db.quizAttempt.findMany({
        where: { needsGrading: true, completedAt: { not: null } },
        include: {
          quiz: { select: { title: true, courseId: true, course: { select: { teacherId: true } } } },
          student: { select: { name: true, email: true } },
        },
        orderBy: { completedAt: 'desc' },
      });
      return NextResponse.json({ success: true, attempts });
    }

    if (studentId && quizId) {
      const attempts = await db.quizAttempt.findMany({
        where: { quizId, studentId },
        orderBy: { startedAt: 'desc' },
      });
      return NextResponse.json({ success: true, attempts });
    }

    if (studentId) {
      const attempts = await db.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: { select: { title: true, courseId: true } },
        },
        orderBy: { startedAt: 'desc' },
      });
      return NextResponse.json({ success: true, attempts });
    }

    if (quizId) {
      const attempts = await db.quizAttempt.findMany({
        where: { quizId },
        include: {
          student: { select: { name: true, email: true } },
        },
        orderBy: { startedAt: 'desc' },
      });
      return NextResponse.json({ success: true, attempts });
    }

    return NextResponse.json({ error: 'Quiz ID or Student ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}

// Submit quiz attempt
export async function POST(req: NextRequest) {
  try {
    const { quizId, studentId, answers, usedTTS, usedASR, usedSignLang } = await req.json();

    if (!quizId || !studentId || !answers) {
      return NextResponse.json(
        { error: 'Quiz ID, student ID, and answers are required' },
        { status: 400 }
      );
    }

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, course: { select: { teacherId: true } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check attempt count
    const previousAttempts = await db.quizAttempt.count({
      where: { quizId, studentId },
    });

    if (previousAttempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum attempts reached' },
        { status: 400 }
      );
    }

    // Separate auto-gradable and essay questions
    const autoGradableTypes = ['multiple_choice', 'true_false', 'identification'];
    const hasEssayQuestions = quiz.questions.some(q => q.questionType === 'essay');
    
    // Grade auto-gradable questions
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: any[] = [];
    let hasOnlyAutoGradable = true;

    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      totalPoints += question.points;
      
      if (question.questionType === 'essay') {
        hasOnlyAutoGradable = false;
        gradedAnswers.push({
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          answer: answer.answer,
          correctAnswer: '(Requires teacher grading)',
          isCorrect: null,
          explanation: question.explanation,
          points: question.points,
          needsGrading: true,
        });
      } else {
        const isCorrect = answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        if (isCorrect) {
          earnedPoints += question.points;
        }
        gradedAnswers.push({
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          answer: answer.answer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          points: question.points,
        });
      }
    }

    // If there are essay questions, the quiz needs manual grading
    const needsGrading = hasEssayQuestions;
    
    // Calculate score (for auto-gradable portions only if there are essays)
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = !needsGrading && score >= quiz.passingScore;

    // Create the attempt
    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        studentId,
        answers: JSON.stringify(gradedAnswers),
        score: hasOnlyAutoGradable ? score : null,
        passed: hasOnlyAutoGradable ? passed : false,
        completedAt: new Date(),
        usedTTS: usedTTS || false,
        usedASR: usedASR || false,
        usedSignLang: usedSignLang || false,
        needsGrading,
      },
    });

    // Create performance record only if fully graded
    if (hasOnlyAutoGradable) {
      await db.performanceRecord.create({
        data: {
          studentId,
          courseId: quiz.courseId,
          type: 'quiz',
          score: earnedPoints,
          maxScore: totalPoints,
          percentage: score,
        },
      });

      // Update enrollment progress
      const enrollment = await db.enrollment.findFirst({
        where: { studentId, courseId: quiz.courseId },
      });

      if (enrollment) {
        const allQuizzes = await db.quiz.count({ where: { courseId: quiz.courseId } });
        const passedQuizzes = await db.quizAttempt.count({
          where: {
            studentId,
            quiz: { courseId: quiz.courseId },
            passed: true,
          },
        });

        const newProgress = allQuizzes > 0 ? (passedQuizzes / allQuizzes) * 100 : 0;

        await db.enrollment.update({
          where: { id: enrollment.id },
          data: { progress: newProgress },
        });
      }

      // Notify student of grade
      await notifyQuizGraded(studentId, quiz.title, score, passed);
    } else {
      // Notify teacher that grading is needed
      const student = await db.user.findUnique({ where: { id: studentId } });
      if (student && quiz.course?.teacherId) {
        await notifyEssayNeedsGrading(quiz.course.teacherId, student.name, quiz.title);
      }
    }

    return NextResponse.json({
      success: true,
      attempt: {
        ...attempt,
        score: hasOnlyAutoGradable ? score : null,
        passed: hasOnlyAutoGradable ? passed : false,
        correctCount: gradedAnswers.filter((a) => a.isCorrect === true).length,
        totalQuestions: quiz.questions.length,
        gradedAnswers,
        needsGrading,
      },
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}

// Grade essay questions (for teachers)
export async function PUT(req: NextRequest) {
  try {
    const { attemptId, gradedAnswers, teacherComments, teacherId } = await req.json();

    if (!attemptId || !gradedAnswers) {
      return NextResponse.json({ error: 'Attempt ID and graded answers are required' }, { status: 400 });
    }

    // Get the original attempt
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: { include: { questions: true, course: { select: { teacherId: true } } } },
        student: { select: { id: true, name: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Verify teacher has permission
    if (attempt.quiz.course?.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Recalculate score with essay grades
    let totalPoints = 0;
    let earnedPoints = 0;

    const updatedGradedAnswers = gradedAnswers.map((ga: any) => {
      const question = attempt.quiz.questions.find(q => q.id === ga.questionId);
      if (question) {
        totalPoints += question.points;
        if (ga.isCorrect || ga.partialPoints) {
          earnedPoints += ga.partialPoints || (ga.isCorrect ? question.points : 0);
        }
      }
      return ga;
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= attempt.quiz.passingScore;

    // Update the attempt
    await db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answers: JSON.stringify(updatedGradedAnswers),
        score,
        passed,
        needsGrading: false,
        teacherComments,
        gradedBy: teacherId,
        gradedAt: new Date(),
      },
    });

    // Create performance record
    await db.performanceRecord.create({
      data: {
        studentId: attempt.studentId,
        courseId: attempt.quiz.courseId,
        type: 'quiz',
        score: earnedPoints,
        maxScore: totalPoints,
        percentage: score,
      },
    });

    // Update enrollment progress
    const enrollment = await db.enrollment.findFirst({
      where: { studentId: attempt.studentId, courseId: attempt.quiz.courseId },
    });

    if (enrollment) {
      const allQuizzes = await db.quiz.count({ where: { courseId: attempt.quiz.courseId } });
      const passedQuizzes = await db.quizAttempt.count({
        where: {
          studentId: attempt.studentId,
          quiz: { courseId: attempt.quiz.courseId },
          passed: true,
        },
      });

      const newProgress = allQuizzes > 0 ? (passedQuizzes / allQuizzes) * 100 : 0;

      await db.enrollment.update({
        where: { id: enrollment.id },
        data: { progress: newProgress },
      });
    }

    // Notify student
    await notifyQuizGraded(attempt.studentId, attempt.quiz.title, score, passed);

    return NextResponse.json({
      success: true,
      attempt: {
        score,
        passed,
        gradedAnswers: updatedGradedAnswers,
      },
    });
  } catch (error) {
    console.error('Grade quiz error:', error);
    return NextResponse.json({ error: 'Failed to grade quiz' }, { status: 500 });
  }
}
