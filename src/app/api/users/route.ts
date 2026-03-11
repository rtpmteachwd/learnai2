import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get users or update user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const id = searchParams.get('id');

    if (id) {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          disabilityType: true,
          grade: true,
          section: true,
          preferredFontSize: true,
          highContrastMode: true,
          screenReaderMode: true,
          keyboardNavOnly: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, user });
    }

    const where = role ? { role: role as any } : {};
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        disabilityType: true,
        grade: true,
        section: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        disabilityType: true,
        grade: true,
        section: true,
        preferredFontSize: true,
        highContrastMode: true,
        screenReaderMode: true,
        keyboardNavOnly: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete related records first
    await db.enrollment.deleteMany({ where: { studentId: id } });
    await db.quizAttempt.deleteMany({ where: { studentId: id } });
    await db.assignmentSubmission.deleteMany({ where: { studentId: id } });
    await db.performanceRecord.deleteMany({ where: { studentId: id } });
    await db.feedback.deleteMany({ where: { userId: id } });
    await db.activityLog.deleteMany({ where: { userId: id } });
    await db.notification.deleteMany({ where: { userId: id } });

    // Delete user
    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
