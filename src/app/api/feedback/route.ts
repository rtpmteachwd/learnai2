import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Submit feedback
export async function POST(req: NextRequest) {
  try {
    const { userId, type, category, message, rating } = await req.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      );
    }

    const feedback = await db.feedback.create({
      data: {
        userId,
        type: type || 'suggestion',
        category: category || 'general',
        message,
        rating,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// Get all feedback (admin only)
export async function GET(req: NextRequest) {
  try {
    const feedback = await db.feedback.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
