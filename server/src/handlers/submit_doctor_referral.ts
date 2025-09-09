import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type SubmitDoctorReferralInput, type DoctorReferral } from '../schema';
import { eq } from 'drizzle-orm';

export async function submitDoctorReferral(input: SubmitDoctorReferralInput): Promise<DoctorReferral> {
  try {
    // Verify that the office exists before creating the referral
    const office = await db.select()
      .from(officesTable)
      .where(eq(officesTable.id, input.office_id))
      .execute();

    if (office.length === 0) {
      throw new Error(`Office with id ${input.office_id} does not exist`);
    }

    // Insert the doctor referral with pending approval status
    const result = await db.insert(doctorReferralsTable)
      .values({
        office_id: input.office_id,
        doctor_name: input.doctor_name,
        type: input.type,
        address: input.address,
        phone_number: input.phone_number,
        gender: input.gender,
        online_appointments: input.online_appointments,
        url: input.url === '' ? null : input.url, // Handle empty string conversion to null
        wait_time: input.wait_time,
        same_day_service: input.same_day_service,
        comments: input.comments,
        approval_status: 'pending', // Default to pending approval
        submitted_by: input.submitted_by,
        approved_by: null // Not yet approved
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Doctor referral submission failed:', error);
    throw error;
  }
}