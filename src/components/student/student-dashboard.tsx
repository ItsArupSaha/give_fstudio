"use client";

import {
  AlertDialog,
  AlertDialogAction,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { TaskBookmark } from "@/lib/models/task-bookmark";
import {
  createEnrollment,
  getBatchById,
  getTaskById,
  subscribeEnrollmentsByStudent,
  subscribeTaskBookmarksByStudent,
  validateClassCode
} from "@/lib/services/firestore";
import { assignStudentRole } from "@/lib/user-roles";
import { getTaskTypeColor, getTaskTypeIcon, getTaskTypeLabel } from "@/lib/utils/task-helpers";
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  School,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function StudentDashboard() {
  const { user } = useAuthUser();
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [batches, setBatches] = useState<Map<string, Batch>>(new Map());
  const [bookmarks, setBookmarks] = useState<TaskBookmark[]>([]);
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successBatchName, setSuccessBatchName] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time enrollment updates
    const unsubscribeEnrollments = subscribeEnrollmentsByStudent(user.uid, async (enrollmentsList) => {
      setEnrollments(enrollmentsList);

      // Load batch details for each enrollment
      const batchMap = new Map<string, Batch>();
      const batchLoadPromises = enrollmentsList.map(async (enrollment) => {
        if (!batchMap.has(enrollment.batchId)) {
          try {
            const batch = await getBatchById(enrollment.batchId);
            if (batch) {
              batchMap.set(enrollment.batchId, batch);
            }
            // If batch is null (deleted), we simply don't add it to the map
            // This will be handled in the render section
          } catch (error) {
            console.error(`Error loading batch ${enrollment.batchId}:`, error);
            // Continue loading other batches even if one fails
          }
        }
      });

      // Wait for all batch loads to complete (including failures)
      await Promise.allSettled(batchLoadPromises);
      setBatches(batchMap);
      setLoading(false);
    });

    // Subscribe to bookmarks
    const unsubscribeBookmarks = subscribeTaskBookmarksByStudent(user.uid, async (bookmarksList) => {
      setBookmarks(bookmarksList);

      // Load task details for each bookmark
      const taskMap = new Map<string, Task>();
      for (const bookmark of bookmarksList) {
        if (!taskMap.has(bookmark.taskId)) {
          try {
            const task = await getTaskById(bookmark.taskId);
            if (task) {
              taskMap.set(bookmark.taskId, task);
            }
          } catch (error) {
            console.error(`Error loading task ${bookmark.taskId}:`, error);
          }
        }
      }
      setBookmarkedTasks(taskMap);
    });

    return () => {
      unsubscribeEnrollments();
      unsubscribeBookmarks();
    };
  }, [user]);

  const handleJoinBatch = async () => {
    if (!user?.uid || !user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to join a batch",
        variant: "destructive",
      });
      return;
    }

    if (!classCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a class code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Validate class code (returns only batchId and courseGroupId - no batch details)
      const batchInfo = await validateClassCode(classCode.trim().toUpperCase());

      if (!batchInfo) {
        toast({
          title: "Error",
          description: "Invalid class code. Please check the code and try again.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Check if already enrolled
      const isAlreadyEnrolled = enrollments.some(
        (e) => e.batchId === batchInfo.batchId
      );

      if (isAlreadyEnrolled) {
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this batch.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Create enrollment request (student doesn't need to see batch details)
      console.log("Creating enrollment for batch:", batchInfo.batchId);
      const enrollmentId = await createEnrollment({
        studentId: user.uid,
        batchId: batchInfo.batchId,
        courseGroupId: batchInfo.courseGroupId,
        status: "pending",
        enrolledAt: new Date(),
        classCode: classCode.trim().toUpperCase(),
      }, user.email || "");

      console.log("Enrollment created with ID:", enrollmentId);

      // Assign student role if not already assigned
      await assignStudentRole(user.uid, user.email);

      // Show success dialog and toast (use class code instead of batch name since we don't have it)
      setSuccessBatchName(`Class Code: ${classCode.trim().toUpperCase()}`);
      setIsJoinDialogOpen(false);
      setClassCode("");

      // Show toast notification
      toast({
        title: "Request Sent",
        description: `Your enrollment request for class code "${classCode.trim().toUpperCase()}" has been sent. Waiting for teacher approval.`,
      });

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error joining batch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join batch",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusBadge = (status: Enrollment["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <School className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "dropped":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Dropped
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-primary-foreground/90">Welcome back,</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {user?.displayName || user?.email?.split("@")[0] || "Student"}
            </h2>
            <p className="text-primary-foreground/90">
              Continue your spiritual learning journey
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Join Batch
            </CardTitle>
            <CardDescription>
              Enter class code to join a batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Join Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Batch</DialogTitle>
                  <DialogDescription>
                    Enter the class code provided by your teacher to join a batch.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                      id="classCode"
                      placeholder="Enter class code"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      className="uppercase"
                      maxLength={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsJoinDialogOpen(false);
                      setClassCode("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleJoinBatch} disabled={isJoining}>
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Batch"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarked Tasks Section */}
      {bookmarks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="h-6 w-6 fill-yellow-500 text-yellow-500" />
              Bookmarked Tasks ({bookmarks.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks
              .filter((bookmark) => {
                // Only show bookmarks where both task and batch exist
                const task = bookmarkedTasks.get(bookmark.taskId);
                const batch = batches.get(bookmark.batchId);
                return task && batch;
              })
              .map((bookmark) => {
                const task = bookmarkedTasks.get(bookmark.taskId);
                const batch = batches.get(bookmark.batchId);

                // At this point, both should exist due to filter above
                if (!task || !batch) {
                  return null;
                }

                const TaskIcon = getTaskTypeIcon(task.type);
                const taskColor = getTaskTypeColor(task.type);

                return (
                  <Card
                    key={bookmark.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => {
                      if (batch) {
                        router.push(`/classroom/batches/${batch.id}`);
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
                            <TaskIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                            {batch && (
                              <CardDescription className="mt-1">
                                {batch.name}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Bookmark className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Enrolled Batches */}
      <div>
        <h3 className="text-2xl font-bold mb-4">My Batches</h3>
        {(() => {
          const validEnrollments = enrollments.filter((enrollment) =>
            batches.has(enrollment.batchId)
          );
          return validEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-xl font-semibold mb-2">No Batches Yet</h4>
                <p className="text-muted-foreground mb-4">
                  Join a batch using a class code to start learning
                </p>
                <Button onClick={() => setIsJoinDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Join Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {validEnrollments.map((enrollment) => {
                const batch = batches.get(enrollment.batchId);
                // At this point, batch should always exist due to filter above
                if (!batch) {
                  return null;
                }

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {batch.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{batch.name}</CardTitle>
                          </div>
                        </div>
                        {getStatusBadge(enrollment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {batch.description && (
                        <div className="mb-4">
                          <ExpandableDescription text={batch.description} maxLines={2} className="text-sm" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {enrollment.status === "active" && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => router.push(`/classroom/batches/${batch.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Tasks
                        </Button>
                      )}
                      {enrollment.status === "pending" && (
                        <p className="text-sm text-orange-600 mt-4 text-center">
                          Waiting for approval
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <AlertDialogTitle>Request Sent Successfully!</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              <p className="mb-4">
                Your enrollment request for <strong>{successBatchName}</strong> has been sent successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Your request is now pending approval</li>
                      <li>The teacher will review your request</li>
                      <li>You will be able to access the batch once approved</li>
                      <li>Check back later for updates on your enrollment status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
