/**
 * User Roles System
 * 
 * This module handles user roles (teacher/student) stored in Firestore.
 * Users are automatically assigned roles based on their actions:
 * - Teachers: Manually assigned in Firestore
 * - Students: Automatically assigned when they enroll in a course/batch
 */

import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

export type UserRole = "teacher" | "student" | null;

export interface UserRoleData {
  role: UserRole;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user role from Firestore
 * @param userId - The Firebase Auth user ID
 * @returns The user's role or null if not found
 */
export async function getUserRole(
  userId: string
): Promise<UserRole> {
  try {
    const userRoleRef = doc(db, "userRoles", userId);
    const userRoleSnap = await getDoc(userRoleRef);

    if (userRoleSnap.exists()) {
      const data = userRoleSnap.data();
      return (data.role as UserRole) || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Set user role in Firestore
 * @param userId - The Firebase Auth user ID
 * @param email - The user's email address
 * @param role - The role to assign (teacher or student)
 */
export async function setUserRole(
  userId: string,
  email: string,
  role: "teacher" | "student"
): Promise<void> {
  try {
    const userRoleRef = doc(db, "userRoles", userId);
    const now = new Date();

    await setDoc(
      userRoleRef,
      {
        role,
        email: email.toLowerCase().trim(),
        updatedAt: now,
        createdAt: (await getDoc(userRoleRef)).exists()
          ? (await getDoc(userRoleRef)).data()?.createdAt || now
          : now,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
}

/**
 * Initialize a teacher in Firestore
 * This should be run once to set up the first teacher
 * @param email - The teacher's email address
 */
export async function initializeTeacher(email: string): Promise<void> {
  try {
    // First, we need to find the user by email
    // Since we don't have the userId, we'll need to search by email
    // For now, we'll create a document with email as the key in a separate collection
    // Or we can use a query to find the user
    
    // Alternative: Store teacher emails in a separate collection
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    await setDoc(teacherRef, {
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      isActive: true,
    });
  } catch (error) {
    console.error("Error initializing teacher:", error);
    throw error;
  }
}

/**
 * Check if an email is a teacher
 * @param email - The email address to check
 * @returns true if the email is registered as a teacher
 */
export async function isTeacherEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  try {
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    const teacherSnap = await getDoc(teacherRef);
    return teacherSnap.exists() && teacherSnap.data()?.isActive === true;
  } catch (error) {
    console.error("Error checking teacher email:", error);
    return false;
  }
}

/**
 * Get user role data (for a specific user by userId)
 * This checks both the userRoles collection and teachers collection
 */
export async function getUserRoleData(
  userId: string,
  email: string | null | undefined
): Promise<UserRole> {
  // First check if user has a role in userRoles collection
  const role = await getUserRole(userId);
  if (role === "teacher") {
    return "teacher";
  }

  // If no role found, check if email is in teachers collection
  if (email) {
    const isTeacher = await isTeacherEmail(email);
    if (isTeacher) {
      // Update userRoles collection for consistency
      await setUserRole(userId, email, "teacher");
      return "teacher";
    }
  }

  // If user has student role, return it
  if (role === "student") {
    return "student";
  }

  return null;
}

/**
 * Automatically assign student role when user enrolls in a course/batch
 * This should be called when a user successfully enrolls
 * @param userId - The Firebase Auth user ID
 * @param email - The user's email address
 */
export async function assignStudentRole(
  userId: string,
  email: string
): Promise<void> {
  // Only assign student role if user is not already a teacher
  const currentRole = await getUserRole(userId);
  if (currentRole !== "teacher") {
    await setUserRole(userId, email, "student");
  }
}

/**
 * Add a teacher (only callable by existing teachers)
 * @param email - The email address to add as teacher
 */
export async function addTeacher(email: string): Promise<void> {
  try {
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    await setDoc(teacherRef, {
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      isActive: true,
    });
  } catch (error) {
    console.error("Error adding teacher:", error);
    throw error;
  }
}

/**
 * Remove a teacher (only callable by existing teachers)
 * @param email - The email address to remove from teachers
 */
export async function removeTeacher(email: string): Promise<void> {
  try {
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    await setDoc(teacherRef, {
      email: email.toLowerCase().trim(),
      isActive: false,
      deactivatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error("Error removing teacher:", error);
    throw error;
  }
}
