"use client";

import { TeacherManagement } from "@/components/teacher/teacher-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeacher } from "@/hooks/use-teacher";
import { BookOpen, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherDashboardPage() {
  const { isTeacher, initializing, user } = useTeacher();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not a teacher (after auth state is determined)
    if (!initializing && (!user || !isTeacher)) {
      router.push("/");
    }
  }, [isTeacher, initializing, user, router]);

  // Show loading state while checking auth
  if (initializing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (or show access denied message)
  if (!user || !isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access this page.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Manage courses, batches, and students from here
        </p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pending reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Courses</CardTitle>
            <CardDescription>Create and manage courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Manage Courses
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Batches</CardTitle>
            <CardDescription>Create and manage batches</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Manage Batches
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Student Management</CardTitle>
            <CardDescription>View and manage students</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              View Students
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Management */}
      <div className="mb-8">
        <TeacherManagement />
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to display
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
