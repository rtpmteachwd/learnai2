import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Enroll a student in a course
export async function POST(req: NextRequest) {
  try {
    const { studentId, courseId } = await req.json();

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'studentId and courseId are required' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 }
      );
    }

    const enrollment = await db.enrollment.create({
      data: {
        studentId,
        courseId,
        currentLevel: 3,
      },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll student' },
      { status: 500 }
    );
  }
}

// Unenroll a student
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'studentId and courseId are required' },
        { status: 400 }
      );
    }

    await db.enrollment.delete({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unenroll error:', error);
    return NextResponse.json(
      { error: 'Failed to unenroll student' },
      { status: 500 }
    );
  }
}
