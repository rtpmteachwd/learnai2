'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Sparkles, 
  RefreshCw, 
  Volume2,
  Star,
  Sun,
  Rainbow,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface EncouragementSystemProps {
  context?: 'lesson' | 'quiz' | 'assignment' | 'general';
  score?: number;
  className?: string;
}

const ENCOURAGEMENT_ICONS = [Star, Sun, Rainbow, Zap, Heart, Sparkles];

const FALLBACK_MESSAGES = [
  "You're doing amazing! Keep going! ⭐",
  "Every step forward is progress! You've got this! 💪",
  "Believe in yourself - you're learning and growing every day! 🌱",
  "You are brave for trying new things! 🦁",
  "Mistakes are just proof that you're trying! Keep going! 🌟",
  "Your brain is getting stronger with every question! 🧠✨",
  "You're not alone - I believe in you! 💜",
  "Take a deep breath. You can do this! 🌈",
];

export function EncouragementSystem({ 
  context = 'general', 
  score,
  className 
}: EncouragementSystemProps) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  // Check if user has learning disability
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  // Load initial encouragement
  useEffect(() => {
    if (hasLearningDisability && !message) {
      generateEncouragement();
    }
  }, [hasLearningDisability]);

  const generateEncouragement = useCallback(async () => {
    setIsLoading(true);

    // Build context-aware prompt
    let contextDescription = '';
    if (context === 'quiz') {
      contextDescription = score !== undefined 
        ? `The student just finished a quiz with a score of ${score}%.`
        : 'The student is about to take a quiz.';
    } else if (context === 'lesson') {
      contextDescription = 'The student is studying a lesson.';
    } else if (context === 'assignment') {
      contextDescription = 'The student is working on an assignment.';
    }

    try {
      const response = await fetch('/api/ai/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Give me a short, encouraging message.${contextDescription ? ` Context: ${contextDescription}` : ''}`,
            },
          ],
          mode: 'encouragement',
          systemPrompt: `You are a warm, encouraging learning buddy for students with learning disabilities.

Generate a SHORT (1-2 sentences maximum) encouraging message.

Rules:
1. Use the student's name: ${user?.name?.split(' ')[0] || 'friend'}
2. Be genuine and warm - like a supportive friend
3. Use 1-2 emojis for visual appeal
4. Keep it simple and easy to read
5. Focus on effort, not just results
6. If they scored low, remind them that mistakes help us learn
7. If they scored high, celebrate their hard work
8. Avoid being overly sugary - be authentic

Examples of good messages:
- "You're doing great, ${user?.name?.split(' ')[0] || 'friend'}! Keep taking those small steps! 🌟"
- "Every question you try makes you smarter, ${user?.name?.split(' ')[0] || 'friend'}! You've got this! 💪"
- "Remember: Mistakes are just your brain growing! Keep going! 🌱"

Generate ONE encouraging message now.`,
          studentContext: {
            name: user?.name,
            disabilityType: user?.disabilityType,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.response);
        setIconIndex((prev) => (prev + 1) % ENCOURAGEMENT_ICONS.length);
      } else {
        // Use fallback
        setMessage(FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]);
      }
    } catch (error) {
      console.error('Encouragement error:', error);
      // Use fallback message
      setMessage(FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]);
    } finally {
      setIsLoading(false);
    }
  }, [context, score, user]);

  const speakMessage = () => {
    if (message && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  // Don't render if user doesn't have learning disability
  if (!hasLearningDisability) return null;

  const Icon = ENCOURAGEMENT_ICONS[iconIndex];

  return (
    <Card className={`border-yellow-200 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 shadow-sm ${className}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-full shadow-md">
            <Icon className="h-6 w-6 text-white animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <p className="text-gray-500 animate-pulse">Loading encouragement...</p>
            ) : (
              <p className="text-gray-700 font-medium leading-relaxed">{message}</p>
            )}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={speakMessage}
              disabled={!message}
              className="text-yellow-600 hover:bg-yellow-100"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateEncouragement}
              disabled={isLoading}
              className="text-yellow-600 hover:bg-yellow-100"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
            <Heart className="h-3 w-3 mr-1" />
            Learning Buddy
          </Badge>
          <span className="text-xs text-gray-500">Click 🔄 for new encouragement</span>
        </div>
      </CardContent>
    </Card>
  );
}

// A simpler inline version for tight spaces
export function EncouragementPill({ className }: { className?: string }) {
  const { user } = useAuthStore();
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  // Use a stable random message based on initial render
  const [message] = useState(() => 
    FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
  );

  if (!hasLearningDisability) return null;

  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 rounded-full text-sm ${className}`}>
      <Sparkles className="h-4 w-4 text-yellow-600" />
      <span className="text-yellow-800">{message}</span>
    </div>
  );
}

export default EncouragementSystem;
