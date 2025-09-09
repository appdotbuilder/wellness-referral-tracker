import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type DoctorWithOffice } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPendingReferrals(): Promise<DoctorWithOffice[]> {
  try {
    // Query pending referrals with office information joined
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
    .where(eq(doctorReferralsTable.approval_status, 'pending'))
    .orderBy(desc(doctorReferralsTable.created_at))
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pending referrals:', error);
    throw error;
  }
}