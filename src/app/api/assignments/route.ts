import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get assignments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');

    if (studentId) {
      // Get assignments for student (through enrollments)
      const enrollments = await db.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      });
      
      const courseIds = enrollments.map(e => e.courseId);
      
      const assignments = await db.assignment.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: { select: { title: true } },
          submissions: {
            where: { studentId },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return NextResponse.json({ success: true, assignments });
    }

    const where = courseId ? { courseId } : {};
    const assignments = await db.assignment.findMany({
      where,
      include: {
        course: { select: { title: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// Create assignment
export async function POST(req: NextRequest) {
  try {
    const { courseId, title, description, dueDate, maxScore, allowLateSubmission } = await req.json();

    if (!courseId || !title || !dueDate) {
      return NextResponse.json(
        { error: 'Course ID, title, and due date are required' },
        { status: 400 }
      );
    }

    const assignment = await db.assignment.create({
      data: {
        courseId,
        title,
        description,
        dueDate: new Date(dueDate),
        maxScore: maxScore || 100,
        allowLateSubmission: allowLateSubmission ?? true,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

// Update assignment
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const assignment = await db.assignment.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// Delete assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    await db.assignmentSubmission.deleteMany({ where: { assignmentId: id } });
    await db.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
