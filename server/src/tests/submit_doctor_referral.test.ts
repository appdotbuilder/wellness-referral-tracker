import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type SubmitDoctorReferralInput } from '../schema';
import { submitDoctorReferral } from '../handlers/submit_doctor_referral';
import { eq } from 'drizzle-orm';

describe('submitDoctorReferral', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOfficeId: number;

  beforeEach(async () => {
    // Create test office for referrals
    const office = await db.insert(officesTable)
      .values({
        name: 'Test Medical Center'
      })
      .returning()
      .execute();
    
    testOfficeId = office[0].id;
  });

  const testInput: SubmitDoctorReferralInput = {
    office_id: 0, // Will be set to testOfficeId in each test
    doctor_name: 'Dr. Jane Smith',
    type: 'general_practitioner',
    address: '123 Medical Plaza, Health City, HC 12345',
    phone_number: '+1-555-123-4567',
    gender: 'female',
    online_appointments: true,
    url: 'https://drjanesmith.medicalpractice.com',
    wait_time: 'within_week',
    same_day_service: false,
    comments: 'Excellent bedside manner, very thorough with patient care',
    submitted_by: 'user123'
  };

  it('should create a doctor referral with pending approval status', async () => {
    const input = { ...testInput, office_id: testOfficeId };
    const result = await submitDoctorReferral(input);

    // Basic field validation
    expect(result.office_id).toEqual(testOfficeId);
    expect(result.doctor_name).toEqual('Dr. Jane Smith');
    expect(result.type).toEqual('general_practitioner');
    expect(result.address).toEqual('123 Medical Plaza, Health City, HC 12345');
    expect(result.phone_number).toEqual('+1-555-123-4567');
    expect(result.gender).toEqual('female');
    expect(result.online_appointments).toBe(true);
    expect(result.url).toEqual('https://drjanesmith.medicalpractice.com');
    expect(result.wait_time).toEqual('within_week');
    expect(result.same_day_service).toBe(false);
    expect(result.comments).toEqual('Excellent bedside manner, very thorough with patient care');
    expect(result.approval_status).toEqual('pending');
    expect(result.submitted_by).toEqual('user123');
    expect(result.approved_by).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save doctor referral to database', async () => {
    const input = { ...testInput, office_id: testOfficeId };
    const result = await submitDoctorReferral(input);

    const referrals = await db.select()
      .from(doctorReferralsTable)
      .where(eq(doctorReferralsTable.id, result.id))
      .execute();

    expect(referrals).toHaveLength(1);
    const referral = referrals[0];
    expect(referral.doctor_name).toEqual('Dr. Jane Smith');
    expect(referral.type).toEqual('general_practitioner');
    expect(referral.approval_status).toEqual('pending');
    expect(referral.office_id).toEqual(testOfficeId);
    expect(referral.created_at).toBeInstanceOf(Date);
    expect(referral.updated_at).toBeInstanceOf(Date);
  });

  it('should handle referral with minimal required fields', async () => {
    const minimalInput: SubmitDoctorReferralInput = {
      office_id: testOfficeId,
      doctor_name: 'Dr. John Doe',
      type: 'dentist',
      address: null,
      phone_number: null,
      gender: 'male',
      online_appointments: false,
      url: null,
      wait_time: 'unknown',
      same_day_service: false,
      comments: null,
      submitted_by: null
    };

    const result = await submitDoctorReferral(minimalInput);

    expect(result.doctor_name).toEqual('Dr. John Doe');
    expect(result.type).toEqual('dentist');
    expect(result.address).toBeNull();
    expect(result.phone_number).toBeNull();
    expect(result.url).toBeNull();
    expect(result.comments).toBeNull();
    expect(result.submitted_by).toBeNull();
    expect(result.approval_status).toEqual('pending');
    expect(result.approved_by).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle different doctor types correctly', async () => {
    const cardiologistInput = {
      ...testInput,
      office_id: testOfficeId,
      doctor_name: 'Dr. Heart Specialist',
      type: 'cardiologist' as const,
      gender: 'non_binary' as const,
      wait_time: 'over_month' as const
    };

    const result = await submitDoctorReferral(cardiologistInput);

    expect(result.doctor_name).toEqual('Dr. Heart Specialist');
    expect(result.type).toEqual('cardiologist');
    expect(result.gender).toEqual('non_binary');
    expect(result.wait_time).toEqual('over_month');
    expect(result.approval_status).toEqual('pending');
  });

  it('should handle empty string URL conversion to null', async () => {
    // Test the Zod transform that converts empty string to null
    const inputWithEmptyUrl = {
      ...testInput,
      office_id: testOfficeId,
      url: '' // Empty string should be converted to null
    };

    const result = await submitDoctorReferral(inputWithEmptyUrl);

    expect(result.url).toBeNull();
  });

  it('should handle same day service and online appointments flags', async () => {
    const urgentCareInput = {
      ...testInput,
      office_id: testOfficeId,
      doctor_name: 'Dr. Urgent Care',
      type: 'general_practitioner' as const,
      wait_time: 'same_day' as const,
      same_day_service: true,
      online_appointments: true
    };

    const result = await submitDoctorReferral(urgentCareInput);

    expect(result.same_day_service).toBe(true);
    expect(result.online_appointments).toBe(true);
    expect(result.wait_time).toEqual('same_day');
  });

  it('should throw error when office does not exist', async () => {
    const inputWithInvalidOffice = {
      ...testInput,
      office_id: 99999 // Non-existent office ID
    };

    await expect(submitDoctorReferral(inputWithInvalidOffice))
      .rejects
      .toThrow(/Office with id 99999 does not exist/i);
  });

  it('should handle various gender preferences', async () => {
    const genderOptions = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;

    for (const gender of genderOptions) {
      const genderInput = {
        ...testInput,
        office_id: testOfficeId,
        doctor_name: `Dr. ${gender} Test`,
        gender
      };

      const result = await submitDoctorReferral(genderInput);
      expect(result.gender).toEqual(gender);
      expect(result.approval_status).toEqual('pending');
    }
  });

  it('should handle various wait time options', async () => {
    const waitTimeOptions = ['same_day', 'within_week', 'within_month', 'over_month', 'unknown'] as const;

    for (const waitTime of waitTimeOptions) {
      const waitTimeInput = {
        ...testInput,
        office_id: testOfficeId,
        doctor_name: `Dr. ${waitTime} Test`,
        wait_time: waitTime
      };

      const result = await submitDoctorReferral(waitTimeInput);
      expect(result.wait_time).toEqual(waitTime);
      expect(result.approval_status).toEqual('pending');
    }
  });
});