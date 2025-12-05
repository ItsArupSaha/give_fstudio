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
import { useAuthUser } from "@/hooks/use-auth";
import type { Batch } from "@/lib/models/batch";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
  getBatchById,
  getSubmissionsByStudent,
  getTasksByBatch,
  subscribeSubmissionsByStudent,
  subscribeTasksByBatch,
} from "@/lib/services/firestore";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchTasksPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId || !user?.uid) return;

    // Load batch
    getBatchById(batchId)
      .then((batchData) => {
        if (!batchData) {
          setError("Batch not found");
          setLoading(false);
          return;
        }
        setBatch(batchData);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Subscribe to tasks
    const unsubscribeTasks = subscribeTasksByBatch(batchId, (tasksList) => {
      setTasks(tasksList);
      setLoading(false);
    });

    // Subscribe to submissions
    const unsubscribeSubmissions = subscribeSubmissionsByStudent(user.uid, (submissionsList) => {
      const submissionMap = new Map<string, Submission>();
      for (const submission of submissionsList) {
        submissionMap.set(submission.taskId, submission);
      }
      setSubmissions(submissionMap);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSubmissions();
    };
  }, [batchId, user?.uid]);

  const refreshData = async () => {
    if (!batchId || !user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const batchData = await getBatchById(batchId);
      if (!batchData) {
        setError("Batch not found");
        return;
      }
      setBatch(batchData);

      const tasksList = await getTasksByBatch(batchId);
      setTasks(tasksList);

      const submissionsList = await getSubmissionsByStudent(user.uid);
      const submissionMap = new Map<string, Submission>();
      for (const submission of submissionsList) {
        submissionMap.set(submission.taskId, submission);
      }
      setSubmissions(submissionMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (task: Task) => {
    const submission = submissions.get(task.id);
    if (!submission) {
      return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
    switch (submission.status) {
      case "draft":
        return { status: "draft", label: "Draft", color: "orange" };
      case "submitted":
        return { status: "submitted", label: "Submitted", color: "green" };
      case "graded":
        return { status: "graded", label: "Graded", color: "blue" };
      default:
        return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
  };

  const getTaskStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Draft
          </Badge>
        );
      case "published":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Published
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Closed
          </Badge>
        );
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    return new Date() > task.dueDate;
  };

  const isTaskDueSoon = (task: Task) => {
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil(
      (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  if (loading && !batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Batch</h2>
          <p className="text-muted-foreground mb-4">{error || "Batch not found"}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classroom
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{batch.name} - Tasks</h1>
            <p className="text-muted-foreground">Class Code: {batch.classCode}</p>
          </div>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              {batch.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{batch.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {batch.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Class Code: <strong>{batch.classCode}</strong></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Tasks ({tasks.length})</h2>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const submissionStatus = getSubmissionStatus(task);
              const TaskIcon = getTaskTypeIcon(task.type);
              const taskColor = getTaskTypeColor(task.type);
              const isOverdue = isTaskOverdue(task);
              const isDueSoon = isTaskDueSoon(task);
              const submission = submissions.get(task.id);
              const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";

              return (
                <Card
                  key={task.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${task.type === "announcement" || isSubmitted ? "opacity-75" : ""
                    }`}
                  onClick={() => {
                    if (task.type !== "announcement" && !isSubmitted) {
                      router.push(`/classroom/tasks/${task.id}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                        >
                          <TaskIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${submissionStatus.color === "gray"
                              ? "bg-gray-50 text-gray-700 border-gray-200"
                              : submissionStatus.color === "orange"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : submissionStatus.color === "green"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                        >
                          {submissionStatus.label}
                        </Badge>
                        {getTaskStatusBadge(task.status)}
                      </div>
                    </div>
                  </CardHeader>
                  {task.type !== "announcement" && (
                    <CardContent>
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
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
