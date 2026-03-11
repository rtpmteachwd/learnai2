'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface EssayAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number | null;
  passed: boolean;
  needsGrading: boolean;
  completedAt: string;
  answers: string;
  quiz: {
    title: string;
    courseId: string;
    course: { teacherId: string };
  };
  student: {
    name: string;
    email: string;
  };
}

interface ParsedAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  explanation?: string;
  points: number;
  needsGrading?: boolean;
}

interface EssayGradingProps {
  teacherId: string;
}

export function EssayGrading({ teacherId }: EssayGradingProps) {
  const [attempts, setAttempts] = useState<EssayAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<EssayAttempt | null>(null);
  const [answers, setAnswers] = useState<ParsedAnswer[]>([]);
  const [teacherComments, setTeacherComments] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    fetchPendingGrading();
  }, [teacherId]);

  const fetchPendingGrading = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quiz-attempts?needsGrading=true`);
      const data = await response.json();
      if (data.success) {
        // Filter only attempts from teacher's courses
        const teacherAttempts = data.attempts.filter(
          (a: EssayAttempt) => a.quiz.course?.teacherId === teacherId
        );
        setAttempts(teacherAttempts);
      }
    } catch (error) {
      console.error('Failed to fetch pending grading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAttempt = (attempt: EssayAttempt) => {
    setSelectedAttempt(attempt);
    try {
      const parsed = JSON.parse(attempt.answers);
      setAnswers(parsed);
    } catch {
      setAnswers([]);
    }
    setTeacherComments('');
  };

  const handleGradeAnswer = (index: number, isCorrect: boolean, partialPoints?: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = {
      ...newAnswers[index],
      isCorrect,
      partialPoints: partialPoints !== undefined ? partialPoints : (isCorrect ? newAnswers[index].points : 0),
    };
    setAnswers(newAnswers);
  };

  const handleSubmitGrading = async () => {
    if (!selectedAttempt) return;

    // Check if all essay questions are graded
    const ungradedEssays = answers.filter(
      (a) => a.questionType === 'essay' && a.isCorrect === null
    );
    if (ungradedEssays.length > 0) {
      toast.error('Please grade all essay questions before submitting');
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch('/api/quiz-attempts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: selectedAttempt.id,
          gradedAnswers: answers,
          teacherComments,
          teacherId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Quiz graded successfully! Student has been notified.');
        setSelectedAttempt(null);
        fetchPendingGrading();
      } else {
        toast.error(data.error || 'Failed to submit grading');
      }
    } catch (error) {
      toast.error('Failed to submit grading');
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pending submissions...</span>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">No essay submissions pending for grading.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedAttempt) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedAttempt(null)}>
          ← Back to Pending Submissions
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Grading: {selectedAttempt.quiz.title}
            </CardTitle>
            <CardDescription>
              Student: {selectedAttempt.student.name} ({selectedAttempt.student.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {answers.map((answer, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="secondary" className="capitalize">
                        {answer.questionType.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{answer.points} pts</Badge>
                    </div>
                    {answer.questionType !== 'essay' && (
                      <Badge className={answer.isCorrect ? 'bg-green-500' : 'bg-red-500'}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mb-2">{answer.questionText}</p>
                  
                  <div className="bg-muted p-3 rounded mb-3">
                    <p className="text-sm font-medium mb-1">Student's Answer:</p>
                    <p className="text-sm">{answer.answer || <em className="text-muted-foreground">No answer provided</em>}</p>
                  </div>

                  {answer.questionType !== 'essay' && (
                    <p className="text-sm text-green-600">
                      Correct Answer: {answer.correctAnswer}
                    </p>
                  )}

                  {answer.questionType === 'essay' && (
                    <div className="space-y-3 border-t pt-3 mt-3">
                      <Label>Grade this essay:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={answer.isCorrect === true ? 'default' : 'outline'}
                          onClick={() => handleGradeAnswer(index, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Full Points
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const points = prompt(`Enter points (0-${answer.points}):`, '0');
                            if (points !== null) {
                              const pts = parseInt(points);
                              if (!isNaN(pts) && pts >= 0 && pts <= answer.points) {
                                handleGradeAnswer(index, pts === answer.points, pts);
                              }
                            }
                          }}
                        >
                          Partial Points
                        </Button>
                        <Button
                          size="sm"
                          variant={answer.isCorrect === false ? 'destructive' : 'outline'}
                          onClick={() => handleGradeAnswer(index, false, 0)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          No Points
                        </Button>
                      </div>
                      {answer.partialPoints !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          Points awarded: {answer.partialPoints} / {answer.points}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="comments">Comments for Student (Optional)</Label>
                <Textarea
                  id="comments"
                  value={teacherComments}
                  onChange={(e) => setTeacherComments(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  className="min-h-24"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedAttempt(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitGrading} disabled={isGrading}>
                  {isGrading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit Grades
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Pending Essay Submissions
        </CardTitle>
        <CardDescription>
          {attempts.length} submission(s) require manual grading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3 pr-4">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSelectAttempt(attempt)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{attempt.student.name}</p>
                    <p className="text-sm text-muted-foreground">{attempt.quiz.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm">Grade</Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
