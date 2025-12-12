import { Timestamp } from "firebase/firestore";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestimonialFirestore {
  name: string;
  role: string;
  quote: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function testimonialFromFirestore(
  id: string,
  data: TestimonialFirestore
): Testimonial {
  return {
    id,
    name: data.name ?? "",
    role: data.role ?? "",
    quote: data.quote ?? "",
    avatarUrl: data.avatarUrl,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export function testimonialToFirestore(
  testimonial: Testimonial
): TestimonialFirestore {
  const data: TestimonialFirestore = {
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote,
    createdAt: Timestamp.fromDate(testimonial.createdAt),
    updatedAt: Timestamp.fromDate(testimonial.updatedAt),
  };
  
  if (testimonial.avatarUrl !== undefined) {
    data.avatarUrl = testimonial.avatarUrl;
  }
  
  return data;
}

