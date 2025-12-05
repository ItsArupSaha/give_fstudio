"use client";

import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/use-auth";
import { BookOpen, Plus } from "lucide-react";

export default function ClassroomPage() {
  const { user, initializing } = useAuthUser();

  // For now, we'll always show empty state since enrollment isn't implemented yet
  // Later, we'll check if user has enrolled batches
  const hasEnrollments = false;

  if (initializing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold mb-4">Classroom</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access your classroom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Classroom</h1>
        <p className="text-muted-foreground">
          Manage your courses and batches here
        </p>
      </div>

      {hasEnrollments ? (
        <div className="space-y-6">
          {/* This section will show enrolled batches/courses when implemented */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder for enrolled courses - will be populated later */}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="mb-6">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              No courses enrolled yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              You haven't enrolled in any courses or batches. Join a class using
              a class code to get started.
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Join Class
          </Button>
        </div>
      )}

      {/* Enroll button - always visible for now, will be moved to dialog/modal later */}
      {hasEnrollments && (
        <div className="mt-8 flex justify-end">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Join Class
          </Button>
        </div>
      )}
    </div>
  );
}
