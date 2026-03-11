import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get assignment submissions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    if (studentId && assignmentId) {
      const submission = await db.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
      });
      return NextResponse.json({ success: true, submission });
    }

    if (assignmentId) {
      const submissions = await db.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          student: { select: { id: true, name: true, email: true, disabilityType: true } },
        },
        orderBy: { submittedAt: 'desc' },
      });
      return NextResponse.json({ success: true, submissions });
    }

    if (studentId) {
      const submissions = await db.assignmentSubmission.findMany({
        where: { studentId },
        include: {
          assignment: {
            select: { 
              id: true,
              title: true, 
              maxScore: true, 
              dueDate: true, 
              description: true,
              course: { select: { id: true, title: true } } 
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });
      return NextResponse.json({ success: true, submissions });
    }

    return NextResponse.json({ error: 'Assignment ID or Student ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// Submit assignment
export async function POST(req: NextRequest) {
  try {
    const { assignmentId, studentId, content, fileUrl, usedTTS, usedASR } = await req.json();

    if (!assignmentId || !studentId) {
      return NextResponse.json(
        { error: 'Assignment ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Check if assignment exists and is not past due
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if already submitted
    const existingSubmission = await db.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existingSubmission) {
      // Update existing submission (clear resubmission flag when student resubmits)
      const submission = await db.assignmentSubmission.update({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
        data: {
          content,
          fileUrl,
          submittedAt: new Date(),
          usedTTS: usedTTS || false,
          usedASR: usedASR || false,
          needsResubmission: false,
          resubmissionNote: null,
          score: null,
          feedback: null,
          gradedAt: null,
          gradedBy: null,
        },
      });
      return NextResponse.json({ success: true, submission, message: 'Submission updated!' });
    }

    // Create new submission
    const submission = await db.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        content,
        fileUrl,
        usedTTS: usedTTS || false,
        usedASR: usedASR || false,
      },
    });

    return NextResponse.json({ success: true, submission, message: 'Assignment submitted successfully!' });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}

// Grade assignment submission
export async function PUT(req: NextRequest) {
  try {
    const { submissionId, score, feedback, teacherId } = await req.json();

    if (!submissionId || score === undefined) {
      return NextResponse.json(
        { error: 'Submission ID and score are required' },
        { status: 400 }
      );
    }

    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Verify teacher has permission
    if (submission.assignment.course?.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedSubmission = await db.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        gradedBy: teacherId,
        gradedAt: new Date(),
      },
    });

    // Create performance record
    await db.performanceRecord.create({
      data: {
        studentId: submission.studentId,
        courseId: submission.assignment.courseId,
        type: 'assignment',
        score: score,
        maxScore: submission.assignment.maxScore,
        percentage: (score / submission.assignment.maxScore) * 100,
      },
    });

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
  }
}
