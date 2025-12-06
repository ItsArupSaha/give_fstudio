"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Task } from "@/lib/models/task";
import {
  getBatchById,
  getSubmissionsByBatch,
  getTasksByBatch,
  updateSubmission,
} from "@/lib/services/firestore";
import { deleteFileByUrl } from "@/lib/services/storage";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TaskFiles {
  task: Task;
  files: Array<{
    submissionId: string;
    fileUrl: string;
    fileName: string;
  }>;
}

export default function BatchSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [tasksWithFiles, setTasksWithFiles] = useState<TaskFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    submissionId: string;
    fileUrl: string;
    fileName: string;
  } | null>(null);
  const [taskToDeleteAll, setTaskToDeleteAll] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    // Redirect if not a teacher
    if (!teacherInitializing && !isTeacher) {
      router.push("/teacher");
      return;
    }
  }, [isTeacher, teacherInitializing, router]);

  useEffect(() => {
    if (!batchId || !isTeacher) return;
    loadData();
  }, [batchId, isTeacher]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load batch, all tasks, and all submissions in parallel
      const [batchData, tasks, submissions] = await Promise.all([
        getBatchById(batchId),
        getTasksByBatch(batchId),
        getSubmissionsByBatch(batchId),
      ]);

      setBatch(batchData);

      console.log("Loaded tasks:", tasks.length);
      console.log("Loaded submissions:", submissions.length);
      console.log("Submissions data:", submissions);

      // Group files by task
      const taskFilesMap = new Map<string, TaskFiles>();

      // Initialize all tasks (even if no files)
      tasks.forEach((task) => {
        taskFilesMap.set(task.id, {
          task,
          files: [],
        });
      });

      // Add files from submissions
      submissions.forEach((submission) => {
        const taskFiles = taskFilesMap.get(submission.taskId);
        if (taskFiles) {
          // Check if fileUrls exists and is an array with content
          if (submission.fileUrls && Array.isArray(submission.fileUrls) && submission.fileUrls.length > 0) {
            console.log(`Submission ${submission.id} for task ${submission.taskId} has ${submission.fileUrls.length} files:`, submission.fileUrls);
            submission.fileUrls.forEach((fileUrl, index) => {
              if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
                try {
                  const fileName = getFileNameFromUrl(fileUrl);
                  console.log(`Processing file ${index + 1}/${submission.fileUrls.length}: URL=${fileUrl}, extracted name=${fileName}`);
                  taskFiles.files.push({
                    submissionId: submission.id,
                    fileUrl,
                    fileName,
                  });
                } catch (error) {
                  console.error(`Error processing file URL ${index + 1} in submission ${submission.id}:`, error, fileUrl);
                }
              } else {
                console.warn(`Invalid file URL at index ${index} in submission ${submission.id}:`, fileUrl);
              }
            });
          } else {
            console.log(`Submission ${submission.id} for task ${submission.taskId} has no files. fileUrls:`, submission.fileUrls);
          }
        } else {
          console.warn(`No task found for submission ${submission.id} with taskId ${submission.taskId}`);
        }
      });

      console.log("Final task files map:", Array.from(taskFilesMap.entries()).map(([taskId, data]) => ({
        taskId,
        taskTitle: data.task.title,
        fileCount: data.files.length
      })));

      // Separate daily listening tasks from other tasks
      const dailyListeningTasks: TaskFiles[] = [];
      const otherTasks: TaskFiles[] = [];

      taskFilesMap.forEach((taskFiles) => {
        if (taskFiles.task.type === "dailyListening") {
          dailyListeningTasks.push(taskFiles);
        } else {
          otherTasks.push(taskFiles);
        }
      });

      // Group all daily listening tasks into one combined group
      const combinedDailyListening: TaskFiles[] = [];
      if (dailyListeningTasks.length > 0) {
        // Use the most recent daily listening task as the representative task
        const sortedDailyListening = dailyListeningTasks.sort(
          (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
        );
        const representativeTask = sortedDailyListening[0].task;

        // Combine all files from all daily listening tasks
        const allDailyListeningFiles: Array<{
          submissionId: string;
          fileUrl: string;
          fileName: string;
        }> = [];

        dailyListeningTasks.forEach((taskFiles) => {
          allDailyListeningFiles.push(...taskFiles.files);
        });

        combinedDailyListening.push({
          task: {
            ...representativeTask,
            id: `daily-listening-combined-${batchId}`, // Special ID for combined group
            title: "Daily Listening",
            description: `${dailyListeningTasks.length} daily listening task${dailyListeningTasks.length !== 1 ? "s" : ""} combined`,
          },
          files: allDailyListeningFiles,
        });
      }

      // Sort other tasks by creation date (newest first)
      otherTasks.sort(
        (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
      );

      // Combine: other tasks first, then daily listening group at the end
      const finalTasksWithFiles = [...otherTasks, ...combinedDailyListening];

      setTasksWithFiles(finalTasksWithFiles);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load submissions. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      if (!url || typeof url !== 'string') {
        console.warn("Invalid URL provided to getFileNameFromUrl:", url);
        return "file";
      }

      const urlObj = new URL(url);
      // Handle both /o/ and /b/{bucket}/o/ patterns
      // Pattern matches: /o/path or /b/bucket-name/o/path
      const pathMatch = urlObj.pathname.match(/\/(?:o|b\/[^\/]+\/o)\/(.+?)(?:\?|$)/);

      if (pathMatch && pathMatch[1]) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const parts = decodedPath.split("/");
        const fileName = parts[parts.length - 1] || "file";
        return fileName;
      }

      // Fallback: try to extract from the full pathname
      const fallbackMatch = urlObj.pathname.match(/\/([^\/]+)$/);
      if (fallbackMatch) {
        return decodeURIComponent(fallbackMatch[1]);
      }

      console.warn("Could not extract filename from URL:", url);
      return "file";
    } catch (error) {
      console.error("Error parsing URL:", url, error);
      return "file";
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (
    submissionId: string,
    fileUrl: string,
    fileName: string
  ) => {
    setFileToDelete({ submissionId, fileUrl, fileName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      console.log("Deleting file:", fileToDelete.fileName, "from URL:", fileToDelete.fileUrl);

      // Delete file from storage
      await deleteFileByUrl(fileToDelete.fileUrl);
      console.log("File deleted from storage successfully");

      // Get current submissions to update the submission document
      const submissions = await getSubmissionsByBatch(batchId);
      const submission = submissions.find((s) => s.id === fileToDelete.submissionId);

      if (submission) {
        // Remove the file URL from submission
        const updatedFileUrls = submission.fileUrls.filter(
          (url) => url !== fileToDelete.fileUrl
        );

        console.log(`Updating submission ${fileToDelete.submissionId}: removing file URL, ${submission.fileUrls.length} -> ${updatedFileUrls.length} files`);

        // Update submission
        await updateSubmission(fileToDelete.submissionId, {
          fileUrls: updatedFileUrls,
        });
        console.log("Submission updated successfully");
      } else {
        console.warn(`Submission ${fileToDelete.submissionId} not found after deletion`);
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteAllClick = (task: Task) => {
    setTaskToDeleteAll(task);
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    if (!taskToDeleteAll) return;

    setDeletingAll(true);
    try {
      console.log(`Deleting all files for task: ${taskToDeleteAll.title} (${taskToDeleteAll.id})`);

      // Get all submissions for this task
      const submissions = await getSubmissionsByBatch(batchId);

      // If it's the combined daily listening group, delete from all daily listening tasks
      let taskSubmissions: typeof submissions;
      if (taskToDeleteAll.title === "Daily Listening" && taskToDeleteAll.type === "dailyListening") {
        // Get all daily listening task IDs
        const tasks = await getTasksByBatch(batchId);
        const dailyListeningTaskIds = tasks
          .filter((t) => t.type === "dailyListening")
          .map((t) => t.id);

        taskSubmissions = submissions.filter((s) =>
          dailyListeningTaskIds.includes(s.taskId)
        );
        console.log(`Found ${taskSubmissions.length} submissions across ${dailyListeningTaskIds.length} daily listening tasks`);
      } else {
        taskSubmissions = submissions.filter(
          (s) => s.taskId === taskToDeleteAll.id
        );
        console.log(`Found ${taskSubmissions.length} submissions for this task`);
      }

      // Delete all files from storage and update submissions
      const deletePromises: Promise<void>[] = [];
      let totalFiles = 0;

      for (const submission of taskSubmissions) {
        console.log(`Processing submission ${submission.id} with ${submission.fileUrls.length} files`);

        // Delete all files from storage
        for (const fileUrl of submission.fileUrls) {
          totalFiles++;
          deletePromises.push(
            deleteFileByUrl(fileUrl).catch((error) => {
              console.error(`Failed to delete file ${fileUrl}:`, error);
              throw error;
            })
          );
        }

        // Update submission to remove all file URLs
        if (submission.fileUrls.length > 0) {
          deletePromises.push(
            updateSubmission(submission.id, {
              fileUrls: [],
            }).catch((error) => {
              console.error(`Failed to update submission ${submission.id}:`, error);
              throw error;
            })
          );
        }
      }

      console.log(`Deleting ${totalFiles} files and updating ${taskSubmissions.length} submissions...`);
      await Promise.all(deletePromises);
      console.log("All files deleted successfully");

      toast({
        title: "Success",
        description: `All files for "${taskToDeleteAll.title}" deleted successfully`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting all files:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete all files",
        variant: "destructive",
      });
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
      setTaskToDeleteAll(null);
    }
  };

  if (teacherInitializing || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You must be a teacher to access this page.
          </p>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/teacher/batches/${batchId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch Details
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Submissions - {batch.name}
          </h1>
          <p className="text-muted-foreground">
            View and manage all submitted files grouped by task
          </p>
        </div>
      </div>

      {tasksWithFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tasks found for this batch
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tasksWithFiles.map(({ task, files }) => {
            const TaskIcon = getTaskTypeIcon(task.type);
            const taskColor = getTaskTypeColor(task.type);
            const isDailyListening = task.type === "dailyListening";

            return (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${taskColor}20`,
                          color: taskColor,
                        }}
                      >
                        <TaskIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {getTaskTypeLabel(task.type)} • {files.length} file
                          {files.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{task.status}</Badge>
                      {isDailyListening && files.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAllClick(task)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>There are no files for this task in our storage.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={file.fileName}>
                              {file.fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleDownload(file.fileUrl, file.fileName)
                              }
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleDeleteClick(
                                  file.submissionId,
                                  file.fileUrl,
                                  file.fileName
                                )
                              }
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Single File Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.fileName}"? This
              action cannot be undone and the file will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Files Dialog (for Daily Listening) */}
      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all files for "{taskToDeleteAll?.title}"?
              This action cannot be undone and all files will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              disabled={deletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting All...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
