'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Info, AlertTriangle, TrendingUp, Users, BookOpen, Target, Brain, Loader2 } from 'lucide-react';

interface Insight {
  type: string;
  priority: string;
  title: string;
  message: string;
}

interface StudentPerformance {
  id: string;
  name: string;
  disabilityType: string;
  courseCount: number;
  attemptCount: number;
  averageScore: number;
  passRate: number;
  performance: string;
}

interface QuizAnalysis {
  id: string;
  title: string;
  course: string;
  questionCount: number;
  attemptCount: number;
  averageScore: number;
  passRate: number;
  difficulty: string;
}

interface InsightsData {
  overview: {
    totalStudents: number;
    totalCourses: number;
    totalQuizzes: number;
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  };
  studentPerformance: StudentPerformance[];
  quizAnalysis: QuizAnalysis[];
  recommendations: Insight[];
}

interface AIInsightsProps {
  teacherId: string;
}

export function AIInsights({ teacherId }: AIInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [teacherId]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/insights?teacherId=${teacherId}`);
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'suggestion':
        return <Target className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'needs_improvement':
        return 'bg-yellow-500';
      case 'at_risk':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'needs_improvement':
        return 'Needs Improvement';
      case 'at_risk':
        return 'At Risk';
      default:
        return 'N/A';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Analyzing student performance...</span>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p>Unable to load insights. Try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.overview.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.overview.totalQuizzes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.overview.averageScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.overview.passRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions based on student performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.priority === 'high'
                      ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                      : rec.priority === 'medium'
                      ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                      : 'border-green-200 bg-green-50 dark:bg-green-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(rec.type)}
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Student Performance Overview</CardTitle>
          <CardDescription>Individual student performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.studentPerformance.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No student data available yet</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {insights.studentPerformance.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.courseCount} course(s) • {student.attemptCount} attempt(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">{student.averageScore.toFixed(1)}%</p>
                        <Progress value={student.averageScore} className="w-20 h-2" />
                      </div>
                      <Badge className={`${getPerformanceColor(student.performance)} text-white`}>
                        {getPerformanceLabel(student.performance)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quiz Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Analysis</CardTitle>
          <CardDescription>Performance breakdown by quiz</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.quizAnalysis.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No quiz data available yet</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {insights.quizAnalysis.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.course} • {quiz.questionCount} questions • {quiz.attemptCount} attempts
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">{quiz.averageScore.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Pass: {quiz.passRate.toFixed(0)}%</p>
                      </div>
                      <Badge className={`${getDifficultyColor(quiz.difficulty)} text-white capitalize`}>
                        {quiz.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
