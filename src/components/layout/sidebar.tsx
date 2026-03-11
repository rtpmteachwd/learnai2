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
  Menu,
  X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

interface SidebarProps {
  onLogout: () => void;
  onHelpClick: () => void;
}

export function Sidebar({ onLogout, onHelpClick }: SidebarProps) {
  const { user } = useAuthStore();
  const { activeSection, setActiveSection, sidebarOpen, toggleSidebar } = useNavStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Mobile: Hamburger menu button
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button - Fixed top left */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 h-full w-64 bg-card border-r z-50 transition-transform duration-300 md:hidden',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo/Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">LearnAI</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {user?.role === 'STUDENT' && <GraduationCap className="h-5 w-5 text-primary" />}
                {user?.role === 'TEACHER' && <Users className="h-5 w-5 text-primary" />}
                {user?.role === 'ADMIN' && <Shield className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  activeSection === item.id && 'bg-primary/10 text-primary'
                )}
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-2 border-t space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                onHelpClick();
                setMobileMenuOpen(false);
              }}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Help & Support</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-card border-r transition-all duration-300 z-40 hidden md:block',
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