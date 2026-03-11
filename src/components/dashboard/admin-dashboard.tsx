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
  DialogTrigger,
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
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  Shield,
  BarChart3,
  GraduationCap,
  TrendingUp,
  Settings,
  Activity,
  Plus,
  Loader2,
  Trash2,
  Eye,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  disabilityType: string;
  grade?: string;
  section?: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  teacher?: { name: string };
  _count?: {
    enrollments: number;
    lessons: number;
  };
}

const DISABILITY_TYPES = [
  { value: 'NONE', label: 'None' },
  { value: 'VISUAL_IMPAIRMENT', label: 'Visual Impairment' },
  { value: 'HEARING_IMPAIRMENT', label: 'Hearing Impairment' },
  { value: 'SPEECH_IMPAIRMENT', label: 'Speech Impairment' },
  { value: 'LEARNING_DISABILITY', label: 'Learning Disability' },
  { value: 'PHYSICAL_DISABILITY', label: 'Physical Disability' },
  { value: 'MULTIPLE_DISABILITIES', label: 'Multiple Disabilities' },
];

export function AdminDashboard() {
  const { user } = useAuthStore();
  const { fontSize } = useAccessibilityStore();
  const { activeSection, setActiveSection } = useNavStore();
  
  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View states
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'courses' | 'settings' | 'analytics'>('main');
  
  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    disabilityType: 'NONE',
    grade: '',
    section: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    schoolName: 'LearnAI Demo School',
    academicYear: '2024-2025',
    term: '1st Semester',
    contactEmail: 'admin@learnai.ph',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update view based on nav section
    if (activeSection === 'dashboard') setCurrentView('main');
    else if (activeSection === 'users') setCurrentView('users');
    else if (activeSection === 'courses') setCurrentView('courses');
    else if (activeSection === 'analytics') setCurrentView('analytics');
    else if (activeSection === 'settings') setCurrentView('settings');
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, usersRes, coursesRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/users'),
        fetch('/api/courses'),
      ]);

      const [analyticsData, usersData, coursesData] = await Promise.all([
        analyticsRes.json(),
        usersRes.json(),
        coursesRes.json(),
      ]);

      if (analyticsData.success) {
        setOverview(analyticsData.analytics.overview);
        setRecentActivity(analyticsData.analytics.recentActivity || []);
      }
      if (usersData.success) setUsers(usersData.users);
      if (coursesData.success) setCourses(coursesData.courses);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User created successfully!');
        setIsAddUserOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'STUDENT', disabilityType: 'NONE', grade: '', section: '' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('User deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setIsSavingSettings(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500';
      case 'TEACHER': return 'bg-blue-500';
      case 'STUDENT': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDisabilityLabel = (type: string) => {
    const found = DISABILITY_TYPES.find(d => d.value === type);
    return found?.label || type;
  };

  // Users View
  if (currentView === 'users') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Add User
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3 pr-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleColor(u.role)} text-white`}>{u.role}</Badge>
                        {u.disabilityType !== 'NONE' && <Badge variant="secondary">{getDisabilityLabel(u.disabilityType)}</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'STUDENT' && (
                <>
                  <div className="space-y-2">
                    <Label>Disability Type</Label>
                    <Select value={newUser.disabilityType} onValueChange={(v) => setNewUser({ ...newUser, disabilityType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DISABILITY_TYPES.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Input value={newUser.grade} onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })} placeholder="Grade 5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input value={newUser.section} onChange={(e) => setNewUser({ ...newUser, section: e.target.value })} placeholder="A" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Courses View
  if (currentView === 'courses') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <h1 className="text-2xl font-bold">All Courses</h1>
        
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.subject} • {course.gradeLevel || 'All Levels'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xl font-bold">{course._count?.enrollments || 0}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{course._count?.lessons || 0}</p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Teacher: {course.teacher?.name || 'N/A'}</p>
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
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Overall student performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2"><span>Average Score</span><span className="font-bold">78.5%</span></div>
                <Progress value={78.5} />
              </div>
              <div>
                <div className="flex justify-between mb-2"><span>Quiz Pass Rate</span><span className="font-bold">82%</span></div>
                <Progress value={82} />
              </div>
              <div>
                <div className="flex justify-between mb-2"><span>Course Completion</span><span className="font-bold">65%</span></div>
                <Progress value={65} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Usage</CardTitle>
              <CardDescription>AI assistive features usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2"><span>Text-to-Speech</span><span className="font-bold">45%</span></div>
                <Progress value={45} />
              </div>
              <div>
                <div className="flex justify-between mb-2"><span>Speech-to-Text</span><span className="font-bold">32%</span></div>
                <Progress value={32} />
              </div>
              <div>
                <div className="flex justify-between mb-2"><span>Sign Language</span><span className="font-bold">18%</span></div>
                <Progress value={18} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-3 pr-4">
                    {recentActivity.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 border rounded">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                          {log.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm"><span className="font-medium">{log.user?.name}</span> {log.action}</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline">{log.user?.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DepEd & SDG 4 Alignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600">94%</p>
                <p className="text-sm text-muted-foreground">Accessibility Compliance</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">87%</p>
                <p className="text-sm text-muted-foreground">SPED Program Coverage</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Settings View
  if (currentView === 'settings') {
    return (
      <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
        <h1 className="text-2xl font-bold">System Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
            <CardDescription>Configure your school's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input value={settings.schoolName} onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={settings.academicYear} onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Current Term</Label>
                <Input value={settings.term} onChange={(e) => setSettings({ ...settings, term: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
            </div>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility Defaults</CardTitle>
            <CardDescription>Default accessibility settings for new users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">These settings will be applied to new users by default. Users can customize their own preferences.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="p-6 space-y-6" style={{ fontSize: `${fontSize}px` }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome, {user?.name} • System Administrator</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalUsers || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Students</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalStudents || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Teachers</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalTeachers || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Courses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalCourses || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quizzes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalQuizzes || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Attempts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overview?.totalAttempts || 0}</p></CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveSection('users')}>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Manage Users</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveSection('courses')}>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">All Courses</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveSection('analytics')}>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">View Analytics</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveSection('settings')}>
          <CardContent className="pt-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium">Settings</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Button variant="outline" onClick={() => setActiveSection('users')}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{u.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Badge className={`${getRoleColor(u.role)} text-white`}>{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
