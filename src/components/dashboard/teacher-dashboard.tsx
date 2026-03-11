'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore, useAccessibilityStore, useNavStore } from '@/lib/store';
import { QuestionManager } from '@/components/dashboard/question-manager';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { EssayGrading } from '@/components/dashboard/essay-grading';
import { SubmissionViewer } from '@/components/dashboard/submission-viewer';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  Brain,
  Plus,
  FileText,
  BarChart3,
  Loader2,
  Eye,
  UserPlus,
  Trash2,
  Edit,
  ArrowLeft,
  GraduationCap,
  Clock,
  Calendar,
  ListOrdered,
  Settings,
  Upload,
  FileIcon,
  X,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  disabilityType: string;
  grade?: string;
  section?: string;
}

interface Course {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string | null;
  difficultyLevel: number;
  isPublished: boolean;
  _count?: {
    enrollments: number;
    lessons: number;
    quizzes: number;
  };
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
  isAdaptive: boolean;
  questions?: any[];
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress: number;
  currentLevel: number;
  student: Student;
}

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'EPP/TLE'];

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const { fontSize } = useAccessibilityStore();
  const { activeSection, setActiveSection } = useNavStore();
  
  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // View states
  const [currentView, setCurrentView] = useState<'main' | 'course' | 'questions' | 'insights' | 'grading' | 'students' | 'quizzes' | 'analytics' | 'submissions'>('main');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<Enrollment[]>([]);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'assignments' | 'students'>('lessons');
  
  // Dialog states
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  
  // Form states
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // New course form
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    difficultyLevel: '3',
  });
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  
  // New lesson form
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    difficultyLevel: '3',
    estimatedTime: '30',
    referenceUrl: '',
    referenceName: '',
  });
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isUploadingLesson, setIsUploadingLesson] = useState(false);
  
  // New quiz form
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    timeLimit: '15',
    passingScore: '60',
    maxAttempts: '3',
  });
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  
  // New assignment form
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: '100',
  });
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Sync with nav store - handle sidebar navigation
  useEffect(() => {
    // Map sidebar sections to views
    const sectionToView: Record<string, 'main' | 'students' | 'quizzes' | 'analytics'> = {
      'dashboard': 'main',
      'courses': 'main',
      'students': 'students',
      'quizzes': 'quizzes',
      'analytics': 'analytics',
    };
    
    // Reset selections when sidebar section changes
    setSelectedCourse(null);
    setSelectedQuiz(null);
    
    // Set the appropriate view
    if (sectionToView[activeSection]) {
      setCurrentView(sectionToView[activeSection]);
    }
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const coursesRes = await fetch(`/api/courses?teacherId=${user.id}`);
      const coursesData = await coursesRes.json();
      if (coursesData.success) {
        setCourses(coursesData.courses);
      }

      const analyticsRes = await fetch(`/api/analytics?teacherId=${user.id}`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
        setStudents(analyticsData.analytics.students || []);
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
      const [lessonsRes, quizzesRes, assignmentsRes, enrollmentsRes] = await Promise.all([
        fetch(`/api/lessons?courseId=${courseId}`),
        fetch(`/api/quizzes?courseId=${courseId}`),
        fetch(`/api/assignments?courseId=${courseId}`),
        fetch(`/api/courses/${courseId}/enrollments`),
      ]);

      const [lessonsData, quizzesData, assignmentsData, enrollmentsData] = await Promise.all([
        lessonsRes.json(),
        quizzesRes.json(),
        assignmentsRes.json(),
        enrollmentsRes.json(),
      ]);

      if (lessonsData.success) setCourseLessons(lessonsData.lessons);
      if (quizzesData.success) setCourseQuizzes(quizzesData.quizzes);
      if (assignmentsData.success) setCourseAssignments(assignmentsData.assignments);
      if (enrollmentsData.success) setCourseEnrollments(enrollmentsData.enrollments);
    } catch (error) {
      console.error('Failed to fetch course content:', error);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch('/api/users?role=STUDENT');
      const data = await response.json();
      if (data.success) {
        const enrolledIds = courseEnrollments.map(e => e.studentId);
        setAvailableStudents(data.users.filter((s: Student) => !enrolledIds.includes(s.id)));
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // Navigation handlers
  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    fetchCourseContent(course.id);
  };

  const handleOpenQuestionManager = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentView('questions');
  };

  const handleOpenSubmissions = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView('submissions');
  };

  const handleBackToCourse = () => {
    setSelectedQuiz(null);
    setSelectedAssignment(null);
    setCurrentView('course');
  };

  const handleBackToMain = () => {
    setSelectedCourse(null);
    setSelectedQuiz(null);
    setSelectedAssignment(null);
    setCurrentView('main');
    setActiveSection('dashboard');
  };

  const handleOpenGrading = () => {
    setCurrentView('grading');
  };

  const handleOpenInsights = () => {
    setCurrentView('insights');
  };

  // Course CRUD
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.subject) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsCreatingCourse(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCourse,
          difficultyLevel: parseInt(newCourse.difficultyLevel),
          teacherId: user?.id,
          creatorId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Course created successfully!');
        setIsCreateCourseOpen(false);
        setNewCourse({ title: '', description: '', subject: '', gradeLevel: '', difficultyLevel: '3' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create course');
      }
    } catch (error) {
      toast.error('Failed to create course');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCourse.id,
          ...newCourse,
          difficultyLevel: parseInt(newCourse.difficultyLevel),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Course updated successfully!');
        setIsEditCourseOpen(false);
        setSelectedCourse(data.course);
        fetchData();
      } else {
        toast.error('Failed to update course');
      }
    } catch (error) {
      toast.error('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses?id=${courseId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Course deleted successfully');
        handleBackToMain();
        fetchData();
      } else {
        toast.error('Failed to delete course');
      }
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  // Lesson file upload
  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLesson(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setNewLesson(prev => ({
          ...prev,
          referenceUrl: data.url,
          referenceName: data.name,
        }));
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploadingLesson(false);
    }
  };

  // Lesson CRUD
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newLesson.title) {
      toast.error('Please enter a lesson title');
      return;
    }

    setIsCreatingLesson(true);
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: newLesson.title,
          description: newLesson.description,
          content: newLesson.content,
          order: courseLessons.length + 1,
          difficultyLevel: parseInt(newLesson.difficultyLevel) || 3,
          estimatedTime: parseInt(newLesson.estimatedTime) || 30,
          referenceUrl: newLesson.referenceUrl || null,
          referenceName: newLesson.referenceName || null,
        }),
      });

      const data = await response.json();
      console.log('Lesson creation response:', data);
      
      if (data.success) {
        toast.success('Lesson created successfully!');
        setIsCreateLessonOpen(false);
        setNewLesson({ title: '', description: '', content: '', difficultyLevel: '3', estimatedTime: '30', referenceUrl: '', referenceName: '' });
        fetchCourseContent(selectedCourse.id);
      } else {
        toast.error(data.error || 'Failed to create lesson');
      }
    } catch (error) {
      console.error('Lesson creation error:', error);
      toast.error('Failed to create lesson: ' + (error as Error).message);
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons?id=${lessonId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Lesson deleted successfully');
        if (selectedCourse) fetchCourseContent(selectedCourse.id);
      }
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  // Quiz CRUD
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newQuiz.title) return;

    setIsCreatingQuiz(true);
    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          ...newQuiz,
          timeLimit: parseInt(newQuiz.timeLimit),
          passingScore: parseInt(newQuiz.passingScore),
          maxAttempts: parseInt(newQuiz.maxAttempts),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Quiz created! Now add questions to it.');
        setIsCreateQuizOpen(false);
        setNewQuiz({ title: '', description: '', timeLimit: '15', passingScore: '60', maxAttempts: '3' });
        fetchCourseContent(selectedCourse.id);
      } else {
        toast.error('Failed to create quiz');
      }
    } catch (error) {
      toast.error('Failed to create quiz');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/quizzes?id=${quizId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Quiz deleted successfully');
        if (selectedCourse) fetchCourseContent(selectedCourse.id);
      }
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  // Assignment CRUD
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newAssignment.title || !newAssignment.dueDate) return;

    setIsCreatingAssignment(true);
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          ...newAssignment,
          maxScore: parseInt(newAssignment.maxScore),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Assignment created successfully!');
        setIsCreateAssignmentOpen(false);
        setNewAssignment({ title: '', description: '', dueDate: '', maxScore: '100' });
        fetchCourseContent(selectedCourse.id);
      } else {
        toast.error('Failed to create assignment');
      }
    } catch (error) {
      toast.error('Failed to create assignment');
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Assignment deleted successfully');
        if (selectedCourse) fetchCourseContent(selectedCourse.id);
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  // Student enrollment
  const handleAddStudent = async () => {
    if (!selectedStudentId || !selectedCourse) return;

    try {
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          courseId: selectedCourse.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Student enrolled successfully!');
        setIsAddStudentOpen(false);
        setSelectedStudentId('');
        fetchCourseContent(selectedCourse.id);
      } else {
        toast.error(data.error || 'Failed to enroll student');
      }
    } catch (error) {
      toast.error('Failed to enroll student');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(`/api/enroll?studentId=${studentId}&courseId=${selectedCourse.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Student removed from course');
        fetchCourseContent(selectedCourse.id);
      }
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const getDisabilityLabel = (type: string) => {
    const labels: Record<string, string> = {
      NONE: 'None',
      VISUAL_IMPAIRMENT: 'Visual',
      HEARING_IMPAIRMENT: 'Hearing',
      SPEECH_IMPAIRMENT: 'Speech',
      LEARNING_DISABILITY: 'Learning',
      PHYSICAL_DISABILITY: 'Physical',
      MULTIPLE_DISABILITIES: 'Multiple',
    };
    return labels[type] || type;
  };

  // Question Manager View
  if (currentView === 'questions' && selectedQuiz && selectedCourse) {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <Button variant="ghost" onClick={handleBackToCourse}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        <QuestionManager
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
          onClose={handleBackToCourse}
        />
      </div>
    );
  }

  // Grading View
  if (currentView === 'grading') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <Button variant="ghost" onClick={handleBackToMain}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <EssayGrading teacherId={user?.id || ''} />
      </div>
    );
  }

  // Insights View
  if (currentView === 'insights') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <Button variant="ghost" onClick={handleBackToMain}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <AIInsights teacherId={user?.id || ''} />
      </div>
    );
  }

  // Submissions View
  if (currentView === 'submissions' && selectedAssignment && selectedCourse) {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <SubmissionViewer
          assignment={selectedAssignment}
          courseId={selectedCourse.id}
          onBack={handleBackToCourse}
        />
      </div>
    );
  }

  // Students View (All enrolled students across courses)
  if (currentView === 'students') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Students</h1>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No students enrolled in your courses yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3 pr-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.disabilityType !== 'NONE' && (
                          <Badge variant="secondary">{getDisabilityLabel(student.disabilityType)}</Badge>
                        )}
                        {student.grade && (
                          <Badge variant="outline">{student.grade}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Quizzes View (All quizzes across courses)
  if (currentView === 'quizzes') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Quizzes</h1>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>Create a course first to add quizzes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleOpenCourse(course)}>
                    Manage Quizzes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Analytics View
  if (currentView === 'analytics') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics & Insights</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.stats?.totalStudents || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.stats?.avgClassScore?.toFixed(1) || 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.stats?.totalQuizAttempts || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('grading')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                Essay Grading
              </CardTitle>
              <CardDescription>Review and grade student essay submissions</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('insights')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Insights
              </CardTitle>
              <CardDescription>View AI-powered student performance insights</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Course Detail View
  if (currentView === 'course' && selectedCourse) {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToMain}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Course Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedCourse.title}</h1>
            <p className="text-muted-foreground">{selectedCourse.subject} • {selectedCourse.gradeLevel || 'All Levels'}</p>
            {selectedCourse.description && (
              <p className="mt-2 text-sm">{selectedCourse.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setNewCourse({
                  title: selectedCourse.title,
                  description: selectedCourse.description || '',
                  subject: selectedCourse.subject,
                  gradeLevel: selectedCourse.gradeLevel || '',
                  difficultyLevel: String(selectedCourse.difficultyLevel),
                });
                setIsEditCourseOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Course
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setDeleteTarget({ type: 'course', id: selectedCourse.id })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{courseEnrollments.length}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{courseLessons.length}</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{courseQuizzes.length}</p>
              <p className="text-sm text-muted-foreground">Quizzes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{courseAssignments.length}</p>
              <p className="text-sm text-muted-foreground">Assignments</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="lessons"><BookOpen className="h-4 w-4 mr-2" />Lessons</TabsTrigger>
            <TabsTrigger value="quizzes"><FileText className="h-4 w-4 mr-2" />Quizzes</TabsTrigger>
            <TabsTrigger value="assignments"><Calendar className="h-4 w-4 mr-2" />Assignments</TabsTrigger>
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-2" />Students</TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lessons</CardTitle>
                  <Button onClick={() => setIsCreateLessonOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Lesson
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {courseLessons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lessons yet. Create your first lesson!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseLessons.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Level {lesson.difficultyLevel} • {lesson.estimatedTime} min
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quizzes</CardTitle>
                  <Button onClick={() => setIsCreateQuizOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Create Quiz
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {courseQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quizzes yet. Create your first quiz!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.timeLimit} mins • Pass: {quiz.passingScore}% • {(quiz as any)._count?.questions || 0} questions
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleOpenQuestionManager(quiz)}
                          >
                            <ListOrdered className="h-4 w-4 mr-1" />
                            Manage Questions
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assignments</CardTitle>
                  <Button onClick={() => setIsCreateAssignmentOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Create Assignment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {courseAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assignments yet. Create your first assignment!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()} • Max Score: {assignment.maxScore}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenSubmissions(assignment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />Submissions
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(assignment.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Enrolled Students</CardTitle>
                  <Button onClick={() => { setIsAddStudentOpen(true); fetchAvailableStudents(); }}>
                    <UserPlus className="h-4 w-4 mr-2" />Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {courseEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No students enrolled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseEnrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {enrollment.student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{enrollment.student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Progress: {enrollment.progress}% • Level: {enrollment.currentLevel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {enrollment.student.disabilityType !== 'NONE' && (
                            <Badge variant="secondary">{getDisabilityLabel(enrollment.student.disabilityType)}</Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(enrollment.studentId)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Course Dialog */}
        <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditCourse} className="space-y-4">
              <div className="space-y-2">
                <Label>Course Title *</Label>
                <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={newCourse.subject} onValueChange={(v) => setNewCourse({ ...newCourse, subject: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Select value={newCourse.gradeLevel} onValueChange={(v) => setNewCourse({ ...newCourse, gradeLevel: v })}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Lesson Dialog */}
        <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="space-y-2">
                <Label>Lesson Title *</Label>
                <Input value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newLesson.description} onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Content (Markdown)</Label>
                <Textarea 
                  value={newLesson.content} 
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                  className="min-h-32"
                  placeholder="# Lesson Title&#10;&#10;Lesson content here..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={newLesson.difficultyLevel} onValueChange={(v) => setNewLesson({ ...newLesson, difficultyLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Beginner</SelectItem>
                      <SelectItem value="2">2 - Elementary</SelectItem>
                      <SelectItem value="3">3 - Intermediate</SelectItem>
                      <SelectItem value="4">4 - Advanced</SelectItem>
                      <SelectItem value="5">5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Time (mins)</Label>
                  <Input type="number" value={newLesson.estimatedTime} onChange={(e) => setNewLesson({ ...newLesson, estimatedTime: e.target.value })} />
                </div>
              </div>
              {/* Reference File Upload */}
              <div className="space-y-2">
                <Label>Reference Material (Optional)</Label>
                {newLesson.referenceUrl ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{newLesson.referenceName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewLesson({ ...newLesson, referenceUrl: '', referenceName: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                      onChange={handleLessonFileUpload}
                      disabled={isUploadingLesson}
                      className="flex-1"
                    />
                    {isUploadingLesson && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a reference file for students (PDF, DOC, Images, Text)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreatingLesson}>
                  {isCreatingLesson && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Lesson
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Quiz Dialog */}
        <Dialog open={isCreateQuizOpen} onOpenChange={setIsCreateQuizOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label>Quiz Title *</Label>
                <Input value={newQuiz.title} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newQuiz.description} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Time Limit (mins)</Label>
                  <Input type="number" value={newQuiz.timeLimit} onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Passing Score (%)</Label>
                  <Input type="number" value={newQuiz.passingScore} onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Attempts</Label>
                  <Input type="number" value={newQuiz.maxAttempts} onChange={(e) => setNewQuiz({ ...newQuiz, maxAttempts: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreatingQuiz}>
                  {isCreatingQuiz && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Quiz
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Assignment Dialog */}
        <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment Title *</Label>
                <Input value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input type="date" value={newAssignment.dueDate} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input type="number" value={newAssignment.maxScore} onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreatingAssignment}>
                  {isCreatingAssignment && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Assignment
                </Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Student Dialog */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.disabilityType !== 'NONE' && `(${getDisabilityLabel(s.disabilityType)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddStudent} disabled={!selectedStudentId}>Add Student</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {deleteTarget?.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget?.type === 'course') {
                    handleDeleteCourse(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}! 👋</h1>
          <p className="text-muted-foreground">Manage your courses and students</p>
        </div>
        <Button onClick={() => setIsCreateCourseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.stats?.totalStudents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.stats?.avgClassScore?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.stats?.totalQuizAttempts || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/10 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleOpenGrading}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              Essay Grading
            </CardTitle>
            <CardDescription>Review and grade student essay submissions</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleOpenInsights}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Analytics
            </CardTitle>
            <CardDescription>View student performance insights and recommendations</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Click on a course to manage lessons, quizzes, and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses yet. Create your first course!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleOpenCourse(course)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.subject}</CardDescription>
                      </div>
                      <Badge>{course.gradeLevel || 'All'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>👥 {course._count?.enrollments || 0} students</span>
                      <span>📚 {course._count?.lessons || 0} lessons</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Create a new course for your students</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title *</Label>
              <Input 
                value={newCourse.title} 
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={newCourse.description} 
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={newCourse.subject} onValueChange={(v) => setNewCourse({ ...newCourse, subject: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select value={newCourse.gradeLevel} onValueChange={(v) => setNewCourse({ ...newCourse, gradeLevel: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={newCourse.difficultyLevel} onValueChange={(v) => setNewCourse({ ...newCourse, difficultyLevel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Elementary</SelectItem>
                  <SelectItem value="3">3 - Intermediate</SelectItem>
                  <SelectItem value="4">4 - Advanced</SelectItem>
                  <SelectItem value="5">5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatingCourse}>
                {isCreatingCourse && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Course
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
