import { z } from 'zod';

// Enum definitions
export const doctorTypeSchema = z.enum([
  'general_practitioner',
  'dentist',
  'obgyn',
  'cardiologist',
  'dermatologist',
  'psychiatrist',
  'neurologist',
  'orthopedist',
  'pediatrician',
  'ophthalmologist',
  'other'
]);

export const genderSchema = z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']);

export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const waitTimeSchema = z.enum([
  'same_day',
  'within_week',
  'within_month',
  'over_month',
  'unknown'
]);

export type DoctorType = z.infer<typeof doctorTypeSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type WaitTime = z.infer<typeof waitTimeSchema>;

// Office schema
export const officeSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Office = z.infer<typeof officeSchema>;

// Doctor referral schema
export const doctorReferralSchema = z.object({
  id: z.number(),
  office_id: z.number(),
  doctor_name: z.string(),
  type: doctorTypeSchema,
  address: z.string().nullable(),
  phone_number: z.string().nullable(),
  gender: genderSchema,
  online_appointments: z.boolean(),
  url: z.string().nullable(),
  wait_time: waitTimeSchema,
  same_day_service: z.boolean(),
  comments: z.string().nullable(),
  approval_status: approvalStatusSchema,
  submitted_by: z.string().nullable(), // User identifier
  approved_by: z.string().nullable(), // Admin identifier
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DoctorReferral = z.infer<typeof doctorReferralSchema>;

// Input schema for creating office
export const createOfficeInputSchema = z.object({
  name: z.string().min(1, 'Office name is required')
});

export type CreateOfficeInput = z.infer<typeof createOfficeInputSchema>;

// Input schema for submitting doctor referral
export const submitDoctorReferralInputSchema = z.object({
  office_id: z.number(),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  type: doctorTypeSchema,
  address: z.string().nullable(),
  phone_number: z.string().nullable(),
  gender: genderSchema,
  online_appointments: z.boolean(),
  url: z.string().url().nullable().or(z.literal('')), // Allow empty string for URL
  wait_time: waitTimeSchema,
  same_day_service: z.boolean(),
  comments: z.string().nullable(),
  submitted_by: z.string().nullable()
}).transform((data) => ({
  ...data,
  url: data.url === '' ? null : data.url // Transform empty string to null
}));

export type SubmitDoctorReferralInput = z.infer<typeof submitDoctorReferralInputSchema>;

// Input schema for approving/rejecting referral
export const reviewReferralInputSchema = z.object({
  id: z.number(),
  approval_status: z.enum(['approved', 'rejected']),
  approved_by: z.string()
});

export type ReviewReferralInput = z.infer<typeof reviewReferralInputSchema>;

// Input schema for filtering doctors
export const filterDoctorsInputSchema = z.object({
  office_id: z.number().optional(),
  doctor_name: z.string().optional(),
  type: doctorTypeSchema.optional(),
  gender: genderSchema.optional(),
  online_appointments: z.boolean().optional(),
  wait_time: waitTimeSchema.optional(),
  same_day_service: z.boolean().optional(),
  search: z.string().optional() // General search term
});

export type FilterDoctorsInput = z.infer<typeof filterDoctorsInputSchema>;

// Output schema for doctor with office details
export const doctorWithOfficeSchema = z.object({
  id: z.number(),
  office_id: z.number(),
  office_name: z.string(),
  doctor_name: z.string(),
  type: doctorTypeSchema,
  address: z.string().nullable(),
  phone_number: z.string().nullable(),
  gender: genderSchema,
  online_appointments: z.boolean(),
  url: z.string().nullable(),
  wait_time: waitTimeSchema,
  same_day_service: z.boolean(),
  comments: z.string().nullable(),
  approval_status: approvalStatusSchema,
  submitted_by: z.string().nullable(),
  approved_by: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DoctorWithOffice = z.infer<typeof doctorWithOfficeSchema>;