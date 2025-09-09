import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type CreateOfficeInput, type SubmitDoctorReferralInput } from '../schema';
import { getDoctorsWithLocations } from '../handlers/get_doctors_with_locations';

// Test data
const testOfficeInput: CreateOfficeInput = {
  name: 'Test Medical Center'
};

const approvedDoctorWithAddress: SubmitDoctorReferralInput = {
  office_id: 1,
  doctor_name: 'Dr. Jane Smith',
  type: 'general_practitioner',
  address: '123 Main Street, Anytown, ST 12345',
  phone_number: '555-123-4567',
  gender: 'female',
  online_appointments: true,
  url: 'https://example.com',
  wait_time: 'within_week',
  same_day_service: false,
  comments: 'Great doctor for families',
  submitted_by: 'user123'
};

const approvedDoctorWithoutAddress: SubmitDoctorReferralInput = {
  office_id: 1,
  doctor_name: 'Dr. John Doe',
  type: 'cardiologist',
  address: null,
  phone_number: '555-987-6543',
  gender: 'male',
  online_appointments: false,
  url: null,
  wait_time: 'within_month',
  same_day_service: true,
  comments: 'Excellent cardiologist',
  submitted_by: 'user456'
};

const pendingDoctorWithAddress: SubmitDoctorReferralInput = {
  office_id: 1,
  doctor_name: 'Dr. Sarah Wilson',
  type: 'dermatologist',
  address: '456 Oak Avenue, Somewhere, ST 67890',
  phone_number: '555-555-5555',
  gender: 'female',
  online_appointments: true,
  url: 'https://skincare.example.com',
  wait_time: 'same_day',
  same_day_service: true,
  comments: 'Skin specialist',
  submitted_by: 'user789'
};

describe('getDoctorsWithLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return approved doctors with addresses', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create approved doctor with address
    const approvedDoctor = await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(approvedDoctor[0].id);
    expect(results[0].doctor_name).toEqual('Dr. Jane Smith');
    expect(results[0].address).toEqual('123 Main Street, Anytown, ST 12345');
    expect(results[0].office_name).toEqual('Test Medical Center');
    expect(results[0].approval_status).toEqual('approved');
  });

  it('should not return doctors without addresses', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create approved doctor without address
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithoutAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(0);
  });

  it('should not return pending doctors even with addresses', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create pending doctor with address
    await db.insert(doctorReferralsTable)
      .values({
        ...pendingDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'pending'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(0);
  });

  it('should not return rejected doctors even with addresses', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create rejected doctor with address
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'rejected'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(0);
  });

  it('should return multiple approved doctors with addresses', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create first approved doctor with address
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    // Create second approved doctor with address
    await db.insert(doctorReferralsTable)
      .values({
        ...pendingDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'approved' // Override to approved
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(2);
    expect(results.every(doctor => doctor.approval_status === 'approved')).toBe(true);
    expect(results.every(doctor => doctor.address !== null)).toBe(true);
  });

  it('should include complete doctor and office information', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create approved doctor with all fields
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(1);
    const doctor = results[0];
    
    // Verify all required fields are present
    expect(doctor.id).toBeDefined();
    expect(doctor.office_id).toEqual(office[0].id);
    expect(doctor.office_name).toEqual('Test Medical Center');
    expect(doctor.doctor_name).toEqual('Dr. Jane Smith');
    expect(doctor.type).toEqual('general_practitioner');
    expect(doctor.address).toEqual('123 Main Street, Anytown, ST 12345');
    expect(doctor.phone_number).toEqual('555-123-4567');
    expect(doctor.gender).toEqual('female');
    expect(doctor.online_appointments).toEqual(true);
    expect(doctor.url).toEqual('https://example.com');
    expect(doctor.wait_time).toEqual('within_week');
    expect(doctor.same_day_service).toEqual(false);
    expect(doctor.comments).toEqual('Great doctor for families');
    expect(doctor.approval_status).toEqual('approved');
    expect(doctor.submitted_by).toEqual('user123');
    expect(doctor.approved_by).toBeNull();
    expect(doctor.created_at).toBeInstanceOf(Date);
    expect(doctor.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no approved doctors with addresses exist', async () => {
    // Create test office but no doctors
    await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed scenarios correctly', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: testOfficeInput.name
      })
      .returning()
      .execute();

    // Create approved doctor with address (should be included)
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    // Create approved doctor without address (should be excluded)
    await db.insert(doctorReferralsTable)
      .values({
        ...approvedDoctorWithoutAddress,
        office_id: office[0].id,
        approval_status: 'approved'
      })
      .returning()
      .execute();

    // Create pending doctor with address (should be excluded)
    await db.insert(doctorReferralsTable)
      .values({
        ...pendingDoctorWithAddress,
        office_id: office[0].id,
        approval_status: 'pending'
      })
      .returning()
      .execute();

    const results = await getDoctorsWithLocations();

    // Only the approved doctor with address should be returned
    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. Jane Smith');
    expect(results[0].address).toEqual('123 Main Street, Anytown, ST 12345');
    expect(results[0].approval_status).toEqual('approved');
  });
});