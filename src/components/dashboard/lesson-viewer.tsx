'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAccessibilityStore, useAuthStore } from '@/lib/store';
import { normalizeFileUrl } from '@/lib/utils';
import { TTSButton } from '@/components/assistance/tts-button';
import { ASRButton } from '@/components/assistance/asr-button';
import { GestureRecognition } from '@/components/assistance/gesture-recognition';
// SPED-Exclusive Features
import { ContentSimplifier } from '@/components/assistance/content-simplifier';
import { EncouragementSystem } from '@/components/assistance/encouragement-system';
import { AITutorChatbot } from '@/components/assistance/ai-tutor-chatbot';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Volume2,
  Mic,
  Loader2,
  CheckCircle,
  FileIcon,
  ExternalLink,
  Brain,
  Sparkles,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string;
  order: number;
  difficultyLevel: number;
  estimatedTime: number;
  hasTranscript: boolean;
  transcript: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  referenceUrl?: string | null;
  referenceName?: string | null;
}

interface LessonViewerProps {
  lessonId: string;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function LessonViewer({
  lessonId,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: LessonViewerProps) {
  const { fontSize, highContrast, ttsEnabled, asrEnabled, signLanguageEnabled } = useAccessibilityStore();
  const { user } = useAuthStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');

  // Check if user has learning disability
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/lessons?id=${lessonId}`);
        const data = await response.json();
        if (data.success) {
          setLesson(data.lesson);
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleComplete = () => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[level] || 'bg-yellow-500';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Intermediate';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading lesson...</span>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center p-8">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p>Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <BookOpen className="h-4 w-4" />
          <span>Lesson {lesson.order}</span>
          <span>•</span>
          <Clock className="h-4 w-4" />
          <span>{lesson.estimatedTime} min</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <Badge className={`${getDifficultyColor(lesson.difficultyLevel)} text-white`}>
            {getDifficultyLabel(lesson.difficultyLevel)}
          </Badge>
          {lesson.hasTranscript && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Transcript Available
            </Badge>
          )}
        </div>
      </div>

      {/* TTS Control */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-medium">AI Learning Assistance</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Listen:</span>
              <TTSButton
                text={`${lesson.title}. ${lesson.description || ''}. ${lesson.content}`}
                variant="outline"
                size="sm"
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
              />
            </div>
            {asrEnabled && (
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voice notes available below</span>
              </div>
            )}
            {signLanguageEnabled && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-600">
                  Sign Language Mode Active
                </Badge>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            AI-powered tools to help you learn better. Use text-to-speech to hear content read aloud.
          </p>
        </CardContent>
      </Card>

      {/* Sign Language Recognition (if enabled) */}
      {signLanguageEnabled && (
        <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-blue-600" />
              Sign Language Recognition
            </CardTitle>
            <CardDescription>
              Use sign language to navigate or communicate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GestureRecognition
              onResult={(result) => {
                toast.success('Gesture recognized: ' + result);
              }}
              mode="sign_language"
            />
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Reading Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* SPED-Exclusive: Encouragement System */}
      {hasLearningDisability && (
        <EncouragementSystem context="lesson" className="mb-6" />
      )}

      {/* Lesson Content */}
      <Card>
        <CardContent className="prose prose-sm max-w-none py-6">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
              ),
            }}
          >
            {lesson.content}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* SPED-Exclusive: Content Simplifier */}
      {hasLearningDisability && (
        <ContentSimplifier
          content={lesson.content}
          title={lesson.title}
          className="mt-6"
        />
      )}

      {/* Reference Material */}
      {lesson.referenceUrl && (
        <Card className="mt-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileIcon className="h-5 w-5 text-blue-600" />
              Reference Material
            </CardTitle>
            <CardDescription>
              Additional resources to help you understand this lesson
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium">{lesson.referenceName || 'Reference File'}</p>
                <p className="text-sm text-muted-foreground">Click to open or download</p>
              </div>
              <Button asChild>
                <a 
                  href={normalizeFileUrl(lesson.referenceUrl) || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Section */}
      {lesson.hasTranscript && lesson.transcript && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Transcript
            </CardTitle>
            <CardDescription>
              Read along with the audio content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{lesson.transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes Section with Voice Input */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Notes
          </CardTitle>
          <CardDescription>
            Take notes while learning - use voice or type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
            className="w-full min-h-24 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="flex items-center gap-2">
            {asrEnabled && (
              <>
                <ASRButton
                  onTranscription={(text) => setNotes(prev => prev + ' ' + text)}
                  variant="outline"
                  size="sm"
                />
                <span className="text-sm text-muted-foreground">Use voice to dictate notes</span>
              </>
            )}
            <TTSButton
              text={notes || "Your notes will be read aloud"}
              variant="ghost"
              size="sm"
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      {isCompleted && (
        <Card className="mt-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Lesson Completed!</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Lesson
        </Button>

        {!isCompleted ? (
          <Button onClick={handleComplete}>
            Mark as Complete
          </Button>
        ) : hasNext ? (
          <Button onClick={onNext}>
            Next Lesson
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Last Lesson
          </Button>
        )}
      </div>

      {/* SPED-Exclusive: AI Tutor Chatbot (Floating) */}
      <AITutorChatbot
        lessonContext={{
          title: lesson.title,
          content: lesson.content,
        }}
      />
    </div>
  );
}
