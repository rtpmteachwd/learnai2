'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Loader2, 
  Sparkles, 
  Volume2, 
  RefreshCw,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ContentSimplifierProps {
  content: string;
  title?: string;
  className?: string;
  onSimplified?: (simplified: string) => void;
}

type SimplificationLevel = 'simple' | 'simpler' | 'simplest';

const LEVEL_LABELS: Record<SimplificationLevel, { label: string; description: string }> = {
  simple: {
    label: 'Easier',
    description: 'Slightly simplified with clearer words',
  },
  simpler: {
    label: 'Much Easier',
    description: 'Short sentences, common words only',
  },
  simplest: {
    label: 'Super Easy',
    description: 'Very basic, like explaining to a friend',
  },
};

export function ContentSimplifier({ content, title, className, onSimplified }: ContentSimplifierProps) {
  const { user } = useAuthStore();
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<SimplificationLevel>('simple');
  const [showOriginal, setShowOriginal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if user has learning disability
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  const simplifyContent = useCallback(async (level: SimplificationLevel = 'simple') => {
    if (!content || isSimplifying) return;

    setIsSimplifying(true);
    setCurrentLevel(level);

    const levelInstructions: Record<SimplificationLevel, string> = {
      simple: `
        - Rewrite using slightly simpler vocabulary
        - Break long sentences into 2 shorter ones
        - Keep the same amount of information
        - Add a few helpful examples
      `,
      simpler: `
        - Use ONLY very common, everyday words
        - Keep sentences to 8-10 words max
        - Use bullet points for lists
        - Add 1-2 relatable examples
        - Use analogies from daily life
      `,
      simplest: `
        - Use words a 3rd grader would know
        - Keep sentences to 5-6 words max
        - Use simple subject-verb sentences
        - Add fun examples and comparisons
        - Use emojis to make it friendly 😊
        - Break everything into tiny steps
      `,
    };

    try {
      const response = await fetch('/api/ai/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Please simplify this content for me:\n\nTitle: ${title || 'Lesson Content'}\n\nContent:\n${content}`,
            },
          ],
          mode: 'content_simplifier',
          systemPrompt: `You are a patient educational assistant who helps students with learning disabilities understand complex content.

Simplify the given content following these rules:
${levelInstructions[level]}

IMPORTANT:
- Never lose important information
- Always be encouraging
- Keep the friendly tone
- Add encouraging words like "You've got this!" or "Take your time"
- If there are difficult concepts, explain them step by step

Format your response using markdown with:
- Headers (##) for sections
- Bullet points for lists
- **Bold** for important words
- Short paragraphs`,
          studentContext: {
            name: user?.name,
            disabilityType: user?.disabilityType,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSimplifiedContent(data.response);
        onSimplified?.(data.response);
        toast.success('Content simplified! 🎉');
      } else {
        throw new Error(data.error || 'Failed to simplify content');
      }
    } catch (error) {
      console.error('Simplify error:', error);
      toast.error('Oops! Could not simplify. Please try again.');
    } finally {
      setIsSimplifying(false);
    }
  }, [content, title, isSimplifying, user, onSimplified]);

  const speakContent = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      // Remove markdown formatting for speech
      const cleanText = text
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\n+/g, '. ');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  // Don't render if user doesn't have learning disability
  if (!hasLearningDisability) return null;

  return (
    <Card className={`border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Wand2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Simplify This Lesson
              </CardTitle>
              <CardDescription className="text-xs">
                Make this easier to understand
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Simplification Level Buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LEVEL_LABELS) as SimplificationLevel[]).map((level) => (
              <Button
                key={level}
                variant={currentLevel === level && simplifiedContent ? 'default' : 'outline'}
                size="sm"
                onClick={() => simplifyContent(level)}
                disabled={isSimplifying}
                className={currentLevel === level && simplifiedContent ? 'bg-purple-500 hover:bg-purple-600' : ''}
              >
                {isSimplifying && currentLevel === level ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {LEVEL_LABELS[level].label}
              </Button>
            ))}
          </div>

          {/* Simplified Content */}
          {simplifiedContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {LEVEL_LABELS[currentLevel].label} Version
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakContent(simplifiedContent)}
                    className="text-purple-600"
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    Listen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => simplifyContent(currentLevel)}
                    className="text-purple-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Try Again
                  </Button>
                </div>
              </div>

              <Card className="bg-white/80">
                <CardContent className="py-4 prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-purple-700">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-4 text-purple-600">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-medium mb-2 mt-3 text-purple-500">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-purple-700">{children}</strong>,
                    }}
                  >
                    {simplifiedContent}
                  </ReactMarkdown>
                </CardContent>
              </Card>

              {/* Toggle Original */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full text-gray-500"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {showOriginal ? 'Hide Original' : 'Compare with Original'}
              </Button>

              {showOriginal && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Original Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">{content}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tips */}
          {!simplifiedContent && !isSimplifying && (
            <div className="bg-purple-100/50 rounded-lg p-3 text-sm text-purple-700">
              <p className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <strong>Tip:</strong> Choose how simple you want the content. "Super Easy" is great for really tough topics!
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default ContentSimplifier;
