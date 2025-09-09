import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type DoctorWithOffice } from '../schema';
import { eq, or, ilike, and, sql } from 'drizzle-orm';

export async function searchDoctors(searchTerm: string): Promise<DoctorWithOffice[]> {
  try {
    // Perform full-text search across multiple fields
    // Only return approved referrals for public search
    const results = await db.select({
      id: doctorReferralsTable.id,
      office_id: doctorReferralsTable.office_id,
      office_name: officesTable.name,
      doctor_name: doctorReferralsTable.doctor_name,
      type: doctorReferralsTable.type,
      address: doctorReferralsTable.address,
      phone_number: doctorReferralsTable.phone_number,
      gender: doctorReferralsTable.gender,
      online_appointments: doctorReferralsTable.online_appointments,
      url: doctorReferralsTable.url,
      wait_time: doctorReferralsTable.wait_time,
      same_day_service: doctorReferralsTable.same_day_service,
      comments: doctorReferralsTable.comments,
      approval_status: doctorReferralsTable.approval_status,
      submitted_by: doctorReferralsTable.submitted_by,
      approved_by: doctorReferralsTable.approved_by,
      created_at: doctorReferralsTable.created_at,
      updated_at: doctorReferralsTable.updated_at
    })
    .from(doctorReferralsTable)
    .innerJoin(officesTable, eq(doctorReferralsTable.office_id, officesTable.id))
    .where(
      and(
        eq(doctorReferralsTable.approval_status, 'approved'),
        or(
          ilike(doctorReferralsTable.doctor_name, `%${searchTerm}%`),
          ilike(officesTable.name, `%${searchTerm}%`),
          ilike(doctorReferralsTable.comments, `%${searchTerm}%`),
          ilike(doctorReferralsTable.address, `%${searchTerm}%`),
          sql`${doctorReferralsTable.type}::text ILIKE ${`%${searchTerm}%`}`
        )
      )
    )
    .execute();

    return results;
  } catch (error) {
    console.error('Doctor search failed:', error);
    throw error;
  }
}