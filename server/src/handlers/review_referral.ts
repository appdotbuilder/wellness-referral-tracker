import { db } from '../db';
import { doctorReferralsTable } from '../db/schema';
import { type ReviewReferralInput, type DoctorReferral } from '../schema';
import { eq } from 'drizzle-orm';

export const reviewReferral = async (input: ReviewReferralInput): Promise<DoctorReferral> => {
  try {
    // First verify the referral exists
    const existing = await db.select()
      .from(doctorReferralsTable)
      .where(eq(doctorReferralsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Referral with id ${input.id} not found`);
    }

    // Update the referral with approval status and reviewer info
    const result = await db.update(doctorReferralsTable)
      .set({
        approval_status: input.approval_status,
        approved_by: input.approved_by,
        updated_at: new Date()
      })
      .where(eq(doctorReferralsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Referral review failed:', error);
    throw error;
  }
};