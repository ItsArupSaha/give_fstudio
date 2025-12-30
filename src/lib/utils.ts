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

/**
 * Check if the submission window is still open (due date + 2 hours grace period)
 * @param dueDate - The task due date
 * @returns true if submission window is still open, false otherwise
 */
export function isSubmissionWindowOpen(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return true; // No due date means always open
  
  const now = new Date();
  const dueDateTime = new Date(dueDate);
  const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const submissionDeadline = new Date(dueDateTime.getTime() + gracePeriodMs);
  
  return now <= submissionDeadline;
}

/**
 * Get the submission deadline (due date + 2 hours grace period)
 * @param dueDate - The task due date
 * @returns The submission deadline date, or null if no due date
 */
export function getSubmissionDeadline(dueDate: Date | null | undefined): Date | null {
  if (!dueDate) return null;
  
  const dueDateTime = new Date(dueDate);
  const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  return new Date(dueDateTime.getTime() + gracePeriodMs);
}

/**
 * Get remaining time until submission window closes (in minutes)
 * @param dueDate - The task due date
 * @returns Number of minutes remaining until submission window closes, or null if window is closed or no due date
 */
export function getSubmissionWindowRemainingMinutes(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;
  
  const deadline = getSubmissionDeadline(dueDate);
  if (!deadline) return null;
  
  const now = new Date();
  if (now > deadline) return null; // Window is closed
  
  const remainingMs = deadline.getTime() - now.getTime();
  return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object in Bangladesh timezone (UTC+6)
 * @param dateString - Date string in YYYY-MM-DD format
 * @param hour - Hour (0-23), default 0
 * @param minute - Minute (0-59), default 0
 * @param second - Second (0-59), default 0
 * @param millisecond - Millisecond (0-999), default 0
 * @returns Date object representing the specified date/time in Bangladesh timezone
 */
export function dateToBangladeshTime(
  dateString: string,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  millisecond: number = 0
): Date {
  // Bangladesh timezone is UTC+6
  // Create ISO string with Bangladesh timezone offset
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Format: YYYY-MM-DDTHH:mm:ss.sss+06:00
  const isoString = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}.${millisecond.toString().padStart(3, '0')}+06:00`;
  
  return new Date(isoString);
}

/**
 * Convert a Date object to a date string (YYYY-MM-DD) in Bangladesh timezone (UTC+6)
 * @param date - Date object to convert
 * @returns Date string in YYYY-MM-DD format representing the date in Bangladesh timezone
 */
export function dateFromBangladeshTime(date: Date): string {
  // Bangladesh timezone is UTC+6
  // Convert UTC time to Bangladesh time by adding 6 hours
  const bangladeshOffset = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const bangladeshTime = new Date(date.getTime() + bangladeshOffset);
  
  // Get the date components in Bangladesh timezone
  const year = bangladeshTime.getUTCFullYear();
  const month = bangladeshTime.getUTCMonth() + 1; // getUTCMonth() returns 0-11
  const day = bangladeshTime.getUTCDate();
  
  // Format as YYYY-MM-DD
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}