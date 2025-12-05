"use client";

import { useAuthUser } from "@/hooks/use-auth";
import { isTeacherEmail } from "@/lib/user-roles";
import { useEffect, useState } from "react";

/**
 * Hook to check if the current authenticated user is a teacher
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
        // Check if user is a teacher
        const isTeacherUser = await isTeacherEmail(user.email || null);
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
