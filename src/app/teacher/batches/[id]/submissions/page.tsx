"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Task } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import {
  getBatchById,
  getSubmissionsByBatch,
  getTasksByBatch,
  getUserById,
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

interface StudentFile {
  submissionId: string;
  fileUrl: string;
  fileName: string;
  studentId: string;
  taskId?: string; // Optional: only needed for combined daily listening tasks
  taskTitle?: string; // Optional: only needed for combined daily listening tasks
}

interface StudentSubmission {
  studentId: string;
  files: StudentFile[];
}

interface TaskFiles {
  task: Task;
  studentSubmissions: StudentSubmission[];
}

export default function BatchSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [tasksWithFiles, setTasksWithFiles] = useState<TaskFiles[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    submissionId: string;
    fileUrl: string;
    fileName: string;
    studentId: string;
  } | null>(null);
  const [taskToDeleteAll, setTaskToDeleteAll] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

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

      // Initialize all tasks (even if no files), but exclude announcements
      tasks.forEach((task) => {
        // Skip announcement tasks as they don't have submissions
        if (task.type === "announcement") {
          return;
        }
        taskFilesMap.set(task.id, {
          task,
          studentSubmissions: [],
        });
      });

      // Group files by task and student
      const uniqueStudentIds = new Set<string>();
      submissions.forEach((submission) => {
        const taskFiles = taskFilesMap.get(submission.taskId);
        if (taskFiles) {
          // Check if fileUrls exists and is an array with content
          if (submission.fileUrls && Array.isArray(submission.fileUrls) && submission.fileUrls.length > 0) {
            // Track student ID for loading student info
            if (submission.studentId) {
              uniqueStudentIds.add(submission.studentId);
            }

            // Find or create student submission entry
            let studentSubmission = taskFiles.studentSubmissions.find(
              (s) => s.studentId === submission.studentId
            );

            if (!studentSubmission) {
              studentSubmission = {
                studentId: submission.studentId,
                files: [],
              };
              taskFiles.studentSubmissions.push(studentSubmission);
            }

            // Add files to student submission
            submission.fileUrls.forEach((fileUrl, index) => {
              if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
                try {
                  const fileName = getFileNameFromUrl(fileUrl);
                  // For daily listening tasks, include task info for later display
                  const isDailyListening = taskFiles.task.type === "dailyListening";
                  studentSubmission.files.push({
                    submissionId: submission.id,
                    fileUrl,
                    fileName,
                    studentId: submission.studentId,
                    ...(isDailyListening && {
                      taskId: submission.taskId,
                      taskTitle: taskFiles.task.title,
                    }),
                  });
                } catch (error) {
                  console.error(`Error processing file URL ${index + 1} in submission ${submission.id}:`, error, fileUrl);
                }
              } else {
                console.warn(`Invalid file URL at index ${index} in submission ${submission.id}:`, fileUrl);
              }
            });
          }
        }
      });

      // Load student information for all unique student IDs
      const studentsMap = new Map<string, User>();
      const studentLoadPromises = Array.from(uniqueStudentIds).map(async (studentId) => {
        try {
          const student = await getUserById(studentId);
          if (student) {
            studentsMap.set(studentId, student);
          }
        } catch (error) {
          console.error(`Failed to load student ${studentId}:`, error);
        }
      });
      await Promise.all(studentLoadPromises);
      setStudentsMap(studentsMap);

      // Sort student submissions by student name for each task
      taskFilesMap.forEach((taskFiles) => {
        taskFiles.studentSubmissions.sort((a, b) => {
          const studentA = studentsMap.get(a.studentId);
          const studentB = studentsMap.get(b.studentId);
          const nameA = studentA?.name || "Unknown Student";
          const nameB = studentB?.name || "Unknown Student";
          return nameA.localeCompare(nameB);
        });
      });

      console.log("Final task files map:", Array.from(taskFilesMap.entries()).map(([taskId, data]) => ({
        taskId,
        taskTitle: data.task.title,
        studentCount: data.studentSubmissions.length,
        totalFiles: data.studentSubmissions.reduce((sum, s) => sum + s.files.length, 0)
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

        // Combine all student submissions from all daily listening tasks
        const studentSubmissionsMap = new Map<string, StudentSubmission>();

        dailyListeningTasks.forEach((taskFiles) => {
          taskFiles.studentSubmissions.forEach((studentSub) => {
            const existing = studentSubmissionsMap.get(studentSub.studentId);
            if (existing) {
              existing.files.push(...studentSub.files);
            } else {
              studentSubmissionsMap.set(studentSub.studentId, {
                studentId: studentSub.studentId,
                files: [...studentSub.files],
              });
            }
          });
        });

        combinedDailyListening.push({
          task: {
            ...representativeTask,
            id: `daily-listening-combined-${batchId}`, // Special ID for combined group
            title: "Daily Listening",
            description: `${dailyListeningTasks.length} daily listening task${dailyListeningTasks.length !== 1 ? "s" : ""} combined`,
          },
          studentSubmissions: Array.from(studentSubmissionsMap.values()).sort((a, b) => {
            const studentA = studentsMap.get(a.studentId);
            const studentB = studentsMap.get(b.studentId);
            const nameA = studentA?.name || "Unknown Student";
            const nameB = studentB?.name || "Unknown Student";
            return nameA.localeCompare(nameB);
          }),
        });
      }

      // Sort other tasks by creation date (newest first)
      otherTasks.sort(
        (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
      );

      // Combine: other tasks first, then daily listening group at the end
      const finalTasksWithFiles = [...otherTasks, ...combinedDailyListening];

      setTasksWithFiles(finalTasksWithFiles);
      // Clear selection when data is reloaded
      setSelectedFiles(new Set());
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
    fileName: string,
    studentId: string
  ) => {
    setFileToDelete({ submissionId, fileUrl, fileName, studentId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      console.log("Deleting file:", fileToDelete.fileName, "from URL:", fileToDelete.fileUrl);

      // Delete file from storage (returns false if file doesn't exist)
      const fileExisted = await deleteFileByUrl(fileToDelete.fileUrl);

      if (fileExisted) {
        console.log("File deleted from storage successfully");
      } else {
        console.log("File was already deleted or doesn't exist in storage");
      }

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
        description: fileExisted
          ? "File deleted successfully"
          : "File reference removed (file was already deleted from storage)",
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
      let filesDeleted = 0;
      let filesNotFound = 0;

      for (const submission of taskSubmissions) {
        console.log(`Processing submission ${submission.id} with ${submission.fileUrls.length} files`);

        // Delete all files from storage
        for (const fileUrl of submission.fileUrls) {
          totalFiles++;
          deletePromises.push(
            deleteFileByUrl(fileUrl)
              .then((existed) => {
                if (existed) {
                  filesDeleted++;
                } else {
                  filesNotFound++;
                }
              })
              .catch((error) => {
                // Only throw if it's not a "file not found" error
                if (error?.code !== 'storage/object-not-found' &&
                  !(error instanceof Error && error.message.includes('object-not-found'))) {
                  console.error(`Failed to delete file ${fileUrl}:`, error);
                  throw error;
                } else {
                  filesNotFound++;
                }
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
      console.log(`All files processed: ${filesDeleted} deleted, ${filesNotFound} already missing`);

      const description = filesNotFound > 0
        ? `All file references removed. ${filesDeleted} file(s) deleted, ${filesNotFound} file(s) were already missing from storage.`
        : `All files for "${taskToDeleteAll.title}" deleted successfully`;

      toast({
        title: "Success",
        description,
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

  // Multi-select delete handlers
  const handleFileSelect = (fileUrl: string, checked: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(fileUrl);
      } else {
        newSet.delete(fileUrl);
      }
      return newSet;
    });
  };

  const handleSelectAll = (taskFiles: TaskFiles, checked: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        // Add all file URLs from this task
        taskFiles.studentSubmissions.forEach((studentSub) => {
          studentSub.files.forEach((file) => {
            newSet.add(file.fileUrl);
          });
        });
      } else {
        // Remove all file URLs from this task
        taskFiles.studentSubmissions.forEach((studentSub) => {
          studentSub.files.forEach((file) => {
            newSet.delete(file.fileUrl);
          });
        });
      }
      return newSet;
    });
  };

  const getSelectedFilesForTask = (taskFiles: TaskFiles): StudentFile[] => {
    const selected: StudentFile[] = [];
    taskFiles.studentSubmissions.forEach((studentSub) => {
      studentSub.files.forEach((file) => {
        if (selectedFiles.has(file.fileUrl)) {
          selected.push(file);
        }
      });
    });
    return selected;
  };

  const handleDeleteSelectedClick = () => {
    setDeleteSelectedDialogOpen(true);
  };

  const handleDeleteSelectedConfirm = async () => {
    if (selectedFiles.size === 0) return;

    setDeletingSelected(true);
    try {
      // Get all submissions to update
      const submissions = await getSubmissionsByBatch(batchId);

      // Group selected files by submission ID
      const filesBySubmission = new Map<string, { fileUrl: string; fileName: string }[]>();

      // Find all selected files across all tasks
      tasksWithFiles.forEach(({ task, studentSubmissions }) => {
        // Only process non-daily-listening tasks
        if (task.type !== "dailyListening") {
          studentSubmissions.forEach((studentSub) => {
            studentSub.files.forEach((file) => {
              if (selectedFiles.has(file.fileUrl)) {
                const existing = filesBySubmission.get(file.submissionId) || [];
                existing.push({ fileUrl: file.fileUrl, fileName: file.fileName });
                filesBySubmission.set(file.submissionId, existing);
              }
            });
          });
        }
      });

      console.log(`Deleting ${selectedFiles.size} selected files from ${filesBySubmission.size} submissions`);

      // Delete files from storage and update submissions
      const deletePromises: Promise<void>[] = [];
      let filesDeleted = 0;
      let filesNotFound = 0;

      for (const [submissionId, files] of filesBySubmission.entries()) {
        const submission = submissions.find((s) => s.id === submissionId);
        if (!submission) {
          console.warn(`Submission ${submissionId} not found`);
          continue;
        }

        // Delete each file from storage
        for (const file of files) {
          deletePromises.push(
            deleteFileByUrl(file.fileUrl)
              .then((existed) => {
                if (existed) {
                  filesDeleted++;
                } else {
                  filesNotFound++;
                }
              })
              .catch((error) => {
                if (error?.code !== 'storage/object-not-found' &&
                  !(error instanceof Error && error.message.includes('object-not-found'))) {
                  console.error(`Failed to delete file ${file.fileUrl}:`, error);
                  throw error;
                } else {
                  filesNotFound++;
                }
              })
          );
        }

        // Update submission to remove deleted file URLs
        const updatedFileUrls = submission.fileUrls.filter(
          (url) => !files.some((f) => f.fileUrl === url)
        );

        if (updatedFileUrls.length !== submission.fileUrls.length) {
          deletePromises.push(
            updateSubmission(submissionId, {
              fileUrls: updatedFileUrls,
            }).catch((error) => {
              console.error(`Failed to update submission ${submissionId}:`, error);
              throw error;
            })
          );
        }
      }

      await Promise.all(deletePromises);
      console.log(`Selected files processed: ${filesDeleted} deleted, ${filesNotFound} already missing`);

      const description = filesNotFound > 0
        ? `${filesDeleted} file(s) deleted, ${filesNotFound} file(s) were already missing from storage.`
        : `${selectedFiles.size} file(s) deleted successfully`;

      toast({
        title: "Success",
        description,
      });

      // Clear selection and reload data
      setSelectedFiles(new Set());
      await loadData();
    } catch (error) {
      console.error("Error deleting selected files:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete selected files",
        variant: "destructive",
      });
    } finally {
      setDeletingSelected(false);
      setDeleteSelectedDialogOpen(false);
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
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
          {tasksWithFiles.map(({ task, studentSubmissions }) => {
            const TaskIcon = getTaskTypeIcon(task.type);
            const taskColor = getTaskTypeColor(task.type);
            const isDailyListening = task.type === "dailyListening";
            const totalFiles = studentSubmissions.reduce((sum, s) => sum + s.files.length, 0);

            return (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{
                          backgroundColor: `${taskColor}20`,
                          color: taskColor,
                        }}
                      >
                        <TaskIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl sm:text-2xl break-words">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {getTaskTypeLabel(task.type)} • {studentSubmissions.length} student
                          {studentSubmissions.length !== 1 ? "s" : ""} • {totalFiles} file
                          {totalFiles !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{task.status}</Badge>
                      {isDailyListening && totalFiles > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAllClick(task)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </Button>
                      )}
                      {!isDailyListening && totalFiles > 0 && (
                        <>
                          {(() => {
                            const selectedForTask = getSelectedFilesForTask({ task, studentSubmissions });
                            const allSelected = selectedForTask.length > 0 && selectedForTask.length === totalFiles;
                            const someSelected = selectedForTask.length > 0 && selectedForTask.length < totalFiles;
                            return (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectAll({ task, studentSubmissions }, !allSelected)}
                                >
                                  {allSelected ? "Deselect All" : "Select All"}
                                </Button>
                                {selectedForTask.length > 0 && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteSelectedClick}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected ({selectedForTask.length})
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {studentSubmissions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No student submissions for this task.</p>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {studentSubmissions.map((studentSub) => {
                        const student = studentsMap.get(studentSub.studentId);
                        const studentName = student?.name || "Unknown Student";
                        const studentEmail = student?.email || "";
                        const fileCount = studentSub.files.length;

                        return (
                          <AccordionItem
                            key={studentSub.studentId}
                            value={studentSub.studentId}
                            className="border-b"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4 gap-2">
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                  <span className="font-medium text-base break-words">
                                    {studentName}
                                  </span>
                                  {studentEmail && (
                                    <span className="text-sm text-muted-foreground break-all">
                                      {studentEmail}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                  {fileCount} file{fileCount !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                {studentSub.files.map((file: StudentFile, index: number) => {
                                  const isDailyListening = task.type === "dailyListening";
                                  const isSelected = selectedFiles.has(file.fileUrl);

                                  return (
                                    <div
                                      key={index}
                                      className={`flex flex-col p-3 bg-muted rounded-lg border gap-2 ${isSelected && !isDailyListening ? 'ring-2 ring-primary' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {!isDailyListening && (
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                              handleFileSelect(file.fileUrl, checked === true)
                                            }
                                            className="flex-shrink-0"
                                          />
                                        )}
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm truncate" title={file.fileName}>
                                          {file.fileName}
                                        </span>
                                      </div>
                                      {file.taskTitle && (
                                        <div className="flex items-center gap-1">
                                          <Badge variant="outline" className="text-xs">
                                            {file.taskTitle}
                                          </Badge>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 flex-shrink-0 self-end">
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
                                              file.fileName,
                                              file.studentId
                                            )
                                          }
                                          title="Delete file"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
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

      {/* Delete Selected Files Dialog */}
      <AlertDialog
        open={deleteSelectedDialogOpen}
        onOpenChange={setDeleteSelectedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFiles.size} selected file{selectedFiles.size !== 1 ? "s" : ""}?
              This action cannot be undone and the files will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSelected}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedConfirm}
              disabled={deletingSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSelected ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
