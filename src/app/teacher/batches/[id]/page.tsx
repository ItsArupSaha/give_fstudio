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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Edit,
  Loader2,
  MapPin,
  Phone,
  User as UserIcon,
  Users,
  XCircle
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">{batch.name}</h1>
            {batch.description && (
              <ExpandableDescription text={batch.description} maxLines={3} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
        <TabsList className="flex-wrap w-full sm:w-auto h-auto sm:h-10">
          <TabsTrigger value="students" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Students</span>
            </div>
            <span className="text-xs leading-tight">({activeEnrollments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Pending</span>
            </div>
            <span className="text-xs leading-tight">({pendingEnrollments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Tasks</span>
            </div>
            <span className="text-xs leading-tight">({tasks.length})</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>All tasks for this batch</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/daily-listening-analytics`)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Daily Listening Analytics</span>
                    <span className="sm:hidden">Analytics</span>
                  </Button>
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/submissions`)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">View All Submissions</span>
                    <span className="sm:hidden">Submissions</span>
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
  const { toast } = useToast();
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    studentName: enrollment.studentName || "",
    dikshaName: enrollment.dikshaName || "",
    whatsappNumber: enrollment.whatsappNumber || "",
    address: enrollment.address || "",
  });

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

  // Prioritize diksha name for spiritual platform, then student name, then Google name
  const displayName = enrollment.dikshaName || enrollment.studentName || student.name;
  const hasAdditionalInfo = enrollment.studentName || enrollment.dikshaName || enrollment.whatsappNumber || enrollment.address;

  const handleEdit = () => {
    setEditForm({
      studentName: enrollment.studentName || "",
      dikshaName: enrollment.dikshaName || "",
      whatsappNumber: enrollment.whatsappNumber || "",
      address: enrollment.address || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.studentName.trim()) {
      toast({
        title: "Validation Error",
        description: "Certificate name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editForm.whatsappNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "WhatsApp number is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateEnrollment(enrollment.id, {
        studentName: editForm.studentName.trim(),
        dikshaName: editForm.dikshaName.trim() || "",
        whatsappNumber: editForm.whatsappNumber.trim(),
        address: editForm.address.trim() || "",
      });
      toast({
        title: "Success",
        description: "Student information updated successfully",
      });
      setShowEditDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{displayName}</p>
                {enrollment.dikshaName && enrollment.studentName && enrollment.dikshaName !== enrollment.studentName && (
                  <p className="text-sm text-muted-foreground truncate">
                    Certificate: {enrollment.studentName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground truncate">{student.email}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="bg-background hover:bg-accent"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {hasAdditionalInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="bg-background hover:bg-accent"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Details
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onRemove} className="bg-background hover:bg-accent">
                Remove
              </Button>
            </div>
          </div>

          {showDetails && hasAdditionalInfo && (
            <div className="pt-3 border-t space-y-2">
              {enrollment.studentName && (
                <div className="flex items-start gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Certificate Name:</span>
                    <span className="ml-2">{enrollment.studentName}</span>
                  </div>
                </div>
              )}
              {enrollment.dikshaName && (
                <div className="flex items-start gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Diksha Name:</span>
                    <span className="ml-2">{enrollment.dikshaName}</span>
                  </div>
                </div>
              )}
              {enrollment.whatsappNumber && (
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">WhatsApp:</span>
                    <span className="ml-2">{enrollment.whatsappNumber}</span>
                  </div>
                </div>
              )}
              {enrollment.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Address:</span>
                    <span className="ml-2 whitespace-pre-wrap">{enrollment.address}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[90%] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update the student's information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-studentName">
                Certificate Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-studentName"
                placeholder="Enter certificate name"
                value={editForm.studentName}
                onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dikshaName">Diksha Name (Optional)</Label>
              <Input
                id="edit-dikshaName"
                placeholder="Enter diksha name"
                value={editForm.dikshaName}
                onChange={(e) => setEditForm({ ...editForm, dikshaName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-whatsappNumber">
                WhatsApp Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-whatsappNumber"
                placeholder="Enter WhatsApp number with country code"
                value={editForm.whatsappNumber}
                onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                type="tel"
                required
              />
              <p className="text-xs text-muted-foreground">
                Example: +1234567890
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address (Optional)</Label>
              <Textarea
                id="edit-address"
                placeholder="Enter address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.studentName.trim() || !editForm.whatsappNumber.trim()}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const { toast } = useToast();
  const [student, setStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    studentName: enrollment.studentName || "",
    dikshaName: enrollment.dikshaName || "",
    whatsappNumber: enrollment.whatsappNumber || "",
    address: enrollment.address || "",
  });

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

  // Prioritize diksha name for spiritual platform, then student name, then Google name
  const displayName = enrollment.dikshaName || enrollment.studentName || student.name;
  const hasAdditionalInfo = enrollment.studentName || enrollment.dikshaName || enrollment.whatsappNumber || enrollment.address;

  const handleEdit = () => {
    setEditForm({
      studentName: enrollment.studentName || "",
      dikshaName: enrollment.dikshaName || "",
      whatsappNumber: enrollment.whatsappNumber || "",
      address: enrollment.address || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.studentName.trim()) {
      toast({
        title: "Validation Error",
        description: "Certificate name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editForm.whatsappNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "WhatsApp number is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateEnrollment(enrollment.id, {
        studentName: editForm.studentName.trim(),
        dikshaName: editForm.dikshaName.trim() || "",
        whatsappNumber: editForm.whatsappNumber.trim(),
        address: editForm.address.trim() || "",
      });
      toast({
        title: "Success",
        description: "Student information updated successfully",
      });
      setShowEditDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{displayName}</p>
                {enrollment.dikshaName && enrollment.studentName && enrollment.dikshaName !== enrollment.studentName && (
                  <p className="text-sm text-muted-foreground truncate">
                    Certificate: {enrollment.studentName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                <p className="text-xs text-muted-foreground">
                  Requested {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="bg-background hover:bg-accent"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {hasAdditionalInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="bg-background hover:bg-accent"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Details
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onDecline} className="bg-background hover:bg-accent">
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button size="sm" onClick={onApprove} className="bg-primary hover:bg-primary/90">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>

          {showDetails && hasAdditionalInfo && (
            <div className="pt-3 border-t space-y-2">
              {enrollment.studentName && (
                <div className="flex items-start gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Certificate Name:</span>
                    <span className="ml-2">{enrollment.studentName}</span>
                  </div>
                </div>
              )}
              {enrollment.dikshaName && (
                <div className="flex items-start gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Diksha Name:</span>
                    <span className="ml-2">{enrollment.dikshaName}</span>
                  </div>
                </div>
              )}
              {enrollment.whatsappNumber && (
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">WhatsApp:</span>
                    <span className="ml-2">{enrollment.whatsappNumber}</span>
                  </div>
                </div>
              )}
              {enrollment.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-muted-foreground">Address:</span>
                    <span className="ml-2 whitespace-pre-wrap">{enrollment.address}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[90%] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update the student's information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pending-studentName">
                Certificate Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-pending-studentName"
                placeholder="Enter certificate name"
                value={editForm.studentName}
                onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pending-dikshaName">Diksha Name (Optional)</Label>
              <Input
                id="edit-pending-dikshaName"
                placeholder="Enter diksha name"
                value={editForm.dikshaName}
                onChange={(e) => setEditForm({ ...editForm, dikshaName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pending-whatsappNumber">
                WhatsApp Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-pending-whatsappNumber"
                placeholder="Enter WhatsApp number with country code"
                value={editForm.whatsappNumber}
                onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                type="tel"
                required
              />
              <p className="text-xs text-muted-foreground">
                Example: +1234567890
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pending-address">Address (Optional)</Label>
              <Textarea
                id="edit-pending-address"
                placeholder="Enter address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.studentName.trim() || !editForm.whatsappNumber.trim()}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TaskCard({ task, submissionCount }: { task: Task; submissionCount: number }) {
  const TaskIcon = getTaskTypeIcon(task.type);
  const taskColor = getTaskTypeColor(task.type);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
          >
            <TaskIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-medium break-words">{task.title}</p>
              <Badge variant="outline" className="flex-shrink-0">{task.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              <LinkifiedText text={task.description} />
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              {task.dueDate && (
                <span className="whitespace-nowrap">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {task.maxPoints > 0 && <span className="whitespace-nowrap">{task.maxPoints} points</span>}
              <span className="whitespace-nowrap">{submissionCount} submissions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
