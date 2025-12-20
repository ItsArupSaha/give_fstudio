"use client";

import { useAuthUser } from "@/hooks/use-auth";
import { getUserRoleData } from "@/lib/user-roles";
import { useEffect, useState } from "react";

/**
 * Hook to check if the current authenticated user is a teacher
 * This also ensures the user's role is set in the users collection
 * if they're in the teachers collection, which is needed for Firestore rules
 * @returns Object with isTeacher boolean and loading state
 */
export function useTeacher() {
  const { user, initializing: authInitializing } = useAuthUser();
  const [isTeacher, setIsTeacher] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    async function checkTeacherRole() {
      if (!user) {
        setIsTeacher(false);
        setRoleLoading(false);
        return;
      }

      try {
        // Use getUserRoleData which checks both users collection and teachers collection
        // This also automatically sets the role in users collection if teacher is in teachers collection
        const role = await getUserRoleData(user.uid, user.email || null);
        const isTeacherUser = role === "teacher";
        setIsTeacher(isTeacherUser);
      } catch (error) {
        console.error("Error checking teacher role:", error);
        setIsTeacher(false);
      } finally {
        setRoleLoading(false);
      }
    }

    if (!authInitializing) {
      checkTeacherRole();
    }
  }, [user, authInitializing]);

  return {
    isTeacher,
    initializing: authInitializing || roleLoading,
    user,
  };
}
