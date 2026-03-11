import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get questions for a quiz
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    const id = searchParams.get('id');

    if (id) {
      const question = await db.question.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, question });
    }

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    const questions = await db.question.findMany({
      where: { quizId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// Create a new question
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quizId,
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      points,
      difficultyLevel,
      hintUrl,
      hintName,
    } = body;

    console.log('Creating question:', { quizId, questionText, questionType, correctAnswer, options });

    if (!quizId || !questionText) {
      return NextResponse.json(
        { error: 'Quiz ID and question text are required' },
        { status: 400 }
      );
    }

    // For essay questions, correct answer is optional (teacher will grade)
    if (questionType !== 'essay' && !correctAnswer) {
      return NextResponse.json(
        { error: 'Correct answer is required for this question type' },
        { status: 400 }
      );
    }

    // Parse options if it's an array
    let optionsString = null;
    if (options) {
      if (Array.isArray(options)) {
        optionsString = JSON.stringify(options);
      } else if (typeof options === 'string') {
        optionsString = options;
      }
    }

    const question = await db.question.create({
      data: {
        quizId,
        questionText,
        questionType: questionType || 'multiple_choice',
        options: optionsString,
        correctAnswer: correctAnswer || '',
        explanation: explanation || null,
        points: points ? parseInt(String(points)) : 1,
        difficultyLevel: difficultyLevel ? parseInt(String(difficultyLevel)) : 3,
        hintUrl: hintUrl || null,
        hintName: hintName || null,
      },
    });

    console.log('Question created:', question);

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json({ error: 'Failed to create question: ' + (error as Error).message }, { status: 500 });
  }
}

// Update a question
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updateData: any = { ...data };
    if (data.options) {
      updateData.options = JSON.stringify(data.options);
    }

    const question = await db.question.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// Delete a question
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await db.quizAttempt.deleteMany({ where: { questionId: id } });
    await db.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
