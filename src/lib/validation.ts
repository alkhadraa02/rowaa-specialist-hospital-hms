import { z } from "zod";

const phoneRe = /^(\+9665\d{8}|05\d{8})$/;
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(phoneRe, "invalid_phone"));

export const nationalIdSchema = z.string().regex(/^[12]\d{9}$/, "invalid_national_id");

export const emailSchema = z.string().trim().toLowerCase().email().max(120);

export const bookingSchema = z.object({
  doctorId: z.string().min(1),
  branchId: z.string().min(1),
  start: z.string().datetime({ offset: true }),
  name: z.string().trim().min(3).max(80),
  phone: phoneSchema,
  nationalId: z.union([nationalIdSchema, z.literal("")]).optional(),
  notes: z.string().trim().max(400).optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]).optional(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().trim().min(3).max(80),
  email: emailSchema,
  phone: phoneSchema,
  cover: z.string().trim().max(2000).optional(),
});

export const patientSchema = z.object({
  nameAr: z.string().trim().min(3).max(80),
  nameEn: z.string().trim().min(3).max(80),
  nationalId: nationalIdSchema,
  gender: z.enum(["M", "F"]),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: phoneSchema,
  email: z.union([emailSchema, z.literal("")]).optional(),
  insurer: z.string().trim().max(80).optional(),
  policyNo: z.string().trim().max(40).optional(),
  bloodType: z.enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.string().trim().max(200).optional(),
});

const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number().min(min).max(max).optional());

export const vitalsSchema = z.object({
  hr: optInt(0, 300),
  sbp: optInt(0, 300),
  dbp: optInt(0, 200),
  rr: optInt(0, 80),
  spo2: optInt(0, 100),
  temp: optInt(30, 45),
  gcs: optInt(3, 15),
  pain: optInt(0, 10),
  weight: optInt(0, 400),
});

export const triageRequestSchema = z.object({
  complaint: z.string().trim().min(2).max(300),
  ageYears: z.coerce.number().min(0).max(120),
  vitals: z
    .object({
      hr: z.number().min(0).max(300).nullish(),
      sbp: z.number().min(0).max(300).nullish(),
      dbp: z.number().min(0).max(200).nullish(),
      rr: z.number().min(0).max(80).nullish(),
      spo2: z.number().min(0).max(100).nullish(),
      temp: z.number().min(30).max(45).nullish(),
      gcs: z.number().min(3).max(15).nullish(),
      pain: z.number().min(0).max(10).nullish(),
    })
    .default({}),
  lang: z.enum(["ar", "en"]).default("ar"),
});

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });

export const opsQuestionSchema = z.object({ question: z.string().trim().min(2).max(300), lang: z.enum(["ar", "en"]).default("ar") });
