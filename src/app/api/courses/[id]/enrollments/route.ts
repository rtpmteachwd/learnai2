import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get enrollments for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            disabilityType: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
