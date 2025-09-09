import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { officesTable, doctorReferralsTable } from '../db/schema';
import { getPendingReferrals } from '../handlers/get_pending_referrals';

describe('getPendingReferrals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pending referrals exist', async () => {
    const result = await getPendingReferrals();
    expect(result).toEqual([]);
  });

  it('should return only pending referrals with office information', async () => {
    // Create test office
    const [office] = await db.insert(officesTable)
      .values({
        name: 'Test Medical Center'
      })
      .returning()
      .execute();

    // Create referrals with different approval statuses
    await db.insert(doctorReferralsTable)
      .values([
        {
          office_id: office.id,
          doctor_name: 'Dr. Pending One',
          type: 'general_practitioner',
          address: '123 Main St',
          phone_number: '555-0101',
          gender: 'female',
          online_appointments: true,
          url: 'https://example.com/dr-pending-one',
          wait_time: 'within_week',
          same_day_service: false,
          comments: 'Great doctor for general care',
          approval_status: 'pending',
          submitted_by: 'user123'
        },
        {
          office_id: office.id,
          doctor_name: 'Dr. Already Approved',
          type: 'cardiologist',
          gender: 'male',
          online_appointments: false,
          wait_time: 'within_month',
          same_day_service: true,
          approval_status: 'approved',
          approved_by: 'admin456',
          submitted_by: 'user456'
        },
        {
          office_id: office.id,
          doctor_name: 'Dr. Rejected',
          type: 'dentist',
          gender: 'non_binary',
          online_appointments: true,
          wait_time: 'same_day',
          same_day_service: true,
          approval_status: 'rejected',
          approved_by: 'admin789',
          submitted_by: 'user789'
        },
        {
          office_id: office.id,
          doctor_name: 'Dr. Pending Two',
          type: 'dermatologist',
          gender: 'prefer_not_to_say',
          online_appointments: false,
          wait_time: 'over_month',
          same_day_service: false,
          approval_status: 'pending',
          submitted_by: 'user234'
        }
      ])
      .execute();

    const result = await getPendingReferrals();

    // Should return only the 2 pending referrals
    expect(result).toHaveLength(2);
    
    // Verify all returned referrals have pending status
    result.forEach(referral => {
      expect(referral.approval_status).toEqual('pending');
    });

    // Verify office information is included
    expect(result[0].office_name).toEqual('Test Medical Center');
    expect(result[1].office_name).toEqual('Test Medical Center');

    // Verify specific pending referrals are included
    const doctorNames = result.map(r => r.doctor_name);
    expect(doctorNames).toContain('Dr. Pending One');
    expect(doctorNames).toContain('Dr. Pending Two');
    expect(doctorNames).not.toContain('Dr. Already Approved');
    expect(doctorNames).not.toContain('Dr. Rejected');
  });

  it('should return referrals ordered by created_at descending', async () => {
    // Create test office
    const [office] = await db.insert(officesTable)
      .values({
        name: 'Test Clinic'
      })
      .returning()
      .execute();

    // Create referrals with slight delays to ensure different timestamps
    const [firstReferral] = await db.insert(doctorReferralsTable)
      .values({
        office_id: office.id,
        doctor_name: 'Dr. First',
        type: 'general_practitioner',
        gender: 'male',
        online_appointments: false,
        wait_time: 'within_week',
        same_day_service: false,
        approval_status: 'pending',
        submitted_by: 'user1'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const [secondReferral] = await db.insert(doctorReferralsTable)
      .values({
        office_id: office.id,
        doctor_name: 'Dr. Second',
        type: 'dentist',
        gender: 'female',
        online_appointments: true,
        wait_time: 'same_day',
        same_day_service: true,
        approval_status: 'pending',
        submitted_by: 'user2'
      })
      .returning()
      .execute();

    const result = await getPendingReferrals();

    expect(result).toHaveLength(2);
    // Most recent should be first (descending order)
    expect(result[0].doctor_name).toEqual('Dr. Second');
    expect(result[1].doctor_name).toEqual('Dr. First');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should include all required fields in the response', async () => {
    // Create test office
    const [office] = await db.insert(officesTable)
      .values({
        name: 'Complete Medical Center'
      })
      .returning()
      .execute();

    // Create a referral with all fields populated
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office.id,
        doctor_name: 'Dr. Complete',
        type: 'psychiatrist',
        address: '456 Oak Avenue',
        phone_number: '555-0202',
        gender: 'female',
        online_appointments: true,
        url: 'https://dromplete.example.com',
        wait_time: 'within_month',
        same_day_service: true,
        comments: 'Excellent psychiatrist with evening hours',
        approval_status: 'pending',
        submitted_by: 'user999'
      })
      .execute();

    const result = await getPendingReferrals();

    expect(result).toHaveLength(1);
    const referral = result[0];

    // Verify all expected fields are present
    expect(referral.id).toBeDefined();
    expect(referral.office_id).toEqual(office.id);
    expect(referral.office_name).toEqual('Complete Medical Center');
    expect(referral.doctor_name).toEqual('Dr. Complete');
    expect(referral.type).toEqual('psychiatrist');
    expect(referral.address).toEqual('456 Oak Avenue');
    expect(referral.phone_number).toEqual('555-0202');
    expect(referral.gender).toEqual('female');
    expect(referral.online_appointments).toBe(true);
    expect(referral.url).toEqual('https://dromplete.example.com');
    expect(referral.wait_time).toEqual('within_month');
    expect(referral.same_day_service).toBe(true);
    expect(referral.comments).toEqual('Excellent psychiatrist with evening hours');
    expect(referral.approval_status).toEqual('pending');
    expect(referral.submitted_by).toEqual('user999');
    expect(referral.approved_by).toBeNull();
    expect(referral.created_at).toBeInstanceOf(Date);
    expect(referral.updated_at).toBeInstanceOf(Date);
  });

  it('should handle referrals with nullable fields', async () => {
    // Create test office
    const [office] = await db.insert(officesTable)
      .values({
        name: 'Minimal Medical'
      })
      .returning()
      .execute();

    // Create referral with minimal required fields only
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office.id,
        doctor_name: 'Dr. Minimal',
        type: 'other',
        address: null,
        phone_number: null,
        gender: 'prefer_not_to_say',
        online_appointments: false,
        url: null,
        wait_time: 'unknown',
        same_day_service: false,
        comments: null,
        approval_status: 'pending',
        submitted_by: null
      })
      .execute();

    const result = await getPendingReferrals();

    expect(result).toHaveLength(1);
    const referral = result[0];

    // Verify nullable fields are properly handled
    expect(referral.address).toBeNull();
    expect(referral.phone_number).toBeNull();
    expect(referral.url).toBeNull();
    expect(referral.comments).toBeNull();
    expect(referral.submitted_by).toBeNull();
    expect(referral.approved_by).toBeNull();

    // Verify required fields are present
    expect(referral.doctor_name).toEqual('Dr. Minimal');
    expect(referral.type).toEqual('other');
    expect(referral.gender).toEqual('prefer_not_to_say');
    expect(referral.approval_status).toEqual('pending');
  });

  it('should work with multiple offices', async () => {
    // Create multiple test offices
    const [office1] = await db.insert(officesTable)
      .values({
        name: 'Downtown Clinic'
      })
      .returning()
      .execute();

    const [office2] = await db.insert(officesTable)
      .values({
        name: 'Uptown Medical'
      })
      .returning()
      .execute();

    // Create pending referrals for each office
    await db.insert(doctorReferralsTable)
      .values([
        {
          office_id: office1.id,
          doctor_name: 'Dr. Downtown',
          type: 'pediatrician',
          gender: 'male',
          online_appointments: true,
          wait_time: 'within_week',
          same_day_service: false,
          approval_status: 'pending',
          submitted_by: 'user_downtown'
        },
        {
          office_id: office2.id,
          doctor_name: 'Dr. Uptown',
          type: 'ophthalmologist',
          gender: 'female',
          online_appointments: false,
          wait_time: 'within_month',
          same_day_service: true,
          approval_status: 'pending',
          submitted_by: 'user_uptown'
        }
      ])
      .execute();

    const result = await getPendingReferrals();

    expect(result).toHaveLength(2);
    
    // Verify both offices are represented
    const officeNames = result.map(r => r.office_name);
    expect(officeNames).toContain('Downtown Clinic');
    expect(officeNames).toContain('Uptown Medical');

    // Verify correct doctor-office associations
    const downtownReferral = result.find(r => r.office_name === 'Downtown Clinic');
    const uptownReferral = result.find(r => r.office_name === 'Uptown Medical');

    expect(downtownReferral?.doctor_name).toEqual('Dr. Downtown');
    expect(uptownReferral?.doctor_name).toEqual('Dr. Uptown');
  });
});