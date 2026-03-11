import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get lessons - Updated with better error handling
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('id');

    if (lessonId) {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: { select: { title: true, id: true } },
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, lesson });
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const lessons = await db.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

// Create a new lesson
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      courseId, 
      title, 
      description, 
      content, 
      order, 
      difficultyLevel,
      estimatedTime,
      referenceUrl,
      referenceName
    } = body;

    console.log('Creating lesson:', { courseId, title, description, order, difficultyLevel, estimatedTime });

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Course ID and title are required' },
        { status: 400 }
      );
    }

    const lesson = await db.lesson.create({
      data: {
        courseId,
        title,
        description: description || null,
        content: content || '',
        order: order || 1,
        difficultyLevel: difficultyLevel ? parseInt(String(difficultyLevel)) : 3,
        estimatedTime: estimatedTime ? parseInt(String(estimatedTime)) : 30,
        referenceUrl: referenceUrl || null,
        referenceName: referenceName || null,
      },
    });

    console.log('Lesson created:', lesson);

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Create lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Update lesson
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const lesson = await db.lesson.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Update lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// Delete lesson
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    await db.lesson.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
