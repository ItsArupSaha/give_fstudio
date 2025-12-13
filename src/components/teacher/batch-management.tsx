"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import {
  createBatch,
  deleteBatch,
  generateBatchCode,
  getCourseGroups,
  subscribeBatchesByCourseGroup,
  updateBatch
} from "@/lib/services/firestore";
import { Check, Copy, Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function BatchManagement() {
  const { user } = useAuthUser();
  const router = useRouter();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    loadCourseGroups();
  }, [user]);

  useEffect(() => {
    if (selectedCourseGroupId) {
      loadBatches(selectedCourseGroupId);
    } else {
      setBatches([]);
    }
  }, [selectedCourseGroupId]);

  const loadCourseGroups = async () => {
    if (!user?.uid) return;
    try {
      const groups = await getCourseGroups(user.uid);
      setCourseGroups(groups);
      if (groups.length > 0 && !selectedCourseGroupId) {
        setSelectedCourseGroupId(groups[0].id);
      }
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course groups",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadBatches = (courseGroupId: string) => {
    const unsubscribe = subscribeBatchesByCourseGroup(courseGroupId, (batches) => {
      setBatches(batches);
    });
    return unsubscribe;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !selectedCourseGroupId) return;

    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        await updateBatch(editingId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        });
        toast({
          title: "Success",
          description: "Batch updated successfully",
        });
      } else {
        const batchCode = generateBatchCode();
        await createBatch({
          name: formData.name.trim(),
          description: formData.description.trim(),
          courseGroupId: selectedCourseGroupId,
          teacherId: user.uid,
          classCode: batchCode,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          studentCount: 0,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        });
        toast({
          title: "Success",
          description: `Batch created! Class code: ${batchCode}`,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save batch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setFormData({
      name: batch.name,
      description: batch.description,
      startDate: batch.startDate
        ? new Date(batch.startDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(true);
    setEditingId(batch.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, courseGroupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this batch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteBatch(id, courseGroupId);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", startDate: "" });
    setIsEditing(false);
    setEditingId(null);
  };

  const selectedCourseGroup = courseGroups.find(
    (cg) => cg.id === selectedCourseGroupId
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Batch Management
            </CardTitle>
            <CardDescription>
              Create and manage batches for your course groups
            </CardDescription>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!selectedCourseGroupId || courseGroups.length === 0} className="w-full sm:w-auto border border-orange-500">
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Batch" : "Create Batch"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the batch details"
                      : "Create a new batch for students to join"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {selectedCourseGroup && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Course Group</p>
                      <p className="font-medium">{selectedCourseGroup.name}</p>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="batch-name">Batch Name *</Label>
                    <Input
                      id="batch-name"
                      placeholder="e.g., Batch 1 - Morning"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="batch-description">Description *</Label>
                    <Textarea
                      id="batch-description"
                      placeholder="Describe the batch, schedule, and any special instructions..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="border border-orange-500"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="border border-orange-500">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditing ? "Updating..." : "Creating..."}
                      </>
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {courseGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Create a course group first to manage batches.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label htmlFor="course-group-select">Filter by Course Group</Label>
              <Select
                value={selectedCourseGroupId || ""}
                onValueChange={setSelectedCourseGroupId}
              >
                <SelectTrigger id="course-group-select" className="mt-2 border border-orange-500">
                  <SelectValue placeholder="Select a course group" />
                </SelectTrigger>
                <SelectContent>
                  {courseGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No batches yet. Create your first batch to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {batches.map((batch) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg">{batch.name}</CardTitle>
                          {batch.description && (
                            <CardDescription className="mt-1">
                              <ExpandableDescription text={batch.description} maxLines={2} />
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1 self-start sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(batch)}
                            className="border border-orange-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(batch.id, batch.courseGroupId)}
                            className="text-destructive hover:text-destructive border border-orange-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-muted rounded">
                          <span className="text-sm font-medium">Class Code:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono break-all">{batch.classCode}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleCopyCode(batch.classCode)}
                            >
                              {copiedCode === batch.classCode ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span>{batch.studentCount} students</span>
                          {batch.startDate && (
                            <span>
                              Starts {new Date(batch.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border border-orange-500"
                          onClick={() => router.push(`/teacher/batches/${batch.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
