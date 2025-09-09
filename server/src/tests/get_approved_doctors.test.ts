import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type FilterDoctorsInput } from '../schema';
import { getApprovedDoctors } from '../handlers/get_approved_doctors';

// Test data
const testOffice = {
  name: 'Test Medical Center'
};

const testDoctor = {
  office_id: 1, // Will be set after office creation
  doctor_name: 'Dr. Jane Smith',
  type: 'general_practitioner' as const,
  address: '123 Main St, City, State',
  phone_number: '555-0123',
  gender: 'female' as const,
  online_appointments: true,
  url: 'https://example.com',
  wait_time: 'within_week' as const,
  same_day_service: false,
  comments: 'Great doctor',
  approval_status: 'approved' as const,
  submitted_by: 'user123',
  approved_by: 'admin456'
};

const pendingDoctor = {
  office_id: 1,
  doctor_name: 'Dr. Bob Wilson',
  type: 'dentist' as const,
  address: '456 Oak Ave, City, State',
  phone_number: '555-0456',
  gender: 'male' as const,
  online_appointments: false,
  url: null,
  wait_time: 'within_month' as const,
  same_day_service: true,
  comments: null,
  approval_status: 'pending' as const,
  submitted_by: 'user789',
  approved_by: null
};

describe('getApprovedDoctors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only approved doctors', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create approved and pending doctors
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id },
        { ...pendingDoctor, office_id: office[0].id }
      ])
      .execute();

    const results = await getApprovedDoctors();

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toBe('Dr. Jane Smith');
    expect(results[0].approval_status).toBe('approved');
    expect(results[0].office_name).toBe('Test Medical Center');
  });

  it('should return empty array when no approved doctors exist', async () => {
    // Create office but no doctors
    await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    const results = await getApprovedDoctors();

    expect(results).toHaveLength(0);
  });

  it('should filter by office_id', async () => {
    // Create two offices
    const offices = await db.insert(officesTable)
      .values([
        { name: 'Office A' },
        { name: 'Office B' }
      ])
      .returning()
      .execute();

    // Create doctors for both offices
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: offices[0].id, doctor_name: 'Dr. Office A' },
        { ...testDoctor, office_id: offices[1].id, doctor_name: 'Dr. Office B' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      office_id: offices[0].id
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toBe('Dr. Office A');
    expect(results[0].office_id).toBe(offices[0].id);
  });

  it('should filter by doctor name (case insensitive)', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different names
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, doctor_name: 'Dr. Jane Smith' },
        { ...testDoctor, office_id: office[0].id, doctor_name: 'Dr. John Doe' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      doctor_name: 'jane'
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toBe('Dr. Jane Smith');
  });

  it('should filter by doctor type', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different types
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, type: 'general_practitioner' },
        { ...testDoctor, office_id: office[0].id, type: 'dentist', doctor_name: 'Dr. Dentist' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      type: 'dentist'
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('dentist');
    expect(results[0].doctor_name).toBe('Dr. Dentist');
  });

  it('should filter by gender', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different genders
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, gender: 'female' },
        { ...testDoctor, office_id: office[0].id, gender: 'male', doctor_name: 'Dr. Male Doctor' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      gender: 'male'
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].gender).toBe('male');
    expect(results[0].doctor_name).toBe('Dr. Male Doctor');
  });

  it('should filter by online appointments availability', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different online appointment availability
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, online_appointments: true },
        { ...testDoctor, office_id: office[0].id, online_appointments: false, doctor_name: 'Dr. No Online' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      online_appointments: false
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].online_appointments).toBe(false);
    expect(results[0].doctor_name).toBe('Dr. No Online');
  });

  it('should filter by wait time', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different wait times
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, wait_time: 'within_week' },
        { ...testDoctor, office_id: office[0].id, wait_time: 'same_day', doctor_name: 'Dr. Same Day' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      wait_time: 'same_day'
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].wait_time).toBe('same_day');
    expect(results[0].doctor_name).toBe('Dr. Same Day');
  });

  it('should filter by same day service availability', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with different same day service availability
    await db.insert(doctorReferralsTable)
      .values([
        { ...testDoctor, office_id: office[0].id, same_day_service: false },
        { ...testDoctor, office_id: office[0].id, same_day_service: true, doctor_name: 'Dr. Same Day Service' }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      same_day_service: true
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].same_day_service).toBe(true);
    expect(results[0].doctor_name).toBe('Dr. Same Day Service');
  });

  it('should apply multiple filters simultaneously', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctors with various attributes
    await db.insert(doctorReferralsTable)
      .values([
        { 
          ...testDoctor, 
          office_id: office[0].id,
          gender: 'female',
          type: 'general_practitioner',
          online_appointments: true 
        },
        { 
          ...testDoctor, 
          office_id: office[0].id,
          doctor_name: 'Dr. Male GP Online',
          gender: 'male',
          type: 'general_practitioner',
          online_appointments: true 
        },
        { 
          ...testDoctor, 
          office_id: office[0].id,
          doctor_name: 'Dr. Female Dentist',
          gender: 'female',
          type: 'dentist',
          online_appointments: true 
        }
      ])
      .execute();

    const filters: FilterDoctorsInput = {
      gender: 'female',
      type: 'general_practitioner',
      online_appointments: true
    };

    const results = await getApprovedDoctors(filters);

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toBe('Dr. Jane Smith');
    expect(results[0].gender).toBe('female');
    expect(results[0].type).toBe('general_practitioner');
    expect(results[0].online_appointments).toBe(true);
  });

  it('should include all required fields in response', async () => {
    // Create office
    const office = await db.insert(officesTable)
      .values(testOffice)
      .returning()
      .execute();

    // Create doctor
    await db.insert(doctorReferralsTable)
      .values({ ...testDoctor, office_id: office[0].id })
      .execute();

    const results = await getApprovedDoctors();

    expect(results).toHaveLength(1);
    const doctor = results[0];

    // Verify all fields are present and have correct types
    expect(typeof doctor.id).toBe('number');
    expect(typeof doctor.office_id).toBe('number');
    expect(typeof doctor.office_name).toBe('string');
    expect(typeof doctor.doctor_name).toBe('string');
    expect(doctor.type).toBe('general_practitioner');
    expect(typeof doctor.address).toBe('string');
    expect(typeof doctor.phone_number).toBe('string');
    expect(doctor.gender).toBe('female');
    expect(typeof doctor.online_appointments).toBe('boolean');
    expect(typeof doctor.url).toBe('string');
    expect(doctor.wait_time).toBe('within_week');
    expect(typeof doctor.same_day_service).toBe('boolean');
    expect(typeof doctor.comments).toBe('string');
    expect(doctor.approval_status).toBe('approved');
    expect(typeof doctor.submitted_by).toBe('string');
    expect(typeof doctor.approved_by).toBe('string');
    expect(doctor.created_at).toBeInstanceOf(Date);
    expect(doctor.updated_at).toBeInstanceOf(Date);
  });

  it('should handle search filter across doctor and office names', async () => {
    // Create offices with different names
    const offices = await db.insert(officesTable)
      .values([
        { name: 'Heart Medical Center' },
        { name: 'Downtown Clinic' }
      ])
      .returning()
      .execute();

    // Create doctors in different offices
    await db.insert(doctorReferralsTable)
      .values([
        { 
          ...testDoctor, 
          office_id: offices[0].id,
          doctor_name: 'Dr. Heart Specialist'
        },
        { 
          ...testDoctor, 
          office_id: offices[1].id,
          doctor_name: 'Dr. Downtown Doc'
        }
      ])
      .execute();

    // Search should find matches in both doctor names and office names
    const heartResults = await getApprovedDoctors({ search: 'heart' });
    expect(heartResults).toHaveLength(1);
    expect(heartResults[0].doctor_name).toBe('Dr. Heart Specialist');

    const downtownResults = await getApprovedDoctors({ search: 'downtown' });
    expect(downtownResults).toHaveLength(1);
    expect(downtownResults[0].doctor_name).toBe('Dr. Downtown Doc');
  });
});