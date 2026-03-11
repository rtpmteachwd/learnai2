'use client';

import { useAuthStore, useNavStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Settings,
  LogOut,
  GraduationCap,
  Shield,
  BarChart3,
  MessageSquare,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface SidebarProps {
  onLogout: () => void;
  onHelpClick: () => void;
}

export function Sidebar({ onLogout, onHelpClick }: SidebarProps) {
  const { user } = useAuthStore();
  const { activeSection, setActiveSection, sidebarOpen, toggleSidebar } = useNavStore();

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: FileText },
    { id: 'progress', label: 'My Progress', icon: BarChart3 },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const teacherNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'quizzes', label: 'Quizzes', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'All Courses', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'STUDENT':
        return studentNavItems;
      case 'TEACHER':
        return teacherNavItems;
      case 'ADMIN':
        return adminNavItems;
      default:
        return studentNavItems;
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-card border-r transition-all duration-300 z-40',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">LearnAI</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Info */}
        <div className={cn('p-4 border-b', !sidebarOpen && 'flex justify-center')}>
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'flex-col')}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.role === 'STUDENT' && <GraduationCap className="h-5 w-5 text-primary" />}
              {user?.role === 'TEACHER' && <Users className="h-5 w-5 text-primary" />}
              {user?.role === 'ADMIN' && <Shield className="h-5 w-5 text-primary" />}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    !sidebarOpen && 'justify-center px-2',
                    activeSection === item.id && 'bg-primary/10 text-primary'
                  )}
                  onClick={() => handleNavClick(item.id)}
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={onHelpClick}
              >
                <HelpCircle className="h-5 w-5" />
                {sidebarOpen && <span>Help & Support</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">Help & Support</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-destructive hover:text-destructive',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5" />
                {sidebarOpen && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
