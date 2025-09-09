import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { officesTable, doctorReferralsTable } from '../db/schema';
import { type ReviewReferralInput } from '../schema';
import { reviewReferral } from '../handlers/review_referral';
import { eq } from 'drizzle-orm';

describe('reviewReferral', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should approve a pending referral', async () => {
    // Create test office first
    const officeResult = await db.insert(officesTable)
      .values({
        name: 'Test Medical Office'
      })
      .returning()
      .execute();

    // Create a pending referral
    const referralResult = await db.insert(doctorReferralsTable)
      .values({
        office_id: officeResult[0].id,
        doctor_name: 'Dr. Smith',
        type: 'general_practitioner',
        gender: 'female',
        online_appointments: true,
        wait_time: 'within_week',
        same_day_service: false,
        approval_status: 'pending',
        submitted_by: 'user123'
      })
      .returning()
      .execute();

    const reviewInput: ReviewReferralInput = {
      id: referralResult[0].id,
      approval_status: 'approved',
      approved_by: 'admin456'
    };

    const result = await reviewReferral(reviewInput);

    // Verify the response
    expect(result.id).toEqual(referralResult[0].id);
    expect(result.approval_status).toEqual('approved');
    expect(result.approved_by).toEqual('admin456');
    expect(result.doctor_name).toEqual('Dr. Smith');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should reject a pending referral', async () => {
    // Create test office first
    const officeResult = await db.insert(officesTable)
      .values({
        name: 'Test Medical Office'
      })
      .returning()
      .execute();

    // Create a pending referral
    const referralResult = await db.insert(doctorReferralsTable)
      .values({
        office_id: officeResult[0].id,
        doctor_name: 'Dr. Johnson',
        type: 'cardiologist',
        gender: 'male',
        online_appointments: false,
        wait_time: 'over_month',
        same_day_service: true,
        approval_status: 'pending',
        submitted_by: 'user789'
      })
      .returning()
      .execute();

    const reviewInput: ReviewReferralInput = {
      id: referralResult[0].id,
      approval_status: 'rejected',
      approved_by: 'admin123'
    };

    const result = await reviewReferral(reviewInput);

    // Verify the response
    expect(result.approval_status).toEqual('rejected');
    expect(result.approved_by).toEqual('admin123');
    expect(result.doctor_name).toEqual('Dr. Johnson');
  });

  it('should update the referral in database', async () => {
    // Create test office first
    const officeResult = await db.insert(officesTable)
      .values({
        name: 'Test Medical Office'
      })
      .returning()
      .execute();

    // Create a pending referral
    const referralResult = await db.insert(doctorReferralsTable)
      .values({
        office_id: officeResult[0].id,
        doctor_name: 'Dr. Wilson',
        type: 'psychiatrist',
        gender: 'non_binary',
        online_appointments: true,
        wait_time: 'same_day',
        same_day_service: true,
        approval_status: 'pending',
        submitted_by: 'user456'
      })
      .returning()
      .execute();

    const reviewInput: ReviewReferralInput = {
      id: referralResult[0].id,
      approval_status: 'approved',
      approved_by: 'admin789'
    };

    await reviewReferral(reviewInput);

    // Query database to verify the update
    const updated = await db.select()
      .from(doctorReferralsTable)
      .where(eq(doctorReferralsTable.id, referralResult[0].id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].approval_status).toEqual('approved');
    expect(updated[0].approved_by).toEqual('admin789');
    expect(updated[0].doctor_name).toEqual('Dr. Wilson');
    expect(updated[0].updated_at).toBeInstanceOf(Date);
    // Verify the updated_at timestamp was actually updated
    expect(updated[0].updated_at > referralResult[0].created_at).toBe(true);
  });

  it('should throw error for non-existent referral', async () => {
    const reviewInput: ReviewReferralInput = {
      id: 99999,
      approval_status: 'approved',
      approved_by: 'admin123'
    };

    await expect(reviewReferral(reviewInput)).rejects.toThrow(/referral with id 99999 not found/i);
  });

  it('should handle review of already reviewed referral', async () => {
    // Create test office first
    const officeResult = await db.insert(officesTable)
      .values({
        name: 'Test Medical Office'
      })
      .returning()
      .execute();

    // Create an already approved referral
    const referralResult = await db.insert(doctorReferralsTable)
      .values({
        office_id: officeResult[0].id,
        doctor_name: 'Dr. Brown',
        type: 'dermatologist',
        gender: 'female',
        online_appointments: false,
        wait_time: 'within_month',
        same_day_service: false,
        approval_status: 'approved',
        submitted_by: 'user111',
        approved_by: 'admin222'
      })
      .returning()
      .execute();

    // Try to reject the already approved referral
    const reviewInput: ReviewReferralInput = {
      id: referralResult[0].id,
      approval_status: 'rejected',
      approved_by: 'admin333'
    };

    const result = await reviewReferral(reviewInput);

    // Should successfully change status and reviewer
    expect(result.approval_status).toEqual('rejected');
    expect(result.approved_by).toEqual('admin333');
    expect(result.doctor_name).toEqual('Dr. Brown');
  });
});