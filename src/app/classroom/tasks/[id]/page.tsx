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
import { LinkifiedText } from "@/components/ui/linkified-text";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
  createSubmission,
  deleteSubmission,
  getTaskById,
  subscribeSubmissionByTaskAndStudent
} from "@/lib/services/firestore";
import { uploadFiles } from "@/lib/services/storage";
import { getGracePeriodRemainingMinutes, isWithinGracePeriod } from "@/lib/utils";
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
  const [uploadProgress, setUploadProgress] = useState<Map<number, number>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId || !user?.uid) return;

    const loadTask = async () => {
      try {
        const taskData = await getTaskById(taskId);
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
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load task",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadTask();

    // Subscribe to real-time submission updates
    const unsubscribe = subscribeSubmissionByTaskAndStudent(
      taskId,
      user.uid,
      (submissionData) => {
        if (submissionData) {
          setSubmission(submissionData);
          setNotes(submissionData.notes || "");
        } else {
          setSubmission(null);
          setNotes("");
        }
      }
    );

    return () => unsubscribe();
  }, [taskId, user?.uid, router, toast]);

  // Update grace period countdown
  useEffect(() => {
    if (!submission || !isWithinGracePeriod(submission)) {
      setGracePeriodRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = getGracePeriodRemainingMinutes(submission);
      setGracePeriodRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [submission]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Validate file sizes (max 100MB per file)
      const maxSize = 100 * 1024 * 1024; // 100MB
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach((file) => {
        if (file.size > maxSize) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `The following files exceed 100MB limit: ${invalidFiles.join(", ")}`,
          variant: "destructive",
        });
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!task || !user?.uid) return;

    // Validation: Require at least one submission (file or notes) for all task types except announcements
    if (task.type !== "announcement") {
      if (selectedFiles.length === 0 && !notes.trim()) {
        toast({
          title: "Validation Error",
          description: "Please add at least one submission (file or notes)",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(new Map());

    try {
      let fileUrls: string[] = [];

      // Upload files if any (for all task types except announcements)
      if (selectedFiles.length > 0 && task.type !== "announcement") {
        const basePath = `submissions/${task.id}/${user.uid}`;

        try {
          fileUrls = await uploadFiles(
            selectedFiles,
            basePath,
            (fileIndex, progress) => {
              setUploadProgress((prev) => {
                const newMap = new Map(prev);
                newMap.set(fileIndex, progress);
                return newMap;
              });
            }
          );
        } catch (uploadError) {
          toast({
            title: "Upload Error",
            description: uploadError instanceof Error ? uploadError.message : "Failed to upload files. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
      }

      setIsUploading(false);

      // Create submission
      const submissionData: Omit<Submission, "id"> = {
        taskId: task.id,
        studentId: user.uid,
        batchId: task.batchId,
        status: "submitted",
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
        fileUrls: fileUrls,
        recordingUrl: undefined,
        notes: notes.trim() || undefined,
      };

      await createSubmission(submissionData);

      toast({
        title: "Success",
        description: "Task submitted successfully!",
      });

      // Clear form
      setSelectedFiles([]);
      setNotes("");
      setUploadProgress(new Map());

      // Don't navigate back immediately - let user see the success state
      // The real-time subscription will update the UI to show "Already Submitted"
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submission || !user?.uid) return;

    if (!confirm("Are you sure you want to delete this submission? You can resubmit within the grace period.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSubmission(submission.id, submission.fileUrls);
      toast({
        title: "Success",
        description: "Submission deleted. You can now resubmit.",
      });
      // Clear form
      setSelectedFiles([]);
      setNotes("");
      setUploadProgress(new Map());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
  const withinGracePeriod = isWithinGracePeriod(submission);
  const canEdit = withinGracePeriod && submission?.status === "submitted";

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
              >
                <TaskIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl break-words">{task.title}</CardTitle>
                <CardDescription className="mt-1">
                  {getTaskTypeLabel(task.type)}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                task.status === "published"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
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
            <p className="whitespace-pre-wrap">
              <LinkifiedText text={task.description} />
            </p>
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
              <p className="text-sm whitespace-pre-wrap">
                <LinkifiedText text={task.instructions} />
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {alreadySubmitted && !canEdit ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-orange-600 mb-4">
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
              {!withinGracePeriod && submission?.status === "submitted" && (
                <span className="block mt-2 text-sm text-orange-600">
                  The 15-minute grace period for editing has expired.
                </span>
              )}
            </p>
            {submission?.fileUrls && submission.fileUrls.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {submission.fileUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      <span>File {index + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {submission?.notes && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Notes:</h4>
                <p className="text-sm whitespace-pre-wrap">{submission.notes}</p>
              </div>
            )}
            {submission?.feedback && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-sm">{submission.feedback}</p>
              </div>
            )}
            {withinGracePeriod && submission?.status === "submitted" && (
              <div className="mt-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmission}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete and Resubmit"
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  You have {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining to delete and resubmit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : task.type === "announcement" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Announcements are read-only. No submission required.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {canEdit && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">Grace Period Active</p>
                    <p className="text-sm text-orange-700">
                      You can edit or delete your submission. {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSubmission}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Submission"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload files: PDF, documents, pictures, videos, or audio (Max 100MB per file)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                onChange={handleFileSelect}
                className="hidden"
                disabled={(alreadySubmitted && !canEdit) || isSubmitting}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={(alreadySubmitted && !canEdit) || isSubmitting || isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => {
                    const progress = uploadProgress.get(index);
                    const isUploadingFile = isUploading && progress !== undefined && progress < 100;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            {isUploadingFile && progress !== undefined && (
                              <div className="mt-2">
                                <div className="w-full bg-secondary rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground mt-1 block">
                                  Uploading... {Math.round(progress)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeFile(index);
                            setUploadProgress((prev) => {
                              const newMap = new Map(prev);
                              newMap.delete(index);
                              return newMap;
                            });
                          }}
                          disabled={isUploadingFile}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
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
                disabled={(alreadySubmitted && !canEdit) || isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (alreadySubmitted && !canEdit) || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading Files...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (alreadySubmitted && !canEdit) ? (
                "Already Submitted"
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
