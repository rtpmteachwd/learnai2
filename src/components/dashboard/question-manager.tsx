'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit,
  ListOrdered,
  CheckCircle,
  Type,
  FileText,
  GripVertical,
  Loader2,
  Upload,
  FileIcon,
  X,
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  difficultyLevel: number;
  hintUrl?: string | null;
  hintName?: string | null;
}

interface QuestionManagerProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: ListOrdered },
  { value: 'true_false', label: 'True/False', icon: CheckCircle },
  { value: 'identification', label: 'Identification', icon: Type },
  { value: 'essay', label: 'Essay', icon: FileText },
];

export function QuestionManager({ quizId, quizTitle, onClose }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1,
    difficultyLevel: 3,
    hintUrl: '',
    hintName: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching questions for quiz:', quizId);
      const response = await fetch(`/api/questions?quizId=${quizId}`);
      const data = await response.json();
      console.log('Questions response:', data);
      if (data.success) {
        setQuestions(data.questions || []);
      } else {
        console.error('Failed to fetch questions:', data.error);
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionForm({
      questionText: '',
      questionType: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
      difficultyLevel: 3,
      hintUrl: '',
      hintName: '',
    });
  };

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
        setQuestionForm(prev => ({
          ...prev,
          hintUrl: data.url,
          hintName: data.name,
        }));
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

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.questionText) {
      toast.error('Please enter the question text');
      return;
    }

    // For non-essay questions, require correct answer
    if (questionForm.questionType !== 'essay' && !questionForm.correctAnswer) {
      toast.error('Please provide the correct answer');
      return;
    }

    setIsSaving(true);
    try {
      let options = null;
      if (questionForm.questionType === 'multiple_choice') {
        const filledOptions = questionForm.options.filter(o => o.trim());
        if (filledOptions.length < 2) {
          toast.error('Please provide at least 2 options for multiple choice');
          setIsSaving(false);
          return;
        }
        options = filledOptions;
      } else if (questionForm.questionType === 'true_false') {
        options = ['True', 'False'];
      }

      const payload = {
        quizId,
        questionText: questionForm.questionText,
        questionType: questionForm.questionType,
        options,
        correctAnswer: questionForm.correctAnswer || '',
        explanation: questionForm.explanation || null,
        points: questionForm.points,
        difficultyLevel: questionForm.difficultyLevel,
        hintUrl: questionForm.hintUrl || null,
        hintName: questionForm.hintName || null,
      };

      console.log('Creating question with payload:', payload);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Create question response:', data);
      
      if (data.success) {
        toast.success('Question added successfully!');
        setIsAddDialogOpen(false);
        resetForm();
        // Refresh questions list
        await fetchQuestions();
      } else {
        toast.error(data.error || 'Failed to add question');
      }
    } catch (error) {
      console.error('Add question error:', error);
      toast.error('Failed to add question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsSaving(true);
    try {
      let options = null;
      if (questionForm.questionType === 'multiple_choice') {
        options = questionForm.options.filter(o => o.trim());
      } else if (questionForm.questionType === 'true_false') {
        options = ['True', 'False'];
      }

      const response = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingQuestion.id,
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          options,
          correctAnswer: questionForm.correctAnswer,
          explanation: questionForm.explanation || null,
          points: questionForm.points,
          difficultyLevel: questionForm.difficultyLevel,
          hintUrl: questionForm.hintUrl || null,
          hintName: questionForm.hintName || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Question updated successfully!');
        setIsEditDialogOpen(false);
        setEditingQuestion(null);
        resetForm();
        fetchQuestions();
      } else {
        toast.error('Failed to update question');
      }
    } catch (error) {
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions?id=${questionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Question deleted');
        fetchQuestions();
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      toast.error('Failed to delete question');
    }
    setDeleteTarget(null);
  };

  const openEditDialog = (question: Question) => {
    let options = ['', '', '', ''];
    if (question.options) {
      try {
        const parsed = JSON.parse(question.options);
        options = [...parsed, ...Array(4 - parsed.length).fill('')].slice(0, 4);
      } catch {
        options = question.options.split(',').map((s) => s.trim());
      }
    }

    setQuestionForm({
      questionText: question.questionText,
      questionType: question.questionType,
      options,
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      points: question.points,
      difficultyLevel: question.difficultyLevel,
      hintUrl: question.hintUrl || '',
      hintName: question.hintName || '',
    });
    setEditingQuestion(question);
    setIsEditDialogOpen(true);
  };

  const getQuestionTypeIcon = (type: string) => {
    const qType = QUESTION_TYPES.find((t) => t.value === type);
    return qType?.icon || ListOrdered;
  };

  const parseOptions = (optionsJson: string | null): string[] => {
    if (!optionsJson) return [];
    try {
      return JSON.parse(optionsJson);
    } catch {
      return optionsJson.split(',').map((s) => s.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manage Questions</h2>
          <p className="text-sm text-muted-foreground">{quizTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{questions.length} Questions</Badge>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No questions yet. Add your first question!</p>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {questions.map((question, index) => {
              const Icon = getQuestionTypeIcon(question.questionType);
              return (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {QUESTION_TYPES.find((t) => t.value === question.questionType)?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.points} pt{question.points > 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Level {question.difficultyLevel}
                          </Badge>
                          {question.hintUrl && (
                            <Badge variant="outline" className="text-xs text-blue-600">
                              <FileIcon className="h-3 w-3 mr-1" />
                              Has Reference
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{question.questionText}</p>
                        {question.questionType === 'multiple_choice' && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parseOptions(question.options).map((opt, i) => (
                              <Badge
                                key={i}
                                variant={opt === question.correctAnswer ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {opt}
                                {opt === question.correctAnswer && ' ✓'}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {question.questionType !== 'multiple_choice' && question.questionType !== 'essay' && (
                          <p className="text-sm text-green-600 mt-1">
                            Answer: {question.correctAnswer}
                          </p>
                        )}
                        {question.questionType === 'essay' && (
                          <p className="text-sm text-blue-600 mt-1">
                            (Teacher graded question)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Add Question Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>Create a new question for this quiz</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(v) => {
                  setQuestionForm({
                    ...questionForm,
                    questionType: v,
                    correctAnswer: v === 'true_false' ? 'True' : '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                placeholder="Enter your question..."
                className="min-h-24"
                required
              />
            </div>

            {questionForm.questionType === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options (fill at least 2)</Label>
                <div className="space-y-2">
                  {questionForm.options.map((opt, i) => (
                    <Input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {questionForm.questionType !== 'essay' && (
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                {questionForm.questionType === 'true_false' ? (
                  <Select
                    value={questionForm.correctAnswer}
                    onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : questionForm.questionType === 'multiple_choice' ? (
                  <Select
                    value={questionForm.correctAnswer}
                    onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionForm.options.filter((o) => o.trim()).map((opt, i) => (
                        <SelectItem key={i} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer"
                    required
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explain why this is the correct answer..."
                className="min-h-20"
              />
            </div>

            {/* Hint/Reference Upload */}
            <div className="space-y-2">
              <Label>Hint/Reference File (Optional)</Label>
              {questionForm.hintUrl ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <FileIcon className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{questionForm.hintName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestionForm({ ...questionForm, hintUrl: '', hintName: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a file to give students hints or additional references (PDF, DOC, Images)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select
                  value={String(questionForm.difficultyLevel)}
                  onValueChange={(v) => setQuestionForm({ ...questionForm, difficultyLevel: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Elementary</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update this question</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditQuestion} className="space-y-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(v) => {
                  setQuestionForm({
                    ...questionForm,
                    questionType: v,
                    correctAnswer: v === 'true_false' ? 'True' : '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                placeholder="Enter your question..."
                className="min-h-24"
                required
              />
            </div>

            {questionForm.questionType === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {questionForm.options.map((opt, i) => (
                    <Input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {questionForm.questionType !== 'essay' && (
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                {questionForm.questionType === 'true_false' ? (
                  <Select
                    value={questionForm.correctAnswer}
                    onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : questionForm.questionType === 'multiple_choice' ? (
                  <Select
                    value={questionForm.correctAnswer}
                    onValueChange={(v) => setQuestionForm({ ...questionForm, correctAnswer: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionForm.options.filter((o) => o.trim()).map((opt, i) => (
                        <SelectItem key={i} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer"
                    required
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explain why this is the correct answer..."
                className="min-h-20"
              />
            </div>

            {/* Hint/Reference Upload for Edit */}
            <div className="space-y-2">
              <Label>Hint/Reference File (Optional)</Label>
              {questionForm.hintUrl ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <FileIcon className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{questionForm.hintName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestionForm({ ...questionForm, hintUrl: '', hintName: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select
                  value={String(questionForm.difficultyLevel)}
                  onValueChange={(v) => setQuestionForm({ ...questionForm, difficultyLevel: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Elementary</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This question will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteQuestion(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
