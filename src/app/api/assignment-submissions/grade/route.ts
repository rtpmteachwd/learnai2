import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Grade assignment submission or request resubmission
export async function POST(req: NextRequest) {
  try {
    const { submissionId, score, feedback, needsResubmission, resubmissionNote, teacherId } = await req.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Get the submission with assignment info
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { 
        assignment: { 
          include: { course: true } 
        } 
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let updatedSubmission;

    if (needsResubmission) {
      // Request resubmission
      updatedSubmission = await db.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          needsResubmission: true,
          resubmissionNote: resubmissionNote,
          feedback: feedback,
          gradedBy: teacherId,
          gradedAt: new Date(),
          score: null,
        },
      });
    } else {
      // Grade the submission
      if (score === undefined || score === null) {
        return NextResponse.json(
          { error: 'Score is required when not requesting resubmission' },
          { status: 400 }
        );
      }

      updatedSubmission = await db.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          score: parseFloat(score.toString()),
          feedback: feedback,
          gradedBy: teacherId,
          gradedAt: new Date(),
          needsResubmission: false,
          resubmissionNote: null,
        },
      });

      // Create performance record
      await db.performanceRecord.create({
        data: {
          studentId: submission.studentId,
          courseId: submission.assignment.courseId,
          type: 'assignment',
          score: parseFloat(score.toString()),
          maxScore: submission.assignment.maxScore,
          percentage: (parseFloat(score.toString()) / submission.assignment.maxScore) * 100,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      submission: updatedSubmission,
      message: needsResubmission ? 'Resubmission requested successfully' : 'Grade submitted successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
