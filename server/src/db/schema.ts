import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  boolean,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions for PostgreSQL
export const doctorTypeEnum = pgEnum('doctor_type', [
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

export const genderEnum = pgEnum('gender', [
  'male',
  'female', 
  'non_binary',
  'prefer_not_to_say'
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected'
]);

export const waitTimeEnum = pgEnum('wait_time', [
  'same_day',
  'within_week',
  'within_month', 
  'over_month',
  'unknown'
]);

// Offices table - predefined list of medical offices
export const officesTable = pgTable('offices', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Doctor referrals table - user-submitted referrals with approval workflow
export const doctorReferralsTable = pgTable('doctor_referrals', {
  id: serial('id').primaryKey(),
  office_id: integer('office_id').notNull().references(() => officesTable.id),
  doctor_name: text('doctor_name').notNull(),
  type: doctorTypeEnum('type').notNull(),
  address: text('address'), // Nullable for map feature
  phone_number: text('phone_number'), // Nullable
  gender: genderEnum('gender').notNull(),
  online_appointments: boolean('online_appointments').notNull().default(false),
  url: text('url'), // Nullable website URL
  wait_time: waitTimeEnum('wait_time').notNull(),
  same_day_service: boolean('same_day_service').notNull().default(false),
  comments: text('comments'), // Nullable general comments
  approval_status: approvalStatusEnum('approval_status').notNull().default('pending'),
  submitted_by: text('submitted_by'), // Nullable user identifier
  approved_by: text('approved_by'), // Nullable admin identifier
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const officesRelations = relations(officesTable, ({ many }) => ({
  doctorReferrals: many(doctorReferralsTable)
}));

export const doctorReferralsRelations = relations(doctorReferralsTable, ({ one }) => ({
  office: one(officesTable, {
    fields: [doctorReferralsTable.office_id],
    references: [officesTable.id]
  })
}));

// TypeScript types for the table schemas
export type Office = typeof officesTable.$inferSelect;
export type NewOffice = typeof officesTable.$inferInsert;
export type DoctorReferral = typeof doctorReferralsTable.$inferSelect;
export type NewDoctorReferral = typeof doctorReferralsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  offices: officesTable, 
  doctorReferrals: doctorReferralsTable 
};

export const tableRelations = {
  officesRelations,
  doctorReferralsRelations
};