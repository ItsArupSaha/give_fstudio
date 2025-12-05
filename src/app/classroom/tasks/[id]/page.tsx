"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
  createSubmission,
  getSubmissionByTaskAndStudent,
  getTaskById,
} from "@/lib/services/firestore";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Star,
  Upload,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TaskSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId || !user?.uid) return;

    const loadData = async () => {
      try {
        const [taskData, submissionData] = await Promise.all([
          getTaskById(taskId),
          getSubmissionByTaskAndStudent(taskId, user.uid),
        ]);

        if (!taskData) {
          toast({
            title: "Error",
            description: "Task not found",
            variant: "destructive",
          });
          router.back();
          return;
        }

        setTask(taskData);
        if (submissionData) {
          setSubmission(submissionData);
          setNotes(submissionData.notes || "");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load task",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId, user?.uid, router, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!task || !user?.uid) return;

    // Validation: For non-Daily Listening tasks, require at least one submission
    if (task.type !== "dailyListening") {
      if (selectedFiles.length === 0 && !notes.trim()) {
        toast({
          title: "Validation Error",
          description: "Please add at least one submission (file or notes)",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for late submission for Daily Listening
    if (task.type === "dailyListening" && task.dueDate) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      if (currentDate > dueDateOnly) {
        toast({
          title: "Error",
          description: "Daily Listening cannot be submitted after the due date",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // TODO: Upload files to Firebase Storage and get URLs
      // For now, we'll use file names as placeholders
      const fileUrls: string[] = selectedFiles.map((file) => file.name);

      const submissionData: Omit<Submission, "id"> = {
        taskId: task.id,
        studentId: user.uid,
        batchId: task.batchId,
        status: "submitted",
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
        fileUrls: task.type === "dailyListening" ? [] : fileUrls,
        recordingUrl: undefined,
        notes: task.type === "dailyListening" ? undefined : (notes.trim() || undefined),
      };

      await createSubmission(submissionData);

      toast({
        title: "Success",
        description:
          task.type === "dailyListening"
            ? "Daily Listening marked as completed for today!"
            : "Task submitted successfully!",
      });

      router.back();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const TaskIcon = getTaskTypeIcon(task.type);
  const taskColor = getTaskTypeColor(task.type);
  const isOverdue = task.dueDate && new Date() > task.dueDate;
  const isDueSoon =
    task.dueDate &&
    !isOverdue &&
    Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3;
  const alreadySubmitted = submission?.status === "submitted" || submission?.status === "graded";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Task Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
              >
                <TaskIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <CardDescription className="mt-1">
                  {getTaskTypeLabel(task.type)}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                task.status === "published"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : task.status === "closed"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-4">
            <p className="whitespace-pre-wrap">{task.description}</p>
          </div>

          {task.type !== "announcement" && (
            <div className="flex flex-wrap gap-2">
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={
                    isOverdue
                      ? "bg-red-50 text-red-700 border-red-200"
                      : isDueSoon
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                  }
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                  {isOverdue && " (Overdue)"}
                  {isDueSoon && !isOverdue && " (Due Soon)"}
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Star className="h-3 w-3 mr-1" />
                {task.maxPoints} points
              </Badge>
            </div>
          )}

          {task.instructions && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <p className="text-sm whitespace-pre-wrap">{task.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {alreadySubmitted ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-green-600 mb-4">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Already Submitted</h3>
            <p className="text-muted-foreground mb-4">
              You have already submitted this task.
              {submission?.status === "graded" && submission.grade !== undefined && (
                <span className="block mt-2">
                  Grade: <strong>{submission.grade}/{task.maxPoints}</strong>
                </span>
              )}
            </p>
            {submission?.feedback && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-sm">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File Upload Section */}
          {task.type !== "dailyListening" && (
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Upload pictures or PDF files (Max 10MB per file)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Files
                </Button>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          {task.type !== "dailyListening" && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes (Optional)</CardTitle>
                <CardDescription>
                  Add any additional notes or comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  rows={6}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
