import { z } from "zod";

export const SERVICE_SLUGS = [
  "express-wash",
  "full-detail",
  "paint-correction",
  "ceramic-coating",
  "interior-restoration",
] as const;

export const TIME_WINDOWS = [
  "morning",
  "afternoon",
  "evening",
] as const;

export const TIME_WINDOW_LABELS: Record<(typeof TIME_WINDOWS)[number], string> = {
  morning: "Morning (8–11am)",
  afternoon: "Afternoon (11am–3pm)",
  evening: "Evening (3–6pm)",
};

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const bookingSchema = z.object({
  service: z.enum(SERVICE_SLUGS, { message: "Select a service" }),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(2030, "Year must be 2030 or earlier"),
  make: z.string().trim().min(1, "Make is required").max(40),
  model: z.string().trim().min(1, "Model is required").max(40),
  color: z.string().trim().min(1, "Color is required").max(30),

  address: z.string().trim().min(5, "Address is required").max(120),
  city: z.string().trim().min(1, "City is required").max(60),
  zip: z.string().trim().regex(/^\d{5}$/, "Use a 5-digit ZIP"),
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid date")
    .refine((s) => new Date(s) >= todayStart(), "Date must be today or later"),
  timeWindow: z.enum(TIME_WINDOWS, { message: "Pick a time window" }),

  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Use a valid email").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(20)
    .regex(/^[+()\-.\s\d]+$/, "Use digits, spaces, and -.() only"),
  notes: z.string().trim().max(1000).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export function validateFiles(files: File[]):
  | { ok: true }
  | { ok: false; message: string } {
  if (files.length > MAX_PHOTOS) {
    return { ok: false, message: `Up to ${MAX_PHOTOS} photos only.` };
  }
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      return { ok: false, message: `"${f.name}" isn't an image.` };
    }
    if (f.size > MAX_PHOTO_BYTES) {
      return { ok: false, message: `"${f.name}" is over ${MAX_PHOTO_BYTES / 1024 / 1024}MB.` };
    }
  }
  return { ok: true };
}
