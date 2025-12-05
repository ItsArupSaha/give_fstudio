import { Timestamp } from "firebase/firestore";

export type EnrollmentStatus =
  | "pending"
  | "active"
  | "completed"
  | "dropped"
  | "declined";

export interface Enrollment {
  id: string;
  studentId: string;
  batchId: string;
  courseGroupId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  droppedAt?: Date;
  classCode?: string;
  notes?: string;
}

export interface EnrollmentFirestore {
  studentId: string;
  batchId: string;
  courseGroupId: string;
  status: string;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  droppedAt?: Timestamp;
  classCode?: string;
  notes?: string;
}

export function enrollmentFromFirestore(
  id: string,
  data: EnrollmentFirestore
): Enrollment {
  return {
    id,
    studentId: data.studentId ?? "",
    batchId: data.batchId ?? "",
    courseGroupId: data.courseGroupId ?? "",
    status: (data.status as EnrollmentStatus) || "pending",
    enrolledAt: data.enrolledAt?.toDate() ?? new Date(),
    completedAt: data.completedAt?.toDate(),
    droppedAt: data.droppedAt?.toDate(),
    classCode: data.classCode,
    notes: data.notes,
  };
}

export function enrollmentToFirestore(
  enrollment: Enrollment
): EnrollmentFirestore {
  const data: EnrollmentFirestore = {
    studentId: enrollment.studentId,
    batchId: enrollment.batchId,
    courseGroupId: enrollment.courseGroupId,
    status: enrollment.status,
    enrolledAt: Timestamp.fromDate(enrollment.enrolledAt),
  };
  
  // Only include optional fields if they're defined
  if (enrollment.completedAt !== undefined) {
    data.completedAt = Timestamp.fromDate(enrollment.completedAt);
  }
  if (enrollment.droppedAt !== undefined) {
    data.droppedAt = Timestamp.fromDate(enrollment.droppedAt);
  }
  if (enrollment.classCode !== undefined) {
    data.classCode = enrollment.classCode;
  }
  if (enrollment.notes !== undefined) {
    data.notes = enrollment.notes;
  }
  
  return data;
}
