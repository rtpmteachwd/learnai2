'use client';

import { useState } from 'react';
import { useAuthStore, useAccessibilityStore, useNavStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { AccessibilityToolbar } from '@/components/assistance/accessibility-toolbar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search,
  Menu,
  Bell,
  X,
  Check,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  FileText,
  Users,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface SearchResult {
  type: 'course' | 'quiz' | 'user';
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const { sidebarOpen } = useNavStore();
  const { fontSize } = useAccessibilityStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to LearnAI!',
      message: 'Start exploring your courses and begin your learning journey.',
      type: 'info',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'New Course Available',
      message: 'A new course has been added to your dashboard.',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      title: 'Quiz Reminder',
      message: 'You have a pending quiz due soon.',
      type: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'STUDENT': return 'Student';
      case 'TEACHER': return 'Teacher';
      case 'ADMIN': return 'Administrator';
      default: return 'User';
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'STUDENT': return 'bg-green-500';
      case 'TEACHER': return 'bg-blue-500';
      case 'ADMIN': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search courses
      if (user?.role === 'STUDENT') {
        const res = await fetch(`/api/courses?studentId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          data.courses
            .filter((c: any) => 
              c.title.toLowerCase().includes(query.toLowerCase())
            )
            .forEach((c: any) => {
              results.push({
                type: 'course',
                id: c.id,
                title: c.title,
                description: c.subject,
                subtitle: `${c.lessons?.length || 0} lessons`,
              });
            });
        }
      } else if (user?.role === 'TEACHER') {
        const res = await fetch(`/api/courses?teacherId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          data.courses
            .filter((c: any) => 
              c.title.toLowerCase().includes(query.toLowerCase())
            )
            .forEach((c: any) => {
              results.push({
                type: 'course',
                id: c.id,
                title: c.title,
                description: c.subject,
                subtitle: `${c._count?.enrollments || 0} students`,
              });
            });
        }
      } else if (user?.role === 'ADMIN') {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success) {
          data.courses
            .filter((c: any) => 
              c.title.toLowerCase().includes(query.toLowerCase())
            )
            .forEach((c: any) => {
              results.push({
                type: 'course',
                id: c.id,
                title: c.title,
                description: c.subject,
                subtitle: c.teacher?.name || 'Unknown',
              });
            });
        }
      }

      // Search users (admin only)
      if (user?.role === 'ADMIN') {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) {
          data.users
            .filter((u: any) => 
              u.name.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())
            )
            .forEach((u: any) => {
              results.push({
                type: 'user',
                id: u.id,
                title: u.name,
                description: u.email,
                subtitle: u.role,
              });
            });
        }
      }

      // Search quizzes
      const quizzesRes = await fetch('/api/quizzes');
      const quizzesData = await quizzesRes.json();
      if (quizzesData.success) {
        quizzesData.quizzes
          .filter((q: any) => q.title.toLowerCase().includes(query.toLowerCase()))
          .forEach((q: any) => {
            results.push({
              type: 'quiz',
              id: q.id,
              title: q.title,
              description: q.course?.title,
              subtitle: `${q.timeLimit} mins`,
            });
          });
      }

      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Notifications functionality
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'quiz': return <FileText className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <>
      <header className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b flex items-center justify-between px-4 z-30 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16'
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center gap-2">
            <Badge className={cn('text-white', getRoleColor())}>
              {getRoleLabel()}
            </Badge>
            {user?.disabilityType && user.disabilityType !== 'NONE' && (
              <Badge variant="secondary">
                {user.disabilityType.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn('p-4', !notification.isRead && 'bg-primary/5')}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{notification.title}</p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              <div className="flex gap-1">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </PopoverContent>
          </Popover>

          {/* Accessibility Toolbar */}
          <AccessibilityToolbar />
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Input
              placeholder="Search courses, quizzes, users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-8"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Button
                    key={`${result.type}-${result.id}`}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">{getSearchIcon(result.type)}</div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{result.title}</p>
                        {result.description && (
                          <p className="text-sm text-muted-foreground">{result.description}</p>
                        )}
                        {result.subtitle && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {result.subtitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : searchQuery.length >= 2 ? (
            <p className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Type at least 2 characters to search
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
