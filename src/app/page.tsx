'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuthStore, useAccessibilityStore, useNavStore } from '@/lib/store';
import { LoginForm } from '@/components/auth/login-form';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { TeacherDashboard } from '@/components/dashboard/teacher-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { HelpSupportDialog } from '@/components/common/help-support';
// SPED-Exclusive AI Features
import { AITutorChatbot } from '@/components/assistance/ai-tutor-chatbot';
import { cn } from '@/lib/utils';
import { GraduationCap, Heart, Accessibility } from 'lucide-react';
import { toast } from 'sonner';

// Custom hook to check if we're hydrated (client-side)
function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    // This runs only on client after hydration
    const timeout = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timeout);
  }, []);
  
  return hydrated;
}

export default function Home() {
  const hydrated = useHydration();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { sidebarOpen } = useNavStore();
  const { 
    fontSize, 
    highContrast, 
    darkMode, 
    reducedMotion, 
    screenReaderMode,
    keyboardNavOnly 
  } = useAccessibilityStore();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Apply accessibility settings to document (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = `${fontSize}px`;
    
    // High contrast mode
    root.classList.toggle('high-contrast', highContrast);
    
    // Dark mode
    root.classList.toggle('dark', darkMode);
    
    // Reduced motion
    root.classList.toggle('reduce-motion', reducedMotion);
    if (reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    
    // Screen reader mode - adds aria attributes
    root.classList.toggle('screen-reader-mode', screenReaderMode);
    if (screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }
    
    // Keyboard navigation only
    root.classList.toggle('keyboard-nav-only', keyboardNavOnly);
    if (keyboardNavOnly) {
      root.setAttribute('data-keyboard-nav', 'true');
    } else {
      root.removeAttribute('data-keyboard-nav');
    }
  }, [hydrated, fontSize, highContrast, darkMode, reducedMotion, screenReaderMode, keyboardNavOnly]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Loading state - show skeleton during hydration
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        {/* Landing Header */}
        <header className="w-full p-4 border-b bg-card/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl">LearnAI</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Inclusive Learning</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hidden md:flex items-center gap-1">
                <Accessibility className="h-4 w-4" />
                Accessibility First
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                DepEd Aligned
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6">
          {/* Left Side - Info */}
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Inclusive Education for
                <span className="text-primary"> Every Learner</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                An AI-powered Learning Management System designed for SPED students 
                of Dumaguete City National High School. Supporting visual, hearing, and speech impairments 
                with cutting-edge assistive technology.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎤</span>
                  <h3 className="font-semibold">Speech-to-Text</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time transcription for hearing-impaired students
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔊</span>
                  <h3 className="font-semibold">Text-to-Speech</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Audio narration for visually impaired students
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✋</span>
                  <h3 className="font-semibold">Sign Language</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gesture recognition for hearing-impaired learners
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-semibold">Adaptive Learning</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  ZPD-aligned content difficulty adjustment
                </p>
              </div>
            </div>

            {/* Alignment Badges */}
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm">
                📊 DepEd Aligned
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm">
                🌍 SDG 4 Compliant
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm">
                ♿ WCAG Accessible
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-4 border-t bg-card/50">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>© 2024 LearnAI - AI-Powered Inclusive Learning Management System</p>
            <p className="text-xs mt-1">Designed for SPED students of Dumaguete City National High School</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated - Show Dashboard based on role
  const renderDashboard = () => {
    switch (user.role) {
      case 'STUDENT':
        return <StudentDashboard />;
      case 'TEACHER':
        return <TeacherDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-background transition-all duration-300',
      highContrast && 'high-contrast'
    )}>
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} onHelpClick={() => setIsHelpOpen(true)} />

      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300',
        // Mobile: no margin (sidebar is overlay)
        'ml-0',
        // Desktop: margin based on sidebar state
        'md:ml-64',
        !sidebarOpen && 'md:ml-16'
      )}>
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="pt-16 min-h-screen">
          {renderDashboard()}
        </main>

        {/* Footer */}
        <footer className="p-4 border-t bg-card/50 text-center text-sm text-muted-foreground">
          <p className="hidden md:inline">© 2024 LearnAI - AI-Powered Inclusive LMS | DepEd Aligned | SDG 4 Compliant</p>
          <p className="md:hidden">© 2024 LearnAI</p>
        </footer>
      </div>

      {/* Help & Support Dialog */}
      <HelpSupportDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />

      {/* SPED-Exclusive: AI Tutor Chatbot (Floating - only visible for students with learning disability) */}
      {user?.role === 'STUDENT' && <AITutorChatbot />}
    </div>
  );
}
