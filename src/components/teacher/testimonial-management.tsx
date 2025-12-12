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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Testimonial } from "@/lib/models/testimonial";
import {
    createTestimonial,
    deleteTestimonial,
    subscribeTestimonials,
    updateTestimonial
} from "@/lib/services/firestore";
import { Edit, Loader2, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

export function TestimonialManagement() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        role: "",
        quote: "",
        avatarUrl: "",
    });

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = subscribeTestimonials((testimonialsList) => {
            setTestimonials(testimonialsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.role.trim() || !formData.quote.trim()) {
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
                await updateTestimonial(editingId, {
                    name: formData.name.trim(),
                    role: formData.role.trim(),
                    quote: formData.quote.trim(),
                    avatarUrl: formData.avatarUrl.trim() || undefined,
                });
                toast({
                    title: "Success",
                    description: "Testimonial updated successfully",
                });
            } else {
                await createTestimonial({
                    name: formData.name.trim(),
                    role: formData.role.trim(),
                    quote: formData.quote.trim(),
                    avatarUrl: formData.avatarUrl.trim() || undefined,
                });
                toast({
                    title: "Success",
                    description: "Testimonial created successfully",
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save testimonial",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (testimonial: Testimonial) => {
        setFormData({
            name: testimonial.name,
            role: testimonial.role,
            quote: testimonial.quote,
            avatarUrl: testimonial.avatarUrl || "",
        });
        setEditingId(testimonial.id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) {
            return;
        }

        try {
            await deleteTestimonial(id);
            toast({
                title: "Success",
                description: "Testimonial deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete testimonial",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            role: "",
            quote: "",
            avatarUrl: "",
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            resetForm();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Testimonials</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage testimonials displayed on the homepage
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Testimonial
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
                                <DialogDescription>
                                    {isEditing
                                        ? "Update the testimonial details below."
                                        : "Add a new testimonial to display on the homepage."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter person's name..."
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Input
                                        id="role"
                                        placeholder="e.g., Bhagavad-gītā Student, Bhakti Sastri Graduate..."
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData({ ...formData, role: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quote">Quote *</Label>
                                    <Textarea
                                        id="quote"
                                        placeholder="Enter the testimonial quote..."
                                        value={formData.quote}
                                        onChange={(e) =>
                                            setFormData({ ...formData, quote: e.target.value })
                                        }
                                        required
                                        rows={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                                    <Input
                                        id="avatarUrl"
                                        placeholder="Enter avatar image URL..."
                                        value={formData.avatarUrl}
                                        onChange={(e) =>
                                            setFormData({ ...formData, avatarUrl: e.target.value })
                                        }
                                        type="url"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleDialogOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    {isEditing ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {testimonials.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No testimonials added yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.id}>
                            <CardHeader>
                                <CardTitle className="text-base">{testimonial.name}</CardTitle>
                                <CardDescription>{testimonial.role}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(testimonial)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(testimonial.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

