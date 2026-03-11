import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all courses or create a new course
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');

    let courses;

    if (teacherId) {
      courses = await db.course.findMany({
        where: { teacherId },
        include: {
          _count: {
            select: { enrollments: true, lessons: true, quizzes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (studentId) {
      courses = await db.course.findMany({
        where: {
          enrollments: { some: { studentId } },
        },
        include: {
          lessons: { select: { id: true } },
          quizzes: { select: { id: true } },
          teacher: { select: { id: true, name: true } },
          enrollments: {
            where: { studentId },
            select: { progress: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      courses = await db.course.findMany({
        include: {
          teacher: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// Create a new course
export async function POST(req: NextRequest) {
  try {
    const { title, description, subject, gradeLevel, teacherId, creatorId, difficultyLevel = 3 } = await req.json();

    if (!title || !teacherId || !creatorId) {
      return NextResponse.json({ error: 'Title, teacherId, and creatorId are required' }, { status: 400 });
    }

    const course = await db.course.create({
      data: { title, description, subject, gradeLevel, teacherId, creatorId, difficultyLevel },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

// Update a course
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const course = await db.course.update({
      where: { id },
      data: {
        ...data,
        difficultyLevel: data.difficultyLevel ? parseInt(data.difficultyLevel) : undefined,
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// Delete a course
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Delete related records first
    await db.quizAttempt.deleteMany({
      where: { quiz: { courseId: id } },
    });
    await db.question.deleteMany({
      where: { quiz: { courseId: id } },
    });
    await db.quiz.deleteMany({ where: { courseId: id } });
    await db.assignmentSubmission.deleteMany({
      where: { assignment: { courseId: id } },
    });
    await db.assignment.deleteMany({ where: { courseId: id } });
    await db.lesson.deleteMany({ where: { courseId: id } });
    await db.enrollment.deleteMany({ where: { courseId: id } });
    await db.performanceRecord.deleteMany({ where: { courseId: id } });
    await db.course.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
