"use client";

import { TaskCreation } from "@/components/teacher/task-creation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import {
  getBatchById,
  getUserById,
  subscribeEnrollmentsByBatch,
  subscribeSubmissionsByTask,
  subscribeTasksByBatch,
  updateEnrollment
} from "@/lib/services/firestore";
import {
  getTaskTypeColor,
  getTaskTypeIcon
} from "@/lib/utils/task-helpers";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ClipboardList,
  Copy,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!batchId) return;

    loadBatch();
    const unsubscribeEnrollments = subscribeEnrollmentsByBatch(
      batchId,
      (enrollments) => {
        setEnrollments(enrollments);
      }
    );

    let submissionUnsubscribers: (() => void)[] = [];

    const unsubscribeTasks = subscribeTasksByBatch(batchId, (tasks) => {
      setTasks(tasks);

      // Clean up previous submission subscriptions
      submissionUnsubscribers.forEach((unsub) => unsub());
      submissionUnsubscribers = [];

      // Subscribe to submissions for each task to get real-time counts
      tasks.forEach((task) => {
        const unsubscribe = subscribeSubmissionsByTask(task.id, (submissions) => {
          setSubmissionCounts((prev) => {
            const newMap = new Map(prev);
            newMap.set(task.id, submissions.length);
            return newMap;
          });
        });
        submissionUnsubscribers.push(unsubscribe);
      });
    });

    return () => {
      unsubscribeEnrollments();
      unsubscribeTasks();
      submissionUnsubscribers.forEach((unsub) => unsub());
    };
  }, [batchId]);

  const loadBatch = async () => {
    try {
      const batchData = await getBatchById(batchId);
      setBatch(batchData);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load batch",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollment: Enrollment) => {
    try {
      await updateEnrollment(enrollment.id, {
        status: "active",
      });
      toast({
        title: "Success",
        description: "Student approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve student",
        variant: "destructive",
      });
    }
  };

  const handleDeclineEnrollment = async (enrollment: Enrollment) => {
    try {
      await updateEnrollment(enrollment.id, {
        status: "declined",
      });
      toast({
        title: "Success",
        description: "Enrollment request declined",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline enrollment",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = async (enrollment: Enrollment) => {
    if (
      !confirm(
        "Are you sure you want to remove this student from the batch?"
      )
    ) {
      return;
    }

    try {
      await updateEnrollment(enrollment.id, {
        status: "dropped",
        droppedAt: new Date(),
      });
      toast({
        title: "Success",
        description: "Student removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = () => {
    if (!batch) return;
    navigator.clipboard.writeText(batch.classCode);
    setCopiedCode(true);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
          <Button onClick={() => router.push("/teacher")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");
  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/teacher")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{batch.name}</h1>
            <p className="text-muted-foreground">{batch.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="text-sm font-medium">Class Code:</span>
              <code className="text-sm font-mono">{batch.classCode}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyCode}
              >
                {copiedCode ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            {batch && <TaskCreation batch={batch} />}
          </div>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students ({activeEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <ClipboardList className="h-4 w-4 mr-2" />
            Pending ({pendingEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Tasks ({tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Students</CardTitle>
              <CardDescription>
                Students currently enrolled in this batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active students yet
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEnrollments.map((enrollment) => (
                    <StudentCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      onRemove={() => handleRemoveStudent(enrollment)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Enrollment Requests</CardTitle>
              <CardDescription>
                Approve or decline student enrollment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingEnrollments.map((enrollment) => (
                    <PendingEnrollmentCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      onApprove={() => handleApproveEnrollment(enrollment)}
                      onDecline={() => handleDeclineEnrollment(enrollment)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>All tasks for this batch</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/daily-listening-analytics`)}
                    variant="outline"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Daily Listening Analytics
                  </Button>
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/submissions`)}
                    variant="outline"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    View All Submissions
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks created yet
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      submissionCount={submissionCounts.get(task.id) ?? task.submissionCount}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentCard({
  enrollment,
  onRemove,
}: {
  enrollment: Enrollment;
  onRemove: () => void;
}) {
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [enrollment.studentId]);

  const loadStudent = async () => {
    try {
      const studentData = await getUserById(enrollment.studentId);
      setStudent(studentData);
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingEnrollmentCard({
  enrollment,
  onApprove,
  onDecline,
}: {
  enrollment: Enrollment;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [enrollment.studentId]);

  const loadStudent = async () => {
    try {
      const studentData = await getUserById(enrollment.studentId);
      setStudent(studentData);
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <p className="text-xs text-muted-foreground">
                Requested {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDecline}>
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button size="sm" onClick={onApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, submissionCount }: { task: Task; submissionCount: number }) {
  const TaskIcon = getTaskTypeIcon(task.type);
  const taskColor = getTaskTypeColor(task.type);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
            >
              <TaskIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{task.title}</p>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                <LinkifiedText text={task.description} />
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.dueDate && (
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.maxPoints > 0 && <span>{task.maxPoints} points</span>}
                <span>{submissionCount} submissions</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
