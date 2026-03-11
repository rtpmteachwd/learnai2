'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  Heart, 
  BookOpen, 
  HelpCircle,
  Volume2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITutorChatbotProps {
  lessonContext?: {
    title?: string;
    content?: string;
  };
  className?: string;
}

const SUGGESTED_QUESTIONS = [
  "Can you explain this in simpler words?",
  "I'm feeling frustrated, can you help?",
  "Give me a hint for this question",
  "Can you give me an example?",
  "I don't understand, help me please",
];

export function AITutorChatbot({ lessonContext, className }: AITutorChatbotProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user has learning disability
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI learning buddy!\n\nI'm here to help you with your lessons. You can ask me:\n• To explain things in simpler words\n• For help when you're stuck\n• For encouragement when you're frustrated\n• For examples to understand better\n\nRemember: There's no such thing as a silly question! I'm always patient and happy to help. 💪`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, user?.name]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 50);
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context for the AI
      const contextMessages = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10) // Keep last 10 messages for context
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await fetch('/api/ai/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...contextMessages,
            { role: 'user' as const, content: messageText.trim() },
          ],
          mode: 'sped_tutor',
          systemPrompt: `You are a patient, encouraging AI tutor for students with learning disabilities. Your role is to:

1. ALWAYS be patient, kind, and encouraging
2. Use SIMPLE language - short sentences, common words
3. Break down complex ideas into SMALL steps
4. Use EXAMPLES from everyday life
5. Celebrate SMALL wins and effort
6. Never make the student feel bad for not understanding
7. Use emojis occasionally to make learning fun 😊
8. If the student is frustrated, acknowledge their feelings FIRST, then help

${lessonContext ? `Current lesson: "${lessonContext.title}"

Lesson content summary: ${lessonContext.content?.substring(0, 500)}...

` : ''}Remember: Every student learns at their own pace, and that's perfectly okay!`,
          studentContext: {
            name: user?.name,
            disabilityType: user?.disabilityType,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Oops! Something went wrong. Please try again.');
      
      // Add a fallback message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having a little trouble right now. But don't worry! Let's try again in a moment. You're doing great! 💪",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, lessonContext, user]);

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?'"-]/g, ''));
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  // Don't render if user doesn't have learning disability
  if (!hasLearningDisability) return null;

  return (
    <div className={className}>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 animate-pulse"
          size="icon"
          aria-label="Open AI Tutor"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed z-50 shadow-2xl transition-all duration-300 ${
          isMinimized 
            ? 'bottom-6 right-6 w-72 h-auto' 
            : 'bottom-6 right-6 w-96 h-[600px] max-h-[80vh]'
        } flex flex-col border-purple-200 bg-white`}>
          {/* Header */}
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Learning Buddy</CardTitle>
                  <p className="text-xs text-white/80">Always here to help! 💜</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                {/* Scrollable Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-purple-400"
                  style={{ 
                    maxHeight: 'calc(600px - 180px)',
                    minHeight: '200px'
                  }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-purple-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mt-1 opacity-50 hover:opacity-100"
                            onClick={() => speakMessage(message.content)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Scroll anchor */}
                  <div id="chat-bottom" />
                </div>

                {/* Suggested Questions */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1 px-2 rounded-full"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 rounded-full"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isLoading}
                      className="rounded-full bg-purple-500 hover:bg-purple-600"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

export default AITutorChatbot;
