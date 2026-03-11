'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  HelpCircle,
  Loader2,
  Send,
  Volume2,
  Mic,
  BookOpen,
} from 'lucide-react';

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: 'suggestion',
          category: 'support',
          message: `[${subject}] ${message}`,
        }),
      });

      if (response.ok) {
        toast.success('Your message has been sent! We\'ll get back to you soon.');
        setSubject('');
        setMessage('');
        onOpenChange(false);
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </DialogTitle>
          <DialogDescription>
            Need help? Send us a message or check our guides below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Help */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick Help</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border rounded-lg text-center">
                <Volume2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Text-to-Speech</p>
                <p className="text-xs text-muted-foreground">Click 🔊 buttons to hear content</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Mic className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Speech-to-Text</p>
                <p className="text-xs text-muted-foreground">Click 🎤 buttons to speak</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Courses</p>
                <p className="text-xs text-muted-foreground">Browse your enrolled courses</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <HelpCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium">Quizzes</p>
                <p className="text-xs text-muted-foreground">AI-assisted quiz taking</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="accessibility">Accessibility Help</SelectItem>
                  <SelectItem value="course">Course Related</SelectItem>
                  <SelectItem value="account">Account Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Describe your issue or question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-24"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
