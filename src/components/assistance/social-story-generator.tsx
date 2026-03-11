'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookHeart, 
  Loader2, 
  Sparkles, 
  Volume2, 
  RefreshCw,
  Download,
  Heart,
  School,
  Users,
  Home,
  Briefcase,
  ShoppingBag,
  Bus
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface SocialStoryGeneratorProps {
  className?: string;
}

const SOCIAL_SITUATIONS = [
  { value: 'classroom', label: 'In the Classroom', icon: School },
  { value: 'making_friends', label: 'Making Friends', icon: Users },
  { value: 'at_home', label: 'At Home', icon: Home },
  { value: 'asking_help', label: 'Asking for Help', icon: Heart },
  { value: 'feeling_angry', label: 'When I Feel Angry', icon: '😤' },
  { value: 'feeling_sad', label: 'When I Feel Sad', icon: '😢' },
  { value: 'feeling_worried', label: 'When I Feel Worried', icon: '😰' },
  { value: 'shopping', label: 'Going Shopping', icon: ShoppingBag },
  { value: 'transportation', label: 'Taking Transportation', icon: Bus },
  { value: 'new_teacher', label: 'Meeting a New Teacher', icon: School },
  { value: 'group_work', label: 'Working in a Group', icon: Users },
  { value: 'taking_test', label: 'Taking a Test', icon: '📝' },
  { value: 'recess', label: 'Recess Time', icon: '🎮' },
  { value: 'lunch', label: 'Lunch Time', icon: '🍎' },
  { value: 'custom', label: 'Custom Situation...', icon: Sparkles },
];

export function SocialStoryGenerator({ className }: SocialStoryGeneratorProps) {
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSituation, setSelectedSituation] = useState('');
  const [customSituation, setCustomSituation] = useState('');
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState('');

  // Check if user has learning disability
  const hasLearningDisability = user?.disabilityType === 'LEARNING_DISABILITY';

  const generateStory = useCallback(async () => {
    const situation = selectedSituation === 'custom' ? customSituation : selectedSituation;
    
    if (!situation.trim()) {
      toast.error('Please select or describe a situation');
      return;
    }

    setIsGenerating(true);
    setGeneratedStory(null);

    try {
      const response = await fetch('/api/ai/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Create a social story for the situation: "${situation}"`,
            },
          ],
          mode: 'social_story',
          systemPrompt: `You are an expert in creating social stories for students with autism and learning disabilities.

Create a social story following Carol Gray's guidelines:

1. **Title**: Clear and positive (e.g., "I Can Ask for Help")

2. **Structure**:
   - Start with a title and introduction
   - Use FIRST PERSON perspective ("I", "My")
   - Keep sentences SHORT and POSITIVE
   - Mix sentence types:
     • Descriptive (facts): "Sometimes I feel angry."
     • Perspective (feelings): "It is okay to feel angry."
     • Directive (suggestions): "I can try to take deep breaths."
     • Affirmative (reassurance): "Taking deep breaths helps me feel better."

3. **Content Guidelines**:
   - Be POSITIVE and reassuring
   - Avoid words like "don't", "can't", "never" - use positive alternatives
   - Use simple, concrete language
   - Add coping strategies when appropriate
   - End with something positive the student CAN do

4. **Formatting**:
   - Use clear paragraphs (2-3 sentences each)
   - Add emoji illustrations for visual support 📚
   - Include a "What I Can Remember" summary at the end

5. **Personalization**:
   - Student name: ${user?.name?.split(' ')[0] || 'the student'}
   - Keep it relatable and calming

Generate a complete, reassuring social story now.`,
          studentContext: {
            name: user?.name,
            disabilityType: user?.disabilityType,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedStory(data.response);
        // Extract title from first line
        const firstLine = data.response.split('\n')[0];
        setStoryTitle(firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, ''));
        toast.success('Social story created! 💜');
      } else {
        throw new Error(data.error || 'Failed to generate story');
      }
    } catch (error) {
      console.error('Generate story error:', error);
      toast.error('Could not create story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSituation, customSituation, user]);

  const speakStory = () => {
    if (generatedStory && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const cleanText = generatedStory
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n+/g, '. ');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const downloadStory = () => {
    if (!generatedStory) return;
    
    const blob = new Blob([generatedStory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-story-${storyTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Story downloaded!');
  };

  // Don't render if user doesn't have learning disability
  if (!hasLearningDisability) return null;

  return (
    <Card className={`border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-pink-100 p-2 rounded-lg">
            <BookHeart className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-pink-500" />
              Social Story Generator
            </CardTitle>
            <CardDescription>
              Create personalized stories for social situations
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Situation Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Choose a Situation</label>
          <Select value={selectedSituation} onValueChange={setSelectedSituation}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a situation..." />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_SITUATIONS.map((situation) => (
                <SelectItem key={situation.value} value={situation.value}>
                  <div className="flex items-center gap-2">
                    {typeof situation.icon === 'string' ? (
                      <span>{situation.icon}</span>
                    ) : (
                      <situation.icon className="h-4 w-4" />
                    )}
                    <span>{situation.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Situation Input */}
        {selectedSituation === 'custom' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Describe the Situation</label>
            <Textarea
              value={customSituation}
              onChange={(e) => setCustomSituation(e.target.value)}
              placeholder="Describe the social situation you want a story for... (e.g., 'Going to the dentist for the first time')"
              className="bg-white min-h-20"
            />
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generateStory}
          disabled={isGenerating || !selectedSituation || (selectedSituation === 'custom' && !customSituation.trim())}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Your Story...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Social Story
            </>
          )}
        </Button>

        {/* Generated Story */}
        {generatedStory && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                <Heart className="h-3 w-3 mr-1" />
                Your Social Story
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={speakStory}
                  className="text-pink-600"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  Listen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadStory}
                  className="text-pink-600"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <Card className="bg-white/90 border-pink-100">
              <CardContent className="py-4">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {generatedStory}
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              size="sm"
              onClick={generateStory}
              className="w-full text-pink-600 border-pink-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Create Different Version
            </Button>
          </div>
        )}

        {/* Info */}
        {!generatedStory && (
          <div className="bg-pink-100/50 rounded-lg p-3 text-sm text-pink-700">
            <p className="flex items-start gap-2">
              <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Social Stories</strong> help you understand and feel comfortable in different social situations. They use simple words and positive messages! 💜
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SocialStoryGenerator;
