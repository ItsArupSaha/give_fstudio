import type { Submission } from "@/lib/models/submission";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a submission is within the 15-minute grace period for deletion/resubmission
 * @param submission - The submission to check
 * @returns true if submission is within 15 minutes of submission time, false otherwise
 */
export function isWithinGracePeriod(submission: Submission | null): boolean {
  if (!submission || !submission.submittedAt) {
    return false;
  }
  
  // Only allow grace period for "submitted" status, not "graded"
  if (submission.status !== "submitted") {
    return false;
  }
  
  const submittedAt = submission.submittedAt.getTime();
  const now = new Date().getTime();
  const gracePeriodMs = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  return (now - submittedAt) <= gracePeriodMs;
}

/**
 * Get the remaining time in the grace period in minutes
 * @param submission - The submission to check
 * @returns Number of minutes remaining, or 0 if grace period has expired
 */
export function getGracePeriodRemainingMinutes(submission: Submission | null): number {
  if (!isWithinGracePeriod(submission) || !submission?.submittedAt) {
    return 0;
  }
  
  const submittedAt = submission.submittedAt.getTime();
  const now = new Date().getTime();
  const gracePeriodMs = 15 * 60 * 1000; // 15 minutes in milliseconds
  const elapsed = now - submittedAt;
  const remaining = gracePeriodMs - elapsed;
  
  return Math.ceil(remaining / (60 * 1000)); // Convert to minutes
}
