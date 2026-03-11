'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useAccessibilityStore } from '@/lib/store';
import { TTSButton } from '@/components/assistance/tts-button';
import { ASRButton } from '@/components/assistance/asr-button';
import { GestureRecognition } from '@/components/assistance/gesture-recognition';
import { toast } from 'sonner';
import {
  Calendar,
  Upload,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  FileIcon,
  X,
  Volume2,
  Mic,
  Brain,
  AlertCircle,
  XCircle,
  Hand,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  course?: { title: string };
  submissions?: any[];
}

interface AssignmentSubmissionProps {
  assignment: Assignment;
  studentId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function AssignmentSubmission({ assignment, studentId, onClose, onSubmitSuccess }: AssignmentSubmissionProps) {
  const { fontSize, ttsEnabled, asrEnabled, signLanguageEnabled } = useAccessibilityStore();
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [usedTTS, setUsedTTS] = useState(false);
  const [usedASR, setUsedASR] = useState(false);
  const [usedSignLang, setUsedSignLang] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  useEffect(() => {
    // Check for existing submission
    const checkSubmission = async () => {
      try {
        const response = await fetch(`/api/assignment-submissions?assignmentId=${assignment.id}&studentId=${studentId}`);
        const data = await response.json();
        if (data.success && data.submission) {
          setExistingSubmission(data.submission);
          setContent(data.submission.content || '');
          setFileUrl(data.submission.fileUrl || '');
          setFileName(data.submission.fileUrl ? 'Previously uploaded file' : '');
        }
      } catch (error) {
        console.error('Error checking submission:', error);
      }
    };
    
    // Also check the submissions array passed in
    if (assignment.submissions && assignment.submissions.length > 0) {
      const submission = assignment.submissions[0];
      setExistingSubmission(submission);
      setContent(submission.content || '');
      setFileUrl(submission.fileUrl || '');
      setFileName(submission.fileUrl ? 'Previously uploaded file' : '');
    } else {
      checkSubmission();
    }
  }, [assignment.id, studentId, assignment.submissions]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setFileUrl(data.url);
        setFileName(file.name);
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl) {
      toast.error('Please add content or upload a file');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assignment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentId,
          content,
          fileUrl,
          usedTTS,
          usedASR,
          usedSignLang,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Assignment submitted successfully!');
        onSubmitSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranscription = (text: string) => {
    setUsedASR(true);
    setContent(prev => prev + ' ' + text);
  };

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const needsResubmission = existingSubmission?.needsResubmission;

  return (
    <div className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
      {/* Resubmission Required Banner */}
      {needsResubmission && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Resubmission Required</p>
                {existingSubmission?.resubmissionNote && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {existingSubmission.resubmissionNote}
                  </p>
                )}
                <p className="text-sm mt-2">
                  Please review the feedback below and submit a revised version of your assignment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>{assignment.course?.title}</CardDescription>
            </div>
            {existingSubmission && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{assignment.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <TTSButton
                  text={assignment.description}
                  variant="ghost"
                  size="sm"
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  onClick={() => setUsedTTS(true)}
                />
                <span className="text-xs text-muted-foreground">Listen to instructions</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Max Score: {assignment.maxScore}
            </div>
            {isPastDue && !existingSubmission && (
              <Badge variant="destructive">Past Due</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Assistive Features Notice */}
      {(ttsEnabled || asrEnabled || signLanguageEnabled) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-5 w-5 text-primary" />
              <span>
                <strong>AI Assistance Available:</strong> Use the 🔊 button to hear instructions read aloud, 
                use the 🎤 microphone button to speak your answers, or use sign language recognition below.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Language Recognition */}
      {signLanguageEnabled && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hand className="h-5 w-5 text-blue-600" />
              Sign Language Recognition
            </CardTitle>
            <CardDescription>
              Use sign language to communicate your answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GestureRecognition
              onResult={(result) => {
                setUsedSignLang(true);
                setContent(prev => prev + ' ' + result);
                toast.success('Sign recognized: ' + result);
              }}
              mode="sign_language"
            />
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>{existingSubmission ? 'Update Submission' : 'Your Submission'}</CardTitle>
          <CardDescription>
            {existingSubmission 
              ? 'You can update your submission before the deadline'
              : 'Write your response or upload a file'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input */}
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your answer here..."
              className="min-h-40"
            />
            <div className="flex items-center gap-2">
              <TTSButton
                text={content || "Your answer will be read aloud"}
                variant="ghost"
                size="sm"
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
                onClick={() => setUsedTTS(true)}
              />
              {asrEnabled && (
                <ASRButton
                  onTranscription={handleTranscription}
                  variant="ghost"
                  size="sm"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {ttsEnabled && '🔊 Listen'} {asrEnabled && '• 🎤 Speak'}
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attach File (Optional)</Label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FileIcon className="h-4 w-4" />
                <span className="text-sm flex-1 truncate">{fileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFileUrl(''); setFileName(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Upload PDF, DOC, Images, or Text files (max 10MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !fileUrl)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {existingSubmission ? 'Update Submission' : 'Submit Assignment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Submission Info */}
      {existingSubmission && existingSubmission.score !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{existingSubmission.score} / {assignment.maxScore}</p>
                <p className="text-sm text-muted-foreground">
                  {((existingSubmission.score / assignment.maxScore) * 100).toFixed(1)}%
                </p>
              </div>
              {existingSubmission.feedback && (
                <div className="flex-1 ml-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Teacher Feedback:</p>
                  <p className="text-sm text-muted-foreground">{existingSubmission.feedback}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
