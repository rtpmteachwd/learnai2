'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';
import { normalizeFileUrl } from '@/lib/utils';
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Send,
  Loader2,
  Download,
} from 'lucide-react';

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy: string | null;
  needsResubmission: boolean;
  resubmissionNote: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    disabilityType: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  maxScore: number;
  dueDate: string;
}

interface SubmissionViewerProps {
  assignment: Assignment;
  courseId: string;
  onBack: () => void;
}

export function SubmissionViewer({ assignment, courseId, onBack }: SubmissionViewerProps) {
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isResubmission, setIsResubmission] = useState(false);
  const [resubmissionNote, setResubmissionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/assignment-submissions?assignmentId=${assignment.id}`);
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGrading = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
    setIsResubmission(submission.needsResubmission || false);
    setResubmissionNote(submission.resubmissionNote || '');
    setIsGradingOpen(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    if (!isResubmission && !grade) {
      toast.error('Please enter a score');
      return;
    }

    if (isResubmission && !resubmissionNote) {
      toast.error('Please provide a reason for resubmission');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assignment-submissions/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          score: isResubmission ? null : parseFloat(grade),
          feedback: feedback,
          needsResubmission: isResubmission,
          resubmissionNote: isResubmission ? resubmissionNote : null,
          teacherId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isResubmission ? 'Resubmission requested' : 'Grade submitted successfully');
        setIsGradingOpen(false);
        fetchSubmissions();
      } else {
        toast.error(data.error || 'Failed to submit grade');
      }
    } catch (error) {
      toast.error('Failed to submit grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisabilityLabel = (type: string) => {
    const labels: Record<string, string> = {
      NONE: 'None',
      VISUAL_IMPAIRMENT: 'Visual',
      HEARING_IMPAIRMENT: 'Hearing',
      SPEECH_IMPAIRMENT: 'Speech',
      LEARNING_DISABILITY: 'Learning',
      PHYSICAL_DISABILITY: 'Physical',
      MULTIPLE_DISABILITIES: 'Multiple',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (submission: Submission) => {
    if (submission.needsResubmission) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Needs Resubmission
        </Badge>
      );
    }
    if (submission.score !== null) {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Graded: {submission.score}/{assignment.maxScore}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending Review
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assignment.title}
          </CardTitle>
          <CardDescription>
            Max Score: {assignment.maxScore} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        {assignment.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions ({submissions.length})</CardTitle>
          <CardDescription>Review and grade student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{submission.student.name}</span>
                          {submission.student.disabilityType !== 'NONE' && (
                            <Badge variant="outline" className="text-xs">
                              {getDisabilityLabel(submission.student.disabilityType)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                        {submission.content && (
                          <p className="text-sm line-clamp-2">{submission.content}</p>
                        )}
                        {submission.fileUrl && (
                          <a
                            href={normalizeFileUrl(submission.fileUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            View Attached File
                          </a>
                        )}
                        {submission.score !== null && submission.feedback && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">Feedback:</p>
                            <p className="text-muted-foreground">{submission.feedback}</p>
                          </div>
                        )}
                        {submission.needsResubmission && submission.resubmissionNote && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                            <p className="font-medium text-destructive">Resubmission Required:</p>
                            <p className="text-muted-foreground">{submission.resubmissionNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(submission)}
                        <Button size="sm" onClick={() => handleOpenGrading(submission)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {submission.score !== null || submission.needsResubmission ? 'Edit Grade' : 'Grade'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.student?.name}'s Submission
            </DialogTitle>
            <DialogDescription>
              Review and grade this submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Submission Content */}
            {selectedSubmission?.content && (
              <div className="space-y-2">
                <Label>Submission Content</Label>
                <div className="p-3 border rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedSubmission.content}</p>
                </div>
              </div>
            )}

            {/* File Attachment */}
            {selectedSubmission?.fileUrl && (
              <div className="space-y-2">
                <Label>Attached File</Label>
                <a
                  href={normalizeFileUrl(selectedSubmission.fileUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">View Attached File</span>
                  <Download className="h-4 w-4 ml-auto" />
                </a>
              </div>
            )}

            {/* Resubmission Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Request Resubmission</p>
                <p className="text-sm text-muted-foreground">
                  Ask the student to resubmit this assignment
                </p>
              </div>
              <Button
                variant={isResubmission ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsResubmission(!isResubmission)}
              >
                {isResubmission ? 'Resubmission Required' : 'Request Resubmission'}
              </Button>
            </div>

            {/* Resubmission Note */}
            {isResubmission && (
              <div className="space-y-2">
                <Label>Reason for Resubmission *</Label>
                <Textarea
                  value={resubmissionNote}
                  onChange={(e) => setResubmissionNote(e.target.value)}
                  placeholder="Explain why the student needs to resubmit..."
                  className="min-h-24"
                />
              </div>
            )}

            {/* Grade Input (only if not requesting resubmission) */}
            {!isResubmission && (
              <div className="space-y-2">
                <Label>Score (out of {assignment.maxScore}) *</Label>
                <Input
                  type="number"
                  min="0"
                  max={assignment.maxScore}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={`Enter score (0-${assignment.maxScore})`}
                />
              </div>
            )}

            {/* Feedback */}
            <div className="space-y-2">
              <Label>Feedback (Optional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                className="min-h-24"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitGrade} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Send className="h-4 w-4 mr-2" />
                {isResubmission ? 'Request Resubmission' : 'Submit Grade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
