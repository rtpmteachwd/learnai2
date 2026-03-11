'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore, useAccessibilityStore, useNavStore } from '@/lib/store';
import { TTSButton } from '@/components/assistance/tts-button';
import { ASRButton } from '@/components/assistance/asr-button';
import { QuizTaker } from '@/components/dashboard/quiz-taker';
import { LessonViewer } from '@/components/dashboard/lesson-viewer';
import { AssignmentSubmission } from '@/components/dashboard/assignment-submission';
import { GestureRecognition } from '@/components/assistance/gesture-recognition';
// SPED-Exclusive Features
import { SocialStoryGenerator } from '@/components/assistance/social-story-generator';
import { EncouragementSystem } from '@/components/assistance/encouragement-system';
import { toast } from 'sonner';
import {
  BookOpen,
  FileText,
  Trophy,
  Clock,
  TrendingUp,
  Target,
  Brain,
  Volume2,
  Mic,
  Play,
  Eye,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle,
  AlertCircle,
  Heart,
  Sparkles,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  difficultyLevel: number;
  progress?: number;
  teacher?: { name: string };
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  difficultyLevel: number;
  estimatedTime: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  questions?: any[];
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  course?: { title: string };
  submissions?: any[];
}

export function StudentDashboard() {
  const { user } = useAuthStore();
  const { fontSize, ttsEnabled, asrEnabled, signLanguageEnabled } = useAccessibilityStore();
  const { activeSection, setActiveSection } = useNavStore();
  
  // Check if user has learning disability for SPED-exclusive features
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View states
  const [currentView, setCurrentView] = useState<'dashboard' | 'course' | 'lesson' | 'quiz' | 'assignment'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  
  // Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Active tab state for controlled Tabs
  const [activeTab, setActiveTab] = useState('courses');

  // Sync with nav store - scroll to top and change tab when sidebar is clicked
  useEffect(() => {
    // Reset view to dashboard and clear selections
    setCurrentView('dashboard');
    setSelectedCourse(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setSelectedAssignment(null);
    
    // Map sidebar sections to tabs
    const sectionToTab: Record<string, string> = {
      'dashboard': 'courses',
      'courses': 'courses',
      'quizzes': 'results',
      'progress': 'progress',
      'feedback': 'feedback',
    };
    
    if (sectionToTab[activeSection]) {
      setActiveTab(sectionToTab[activeSection]);
    }
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch courses
      const coursesRes = await fetch(`/api/courses?studentId=${user.id}`);
      const coursesData = await coursesRes.json();
      if (coursesData.success) {
        setCourses(coursesData.courses);
      }

      // Fetch assignments
      const assignmentsRes = await fetch(`/api/assignments?studentId=${user.id}`);
      const assignmentsData = await assignmentsRes.json();
      if (assignmentsData.success) {
        setAssignments(assignmentsData.assignments);
      }

      // Fetch analytics
      const analyticsRes = await fetch(`/api/analytics?studentId=${user.id}`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      // Fetch quiz results
      const resultsRes = await fetch(`/api/quiz-attempts?studentId=${user.id}`);
      const resultsData = await resultsRes.json();
      if (resultsData.success) {
        setQuizResults(resultsData.attempts || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseContent = async (courseId: string) => {
    try {
      const [lessonsRes, quizzesRes, assignmentsRes] = await Promise.all([
        fetch(`/api/lessons?courseId=${courseId}`),
        fetch(`/api/quizzes?courseId=${courseId}`),
        fetch(`/api/assignments?courseId=${courseId}`),
      ]);

      const [lessonsData, quizzesData, assignmentsData] = await Promise.all([
        lessonsRes.json(),
        quizzesRes.json(),
        assignmentsRes.json(),
      ]);

      if (lessonsData.success) setCourseLessons(lessonsData.lessons);
      if (quizzesData.success) setCourseQuizzes(quizzesData.quizzes);
      if (assignmentsData.success) setCourseAssignments(assignmentsData.assignments);
    } catch (error) {
      console.error('Failed to fetch course content:', error);
    }
  };

  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    setActiveSection('courses');
    fetchCourseContent(course.id);
  };

  const handleOpenLesson = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setCurrentView('lesson');
  };

  const handleOpenQuiz = (quizId: string) => {
    setSelectedQuiz(quizId);
    setCurrentView('quiz');
  };

  const handleBackToCourse = () => {
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setSelectedAssignment(null);
    setCurrentView('course');
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setSelectedAssignment(null);
    setCurrentView('dashboard');
    setActiveSection('dashboard');
  };

  const handleQuizComplete = (result: any) => {
    toast.success(`Quiz completed! Score: ${result.score?.toFixed(1) || 0}%`);
    fetchData();
  };

  const handleOpenAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('assignment');
  };

  const handleAssignmentSubmitSuccess = () => {
    fetchData();
    if (selectedCourse) {
      fetchCourseContent(selectedCourse.id);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: 'suggestion',
          category: 'general',
          message: feedbackMessage,
        }),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!');
        setFeedbackMessage('');
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Intermediate';
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[level] || 'bg-yellow-500';
  };

  // Lesson navigation
  const getCurrentLessonIndex = () => {
    if (!selectedLesson || !courseLessons.length) return -1;
    return courseLessons.findIndex(l => l.id === selectedLesson);
  };

  const handleNextLesson = () => {
    const index = getCurrentLessonIndex();
    if (index < courseLessons.length - 1) {
      setSelectedLesson(courseLessons[index + 1].id);
    }
  };

  const handlePreviousLesson = () => {
    const index = getCurrentLessonIndex();
    if (index > 0) {
      setSelectedLesson(courseLessons[index - 1].id);
    }
  };

  // Quiz View
  if (currentView === 'quiz' && selectedQuiz) {
    return (
      <div>
        <div className="p-4 border-b bg-card">
          <Button variant="ghost" onClick={handleBackToCourse}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
        <QuizTaker
          quizId={selectedQuiz}
          studentId={user?.id || ''}
          onComplete={handleQuizComplete}
          onCancel={handleBackToCourse}
        />
      </div>
    );
  }

  // Lesson View
  if (currentView === 'lesson' && selectedLesson) {
    return (
      <div>
        <div className="p-4 border-b bg-card">
          <Button variant="ghost" onClick={handleBackToCourse}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
        <LessonViewer
          lessonId={selectedLesson}
          onComplete={() => toast.success('Lesson completed!')}
          onNext={handleNextLesson}
          onPrevious={handlePreviousLesson}
          hasNext={getCurrentLessonIndex() < courseLessons.length - 1}
          hasPrevious={getCurrentLessonIndex() > 0}
        />
      </div>
    );
  }

  // Assignment Submission View
  if (currentView === 'assignment' && selectedAssignment) {
    return (
      <div>
        <div className="p-4 border-b bg-card">
          <Button variant="ghost" onClick={handleBackToCourse}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
        <div className="p-6">
          <AssignmentSubmission
            assignment={selectedAssignment}
            studentId={user?.id || ''}
            onClose={handleBackToCourse}
            onSubmitSuccess={handleAssignmentSubmitSuccess}
          />
        </div>
      </div>
    );
  }

  // Course View
  if (currentView === 'course' && selectedCourse) {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <Button variant="ghost" onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Course Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedCourse.title}</h1>
            <p className="text-muted-foreground">{selectedCourse.subject}</p>
            {selectedCourse.description && (
              <p className="mt-2">{selectedCourse.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getDifficultyColor(selectedCourse.difficultyLevel)} text-white`}>
              {getDifficultyLabel(selectedCourse.difficultyLevel)}
            </Badge>
            <TTSButton 
              text={`${selectedCourse.title}. ${selectedCourse.description || ''}`} 
              variant="outline"
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lessons ({courseLessons.length})
              </CardTitle>
              <CardDescription>Click on a lesson to start learning</CardDescription>
            </CardHeader>
            <CardContent>
              {courseLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No lessons available yet</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-2">
                    {courseLessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenLesson(lesson.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Level {lesson.difficultyLevel} • {lesson.estimatedTime} min
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quizzes ({courseQuizzes.length})
              </CardTitle>
              <CardDescription>Test your knowledge with AI-assisted quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {courseQuizzes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No quizzes available yet</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-2">
                    {courseQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.timeLimit} mins • Pass: {quiz.passingScore}% • {quiz.questions?.length || 0} questions
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleOpenQuiz(quiz.id)}>
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Assignments ({courseAssignments.length})
              </CardTitle>
              <CardDescription>Your assignments for this course</CardDescription>
            </CardHeader>
            <CardContent>
              {courseAssignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No assignments available yet</p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-2">
                    {courseAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()} • Max Score: {assignment.maxScore}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.submissions && assignment.submissions.length > 0 ? (
                            <>
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => handleOpenAssignment(assignment)}>
                                View/Edit
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => handleOpenAssignment(assignment)}>
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Sign Language Feature */}
        {signLanguageEnabled && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                Sign Language Recognition
              </CardTitle>
              <CardDescription>Use your camera to communicate using sign language</CardDescription>
            </CardHeader>
            <CardContent>
              <GestureRecognition
                onResult={(result) => {
                  toast.success('Gesture recognized!');
                }}
                mode="sign_language"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Welcome, {user?.name}! 👋</h1>
          <p className="text-sm md:text-base text-muted-foreground">Ready to continue your learning journey?</p>
        </div>
        <TTSButton text={`Welcome ${user?.name}. You have ${courses.length} courses in progress.`} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{analytics?.stats?.avgScore?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Quizzes Passed</CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{analytics?.stats?.passedQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground">Pass rate: {analytics?.stats?.quizPassRate?.toFixed(0) || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Assignments</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistive Features Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium">Text-to-Speech</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-xs md:text-sm font-medium">Speech-to-Text</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground w-full sm:w-auto sm:ml-auto">
              Use the accessibility toolbar (⚙️) to enable AI assistive features
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="courses" onClick={() => setActiveSection('courses')} className="gap-1 md:gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">My Courses</span>
            <span className="sm:hidden">Courses</span>
          </TabsTrigger>
          <TabsTrigger value="results" onClick={() => setActiveSection('quizzes')} className="gap-1 md:gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">My Results</span>
            <span className="sm:hidden">Results</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" onClick={() => setActiveSection('dashboard')} className="gap-1 md:gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          {signLanguageEnabled && (
            <TabsTrigger value="signlang" onClick={() => setActiveSection('dashboard')} className="gap-1 md:gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Language</span>
              <span className="sm:hidden">Sign</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="progress" onClick={() => setActiveSection('progress')} className="gap-1 md:gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">My Progress</span>
            <span className="sm:hidden">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" onClick={() => setActiveSection('feedback')} className="gap-1 md:gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
            <span className="sm:hidden">Feedback</span>
          </TabsTrigger>
          {/* SPED-Exclusive Tab - Only visible for students with learning disability */}
          {hasLearningDisability && (
            <TabsTrigger value="sped-features" onClick={() => setActiveSection('dashboard')} className="gap-1 md:gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">My Helper Tools</span>
              <span className="sm:hidden">Helper</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground">Your teacher will assign courses to you soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOpenCourse(course)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.subject}</CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs text-white ${getDifficultyColor(course.difficultyLevel)}`}>
                        {getDifficultyLabel(course.difficultyLevel)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <Progress value={course.progress || 0} />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        Teacher: {course.teacher?.name || 'N/A'}
                      </span>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleOpenCourse(course); }}>
                        <Eye className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Quiz Results</CardTitle>
              <CardDescription>View your quiz scores and teacher feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {quizResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quiz results yet. Complete a quiz to see your results!</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3 pr-4">
                    {quizResults.map((result) => (
                      <div key={result.id} className={`p-4 border rounded-lg ${result.needsGrading ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : result.passed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{result.quiz?.title || 'Quiz'}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'In progress'}
                            </p>
                          </div>
                          <div className="text-right">
                            {result.needsGrading ? (
                              <Badge variant="outline" className="text-yellow-600">
                                Pending Review
                              </Badge>
                            ) : result.score !== null ? (
                              <>
                                <p className={`text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {result.score.toFixed(1)}%
                                </p>
                                <Badge className={result.passed ? 'bg-green-500' : 'bg-red-500'}>
                                  {result.passed ? 'Passed' : 'Failed'}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline">In Progress</Badge>
                            )}
                          </div>
                        </div>
                        {result.teacherComments && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">Teacher Feedback:</p>
                            <p className="text-muted-foreground">{result.teacherComments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <CardDescription>View and submit your assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const submission = assignment.submissions?.[0];
                    const isSubmitted = !!submission;
                    const isGraded = submission?.score !== null && submission?.score !== undefined;
                    const needsResubmission = submission?.needsResubmission;
                    const isOverdue = new Date(assignment.dueDate) < new Date() && !isSubmitted;
                    
                    return (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.course?.title} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {needsResubmission ? (
                              <>
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Resubmit Required
                                </Badge>
                                <Button size="sm" onClick={() => handleOpenAssignment(assignment)}>
                                  Resubmit
                                </Button>
                              </>
                            ) : isGraded ? (
                              <>
                                <Badge className="bg-green-500 text-white flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Graded: {submission.score}/{assignment.maxScore}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => handleOpenAssignment(assignment)}>
                                  View Feedback
                                </Button>
                              </>
                            ) : isSubmitted ? (
                              <>
                                <Badge className="bg-blue-500 text-white flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Submitted
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => handleOpenAssignment(assignment)}>
                                  View/Edit
                                </Button>
                              </>
                            ) : isOverdue ? (
                              <>
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Overdue
                                </Badge>
                                {assignment.allowLateSubmission && (
                                  <Button size="sm" onClick={() => handleOpenAssignment(assignment)}>
                                    Submit Late
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button size="sm" onClick={() => handleOpenAssignment(assignment)}>
                                View & Submit
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Show feedback if graded */}
                        {isGraded && submission?.feedback && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Teacher Feedback:</p>
                            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                          </div>
                        )}
                        
                        {/* Show resubmission note if requested */}
                        {needsResubmission && submission?.resubmissionNote && (
                          <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                            <p className="text-sm font-medium text-destructive">Resubmission Required:</p>
                            <p className="text-sm text-muted-foreground">{submission.resubmissionNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signlang" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Sign Language Recognition
              </CardTitle>
              <CardDescription>
                Use your camera to communicate using sign language. Our AI will interpret your gestures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GestureRecognition
                onResult={(result) => {
                  console.log('Sign language recognized:', result);
                }}
                mode="sign_language"
              />
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">How Sign Language Recognition Helps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Communication Support</p>
                  <p className="text-sm text-muted-foreground">
                    Students with hearing or speech impairments can use sign language to communicate with the system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Learning Assistance</p>
                  <p className="text-sm text-muted-foreground">
                    Use sign language to answer quiz questions or submit assignment responses.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Filipino Sign Language (FSL)</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI is trained to recognize common Filipino Sign Language gestures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Track your performance and growth</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.performanceRecords?.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4 pr-4">
                    {analytics.performanceRecords.slice(0, 20).map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium capitalize">{record.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.recordedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{record.percentage.toFixed(1)}%</p>
                          <Progress value={record.percentage} className="w-24 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete activities to see your progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Feedback</CardTitle>
              <CardDescription>Help us improve LearnAI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Feedback</label>
                <Textarea
                  placeholder="Share your experience, suggestions, or report any issues..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="min-h-32"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Use AI assistance:</span>
                <TTSButton text="Share your experience, suggestions, or report any issues" variant="ghost" size="sm" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                {asrEnabled && (
                  <ASRButton onTranscription={(text) => setFeedbackMessage(prev => prev + ' ' + text)} variant="ghost" size="sm" />
                )}
              </div>
              <Button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback || !feedbackMessage.trim()}>
                {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPED-Exclusive Features Tab - Only visible for students with learning disability */}
        {hasLearningDisability && (
          <TabsContent value="sped-features" className="space-y-6">
            {/* Welcome Message */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-700">
                      Hi {user?.name?.split(' ')[0]}! 💜
                    </h2>
                    <p className="text-purple-600">
                      These special tools are here to help you learn better!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Encouragement */}
            <EncouragementSystem context="general" />

            {/* Social Story Generator */}
            <SocialStoryGenerator />

            {/* Tips Card */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-yellow-600" />
                  Tips for Using These Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="font-medium">Ask for Help Anytime</p>
                    <p className="text-sm text-muted-foreground">
                      Click the purple sparkly button in the bottom right corner to chat with your AI Learning Buddy!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📖</span>
                  <div>
                    <p className="font-medium">Simplify Difficult Lessons</p>
                    <p className="text-sm text-muted-foreground">
                      When reading a lesson, look for the "Simplify This Lesson" button to make it easier to understand.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📚</span>
                  <div>
                    <p className="font-medium">Social Stories</p>
                    <p className="text-sm text-muted-foreground">
                      Use the Social Story Generator above to create stories that help you understand different situations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
