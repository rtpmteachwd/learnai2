import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate AI insights for teacher dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    const courseId = searchParams.get('courseId');

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Get all courses taught by this teacher
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
            questions: { select: { id: true, questionType: true, difficultyLevel: true } },
            attempts: {
              include: {
                student: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Calculate insights
    const insights: any = {
      overview: {
        totalStudents: 0,
        totalCourses: courses.length,
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      },
      studentPerformance: [],
      quizAnalysis: [],
      recommendations: [],
    };

    const allStudents = new Map();
    const allAttempts: any[] = [];
    let totalScore = 0;
    let totalPassed = 0;

    for (const course of courses) {
      insights.overview.totalQuizzes += course.quizzes.length;

      for (const enrollment of course.enrollments) {
        if (!allStudents.has(enrollment.student.id)) {
          allStudents.set(enrollment.student.id, {
            ...enrollment.student,
            courses: [],
            attempts: [],
            totalScore: 0,
            attemptCount: 0,
            passedCount: 0,
          });
        }
        const student = allStudents.get(enrollment.student.id);
        student.courses.push(course.title);
      }

      for (const quiz of course.quizzes) {
        for (const attempt of quiz.attempts) {
          if (attempt.completedAt && attempt.score !== null) {
            allAttempts.push({
              ...attempt,
              quizTitle: quiz.title,
              courseId: course.id,
              courseTitle: course.title,
            });

            const student = allStudents.get(attempt.studentId);
            if (student) {
              student.totalScore += attempt.score;
              student.attemptCount++;
              if (attempt.passed) student.passedCount++;
            }

            totalScore += attempt.score;
            if (attempt.passed) totalPassed++;
          }
        }
      }
    }

    insights.overview.totalStudents = allStudents.size;
    insights.overview.totalAttempts = allAttempts.length;

    if (allAttempts.length > 0) {
      insights.overview.averageScore = totalScore / allAttempts.length;
      insights.overview.passRate = (totalPassed / allAttempts.length) * 100;
    }

    // Student performance analysis
    for (const [id, student] of allStudents) {
      const avgScore = student.attemptCount > 0 ? student.totalScore / student.attemptCount : 0;
      const passRate = student.attemptCount > 0 ? (student.passedCount / student.attemptCount) * 100 : 0;

      insights.studentPerformance.push({
        id: student.id,
        name: student.name,
        disabilityType: student.disabilityType,
        courseCount: student.courses.length,
        attemptCount: student.attemptCount,
        averageScore: avgScore,
        passRate: passRate,
        performance: avgScore >= 80 ? 'excellent' : avgScore >= 60 ? 'good' : avgScore >= 40 ? 'needs_improvement' : 'at_risk',
      });
    }

    // Sort by performance (at_risk first)
    insights.studentPerformance.sort((a: any, b: any) => {
      const order = { at_risk: 0, needs_improvement: 1, good: 2, excellent: 3 };
      return order[a.performance] - order[b.performance];
    });

    // Quiz analysis
    for (const course of courses) {
      for (const quiz of course.quizzes) {
        const completedAttempts = quiz.attempts.filter(a => a.completedAt && a.score !== null);
        if (completedAttempts.length > 0) {
          const avgScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length;
          const passCount = completedAttempts.filter(a => a.passed).length;

          insights.quizAnalysis.push({
            id: quiz.id,
            title: quiz.title,
            course: course.title,
            questionCount: quiz.questions.length,
            attemptCount: completedAttempts.length,
            averageScore: avgScore,
            passRate: (passCount / completedAttempts.length) * 100,
            difficulty: avgScore < 50 ? 'hard' : avgScore > 80 ? 'easy' : 'moderate',
          });
        }
      }
    }

    // Generate recommendations using AI-like logic
    if (insights.studentPerformance.filter((s: any) => s.performance === 'at_risk').length > 0) {
      insights.recommendations.push({
        type: 'alert',
        priority: 'high',
        title: 'Students at Risk',
        message: `${insights.studentPerformance.filter((s: any) => s.performance === 'at_risk').length} student(s) are performing below expectations. Consider providing additional support or one-on-one sessions.`,
      });
    }

    if (insights.overview.passRate < 60) {
      insights.recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Low Pass Rate',
        message: `Overall pass rate is ${insights.overview.passRate.toFixed(1)}%. Consider reviewing quiz difficulty or providing more learning materials.`,
      });
    }

    if (insights.quizAnalysis.filter((q: any) => q.difficulty === 'hard').length > 0) {
      insights.recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Difficult Quizzes Detected',
        message: `${insights.quizAnalysis.filter((q: any) => q.difficulty === 'hard').length} quiz(es) have low average scores. Review questions for clarity and alignment with lessons.`,
      });
    }

    if (insights.overview.averageScore >= 75) {
      insights.recommendations.push({
        type: 'success',
        priority: 'low',
        title: 'Strong Performance',
        message: `Class average is ${insights.overview.averageScore.toFixed(1)}%. Great job! Consider introducing more challenging content to keep students engaged.`,
      });
    }

    // Add accessibility-specific recommendations
    const studentsWithDisabilities = insights.studentPerformance.filter((s: any) => s.disabilityType !== 'NONE');
    if (studentsWithDisabilities.length > 0) {
      insights.recommendations.push({
        type: 'info',
        priority: 'medium',
        title: 'Accessibility Considerations',
        message: `${studentsWithDisabilities.length} student(s) have special accommodations. Ensure all materials are accessible and consider using AI features like TTS and ASR.`,
      });
    }

    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
