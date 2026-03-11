'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAccessibilityStore } from '@/lib/store';
import { TTSButton } from '@/components/assistance/tts-button';
import { ASRButton } from '@/components/assistance/asr-button';
import { GestureRecognition } from '@/components/assistance/gesture-recognition';
import { toast } from 'sonner';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
  XCircle,
  Volume2,
  Mic,
  Loader2,
  Trophy,
  Brain,
  FileIcon,
  ExternalLink,
  AlertCircle,
  Hand,
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  difficultyLevel: number;
  hintUrl?: string | null;
  hintName?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

interface QuizTakerProps {
  quizId: string;
  studentId: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export function QuizTaker({ quizId, studentId, onComplete, onCancel }: QuizTakerProps) {
  const { fontSize, ttsEnabled, asrEnabled, signLanguageEnabled } = useAccessibilityStore();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [usedTTS, setUsedTTS] = useState(false);
  const [usedASR, setUsedASR] = useState(false);
  const [usedSignLang, setUsedSignLang] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes?id=${quizId}`);
        const data = await response.json();
        if (data.success) {
          setQuiz(data.quiz);
          setTimeLeft(data.quiz.timeLimit * 60);
        } else {
          toast.error('Failed to load quiz');
          onCancel();
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        toast.error('Failed to load quiz');
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, onCancel]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleTranscription = (text: string) => {
    setUsedASR(true);
    if (currentQuestion) {
      handleAnswer(currentQuestion.id, text);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);

    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          studentId,
          answers: answersArray,
          usedTTS,
          usedASR,
          usedSignLang,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.attempt);
        onComplete(data.attempt);
      } else {
        toast.error(data.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseOptions = (optionsJson: string | null): string[] => {
    if (!optionsJson) return [];
    try {
      return JSON.parse(optionsJson);
    } catch {
      return optionsJson.split(',').map((s) => s.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quiz...</span>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center p-8">
        <p>Quiz not found</p>
        <Button onClick={onCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6" style={{ fontSize: `${fontSize}px` }}>
        <Card className={result.passed ? 'border-green-500' : result.needsGrading ? 'border-yellow-500' : 'border-red-500'}>
          <CardHeader className="text-center">
            {result.needsGrading ? (
              <>
                <AlertCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <CardTitle className="text-2xl text-yellow-600">Submitted for Grading</CardTitle>
                <CardDescription>Your quiz contains essay questions that need teacher review</CardDescription>
              </>
            ) : result.passed ? (
              <>
                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <CardTitle className="text-2xl text-green-600">Congratulations!</CardTitle>
                <CardDescription>You passed the quiz!</CardDescription>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <CardTitle className="text-2xl text-red-600">Keep Trying!</CardTitle>
                <CardDescription>You didn't pass this time, but don't give up!</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {result.needsGrading ? (
                <div>
                  <p className="text-lg font-medium">Your quiz has been submitted</p>
                  <p className="text-muted-foreground">Your teacher will grade your essay questions and notify you</p>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold">{result.score?.toFixed(1) || 0}%</p>
                  <p className="text-muted-foreground">
                    {result.correctCount} out of {result.totalQuestions} correct
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {usedTTS && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> TTS Used
                </Badge>
              )}
              {usedASR && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mic className="h-3 w-3" /> STT Used
                </Badge>
              )}
              {usedSignLang && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Hand className="h-3 w-3" /> Sign Lang Used
                </Badge>
              )}
            </div>

            {!result.needsGrading && (
              <Progress value={result.score || 0} className="h-4" />
            )}

            {/* Answer review - only show if fully graded */}
            {!result.needsGrading && result.gradedAnswers && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">Review Your Answers</h3>
                {result.gradedAnswers.map((answer: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">Q{index + 1}: {answer.questionText}</p>
                        <p className="text-sm">Your answer: {answer.answer}</p>
                        {!answer.isCorrect && (
                          <p className="text-sm text-green-600">Correct: {answer.correctAnswer}</p>
                        )}
                        {answer.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">{answer.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={onCancel} size="lg">
              Return to Course
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={timeLeft < 60 ? 'destructive' : 'outline'} className="text-lg">
            <Clock className="h-4 w-4 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={(currentQuestionIndex / quiz.questions.length) * 100} className="mb-6" />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">
                {currentQuestion?.questionText}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {currentQuestion?.difficultyLevel && (
                  <Badge variant="outline">
                    Level {currentQuestion.difficultyLevel}
                  </Badge>
                )}
                {currentQuestion?.points && (
                  <Badge variant="secondary">
                    {currentQuestion.points} pt{currentQuestion.points > 1 ? 's' : ''}
                  </Badge>
                )}
                {currentQuestion?.questionType === 'essay' && (
                  <Badge variant="outline" className="text-yellow-600">
                    Teacher Graded
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {/* TTS Button */}
              <TTSButton
                text={currentQuestion?.questionText || ''}
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
                variant="outline"
                size="default"
                onClick={() => setUsedTTS(true)}
              />
              {/* ASR Button */}
              {asrEnabled && (currentQuestion?.questionType === 'identification' || currentQuestion?.questionType === 'essay') && (
                <ASRButton
                  onTranscription={handleTranscription}
                  variant="outline"
                  size="default"
                />
              )}
            </div>
          </div>
          
          {/* Hint/Reference File */}
          {currentQuestion?.hintUrl && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Reference Material:
                </span>
                <a 
                  href={currentQuestion.hintUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {currentQuestion.hintName || 'View Reference'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multiple Choice / True-False */}
          {(currentQuestion?.questionType === 'multiple_choice' || currentQuestion?.questionType === 'true_false') && (
            <RadioGroup
              value={answers[currentQuestion?.id || ''] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion?.id || '', value)}
              className="space-y-3"
            >
              {parseOptions(currentQuestion?.options).map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    answers[currentQuestion?.id || ''] === option
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                  <TTSButton
                    text={option}
                    variant="ghost"
                    size="sm"
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                    onClick={() => setUsedTTS(true)}
                  />
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Identification */}
          {currentQuestion?.questionType === 'identification' && (
            <div className="space-y-3">
              <Label htmlFor="answer">Your Answer</Label>
              <div className="flex gap-2">
                <Input
                  id="answer"
                  placeholder="Type your answer..."
                  value={answers[currentQuestion?.id || ''] || ''}
                  onChange={(e) => handleAnswer(currentQuestion?.id || '', e.target.value)}
                  className="flex-1"
                />
                {asrEnabled && (
                  <ASRButton
                    onTranscription={handleTranscription}
                    variant="outline"
                  />
                )}
              </div>
            </div>
          )}

          {/* Essay */}
          {currentQuestion?.questionType === 'essay' && (
            <div className="space-y-3">
              <Label htmlFor="essay">Your Answer</Label>
              <p className="text-sm text-muted-foreground">This question will be graded by your teacher</p>
              <div className="space-y-2">
                <textarea
                  id="essay"
                  className="w-full min-h-40 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Write your answer here..."
                  value={answers[currentQuestion?.id || ''] || ''}
                  onChange={(e) => handleAnswer(currentQuestion?.id || '', e.target.value)}
                />
                {asrEnabled && (
                  <div className="flex items-center gap-2">
                    <ASRButton
                      onTranscription={handleTranscription}
                      variant="outline"
                      size="sm"
                    />
                    <span className="text-sm text-muted-foreground">Use voice to text</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* AI Assistive Features Notice */}
      <Card className="mt-4 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-medium">AI Assistance Available</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Volume2 className="h-4 w-4" />
                <span>🔊 TTS: Hear questions & options read aloud</span>
              </div>
              {asrEnabled && (
                <div className="flex items-center gap-1">
                  <Mic className="h-4 w-4" />
                  <span>🎤 STT: Speak your answers for written questions</span>
                </div>
              )}
              {signLanguageEnabled && (
                <Badge variant="outline" className="text-blue-600">
                  Sign Language Mode Active
                </Badge>
              )}
            </div>
            {quiz.questions.some(q => q.questionType === 'essay') && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Note: This quiz contains essay questions that require teacher grading.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <div className="mt-4 flex flex-wrap gap-2">
        {quiz.questions.map((q, index) => (
          <Button
            key={q.id}
            variant={answers[q.id] ? 'default' : 'outline'}
            size="sm"
            className={`w-10 h-10 ${currentQuestionIndex === index ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      {/* Sign Language Recognition */}
      {signLanguageEnabled && (
        <Card className="mt-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hand className="h-5 w-5 text-blue-600" />
              Sign Language Recognition
            </CardTitle>
            <CardDescription>
              Use sign language to communicate your answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GestureRecognition
              onResult={(result) => {
                setUsedSignLang(true);
                if (currentQuestion) {
                  handleAnswer(currentQuestion.id, result);
                }
                toast.success('Sign recognized: ' + result);
              }}
              mode="sign_language"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
