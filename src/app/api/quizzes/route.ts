import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get quizzes - Updated to fix Prisma orderBy issue
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const quizId = searchParams.get('id');

    console.log('Fetching quizzes:', { courseId, quizId });

    if (quizId) {
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: true,
          course: { select: { title: true } },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      // Sort questions by createdAt
      const sortedQuestions = [...quiz.questions].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log('Quiz found:', quiz.title, 'with', sortedQuestions.length, 'questions');

      // Shuffle questions for adaptive learning
      const shuffledQuestions = sortedQuestions.sort(() => Math.random() - 0.5);

      return NextResponse.json({ success: true, quiz: { ...quiz, questions: shuffledQuestions } });
    }

    const where = courseId ? { courseId } : {};
    const quizzes = await db.quiz.findMany({
      where,
      include: {
        course: { select: { title: true } },
        questions: { select: { id: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Found', quizzes.length, 'quizzes');

    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes: ' + (error as Error).message }, { status: 500 });
  }
}

// Create quiz
export async function POST(req: NextRequest) {
  try {
    const { courseId, title, description, timeLimit, passingScore, maxAttempts, isAdaptive, questions } = await req.json();

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Course ID and title are required' }, { status: 400 });
    }

    // Create quiz with questions
    const quiz = await db.quiz.create({
      data: {
        courseId,
        title,
        description,
        timeLimit: timeLimit || 15,
        passingScore: passingScore || 60,
        maxAttempts: maxAttempts || 3,
        isAdaptive: isAdaptive ?? true,
        questions: questions ? {
          create: questions.map((q: any) => ({
            questionText: q.questionText,
            questionType: q.questionType || 'multiple_choice',
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 1,
            difficultyLevel: q.difficultyLevel || 3,
          }))
        } : undefined,
      },
      include: { questions: true },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}

// Update quiz
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    const quiz = await db.quiz.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

// Delete quiz
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    await db.quizAttempt.deleteMany({ where: { quizId: id } });
    await db.question.deleteMany({ where: { quizId: id } });
    await db.quiz.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
