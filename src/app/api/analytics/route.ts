import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get analytics data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type') || 'overview';

    // Student analytics
    if (studentId) {
      const performanceRecords = await db.performanceRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 30,
      });

      const quizAttempts = await db.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: { select: { title: true, courseId: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
      });

      const enrollments = await db.enrollment.findMany({
        where: { studentId },
        include: {
          course: {
            include: {
              lessons: true,
              quizzes: true,
            },
          },
        },
      });

      // Calculate overall stats
      const avgScore = performanceRecords.length > 0
        ? performanceRecords.reduce((sum, r) => sum + r.percentage, 0) / performanceRecords.length
        : 0;

      const completedQuizzes = quizAttempts.filter(a => a.completedAt).length;
      const passedQuizzes = quizAttempts.filter(a => a.passed).length;

      return NextResponse.json({
        success: true,
        analytics: {
          studentId,
          performanceRecords,
          quizAttempts,
          enrollments,
          stats: {
            avgScore,
            completedQuizzes,
            passedQuizzes,
            totalCourses: enrollments.length,
            quizPassRate: completedQuizzes > 0 ? (passedQuizzes / completedQuizzes) * 100 : 0,
          },
        },
      });
    }

    // Teacher analytics
    if (teacherId) {
      const courses = await db.course.findMany({
        where: { teacherId },
        include: {
          enrollments: {
            include: {
              student: { select: { id: true, name: true, disabilityType: true } },
            },
          },
          quizzes: {
            include: {
              attempts: {
                include: {
                  student: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      const students = courses.flatMap(c => c.enrollments.map(e => e.student));
      const uniqueStudents = [...new Map(students.map(s => [s.id, s])).values()];

      const allAttempts = courses.flatMap(c => c.quizzes.flatMap(q => q.attempts));
      const avgClassScore = allAttempts.length > 0
        ? allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length
        : 0;

      return NextResponse.json({
        success: true,
        analytics: {
          teacherId,
          courses,
          stats: {
            totalCourses: courses.length,
            totalStudents: uniqueStudents.length,
            avgClassScore,
            totalQuizAttempts: allAttempts.length,
          },
          students: uniqueStudents,
        },
      });
    }

    // Admin overview
    const totalUsers = await db.user.count();
    const totalStudents = await db.user.count({ where: { role: 'STUDENT' } });
    const totalTeachers = await db.user.count({ where: { role: 'TEACHER' } });
    const totalCourses = await db.course.count();
    const totalQuizzes = await db.quiz.count();
    const totalAttempts = await db.quizAttempt.count();

    const recentActivity = await db.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalCourses,
          totalQuizzes,
          totalAttempts,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
