'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore, useNavStore } from '@/lib/store';
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Loader2,
  X,
} from 'lucide-react';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (type: string, id: string) => void;
}

interface SearchResult {
  type: 'course' | 'quiz' | 'user';
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
}

export function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const { user } = useAuthStore();
  const { setActiveSection } = useNavStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search courses
      if (user?.role === 'STUDENT') {
        const coursesRes = await fetch(`/api/courses?studentId=${user.id}`);
        const coursesData = await coursesRes.json();
        if (coursesData.success) {
          const filtered = coursesData.courses.filter((c: any) => 
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          searchResults.push(...filtered.map((c: any) => ({
            type: 'course' as const,
            id: c.id,
            title: c.title,
            description: c.subject,
            subtitle: `${c.lessons?.length || 0} lessons`,
          })));
        }
      } else if (user?.role === 'TEACHER') {
        const coursesRes = await fetch(`/api/courses?teacherId=${user.id}`);
        const coursesData = await coursesRes.json();
        if (coursesData.success) {
          const filtered = coursesData.courses.filter((c: any) => 
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          searchResults.push(...filtered.map((c: any) => ({
            type: 'course' as const,
            id: c.id,
            title: c.title,
            description: c.subject,
            subtitle: `${c._count?.enrollments || 0} students`,
          })));
        }
      } else if (user?.role === 'ADMIN') {
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        if (coursesData.success) {
          const filtered = coursesData.courses.filter((c: any) => 
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          searchResults.push(...filtered.map((c: any) => ({
            type: 'course' as const,
            id: c.id,
            title: c.title,
            description: c.subject,
            subtitle: c.teacher?.name || 'Unknown teacher',
          })));
        }
      }

      // Search users (admin only)
      if (user?.role === 'ADMIN') {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
          const filtered = usersData.users.filter((u: any) => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
          );
          searchResults.push(...filtered.map((u: any) => ({
            type: 'user' as const,
            id: u.id,
            title: u.name,
            description: u.email,
            subtitle: u.role,
          })));
        }
      }

      // Search quizzes
      const quizzesRes = await fetch(`/api/quizzes`);
      const quizzesData = await quizzesRes.json();
      if (quizzesData.success) {
        const filtered = quizzesData.quizzes.filter((q: any) => 
          q.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        searchResults.push(...filtered.map((q: any) => ({
          type: 'quiz' as const,
          id: q.id,
          title: q.title,
          description: q.course?.title,
          subtitle: `${q.timeLimit} mins`,
        })));
      }

      setResults(searchResults.slice(0, 10));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Set the active section based on result type
    setActiveSection(result.type === 'user' ? 'users' : result.type === 'quiz' ? 'quizzes' : 'courses');
    
    // Call the onNavigate callback if provided
    if (onNavigate) {
      onNavigate(result.type, result.id);
    }
    
    // Close the dialog
    onOpenChange(false);
    
    // Clear search
    setQuery('');
    setResults([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'quiz':
        return <FileText className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-8"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5">{getIcon(result.type)}</div>
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
        ) : query.length >= 2 ? (
          <p className="text-center text-muted-foreground py-8">
            No results found for "{query}"
          </p>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Type at least 2 characters to search
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
