import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { officesTable, doctorReferralsTable } from '../db/schema';
import { searchDoctors } from '../handlers/search_doctors';

describe('searchDoctors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should search doctors by name', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Test Medical Center'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. John Smith',
        type: 'general_practitioner',
        address: '123 Main St',
        phone_number: '555-0123',
        gender: 'male',
        online_appointments: true,
        url: 'https://example.com',
        wait_time: 'within_week',
        same_day_service: false,
        comments: 'Great doctor',
        approval_status: 'approved',
        submitted_by: 'user123',
        approved_by: 'admin456'
      })
      .execute();

    const results = await searchDoctors('John');

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. John Smith');
    expect(results[0].office_name).toEqual('Test Medical Center');
    expect(results[0].approval_status).toEqual('approved');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should search doctors by office name', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Cardiology Specialists'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Jane Doe',
        type: 'cardiologist',
        address: '456 Oak Ave',
        phone_number: '555-0456',
        gender: 'female',
        online_appointments: false,
        url: null,
        wait_time: 'within_month',
        same_day_service: true,
        comments: 'Excellent cardiologist',
        approval_status: 'approved',
        submitted_by: 'user789',
        approved_by: 'admin123'
      })
      .execute();

    const results = await searchDoctors('Cardiology');

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. Jane Doe');
    expect(results[0].office_name).toEqual('Cardiology Specialists');
    expect(results[0].type).toEqual('cardiologist');
  });

  it('should search doctors by comments', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Family Health Clinic'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Mike Wilson',
        type: 'pediatrician',
        address: '789 Pine St',
        phone_number: '555-0789',
        gender: 'male',
        online_appointments: true,
        url: 'https://pediatrics.example.com',
        wait_time: 'same_day',
        same_day_service: true,
        comments: 'Specializes in childhood diabetes treatment',
        approval_status: 'approved',
        submitted_by: 'user456',
        approved_by: 'admin789'
      })
      .execute();

    const results = await searchDoctors('diabetes');

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. Mike Wilson');
    expect(results[0].comments).toEqual('Specializes in childhood diabetes treatment');
    expect(results[0].type).toEqual('pediatrician');
  });

  it('should search doctors by address', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Downtown Medical'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Sarah Johnson',
        type: 'dermatologist',
        address: '100 Broadway Avenue',
        phone_number: '555-0100',
        gender: 'female',
        online_appointments: false,
        url: null,
        wait_time: 'within_week',
        same_day_service: false,
        comments: null,
        approval_status: 'approved',
        submitted_by: 'user321',
        approved_by: 'admin654'
      })
      .execute();

    const results = await searchDoctors('Broadway');

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. Sarah Johnson');
    expect(results[0].address).toEqual('100 Broadway Avenue');
    expect(results[0].type).toEqual('dermatologist');
  });

  it('should search doctors by type', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Specialty Clinic'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Robert Brown',
        type: 'orthopedist',
        address: '200 Medical Plaza',
        phone_number: '555-0200',
        gender: 'male',
        online_appointments: true,
        url: 'https://ortho.example.com',
        wait_time: 'over_month',
        same_day_service: false,
        comments: 'Sports medicine specialist',
        approval_status: 'approved',
        submitted_by: 'user654',
        approved_by: 'admin321'
      })
      .execute();

    const results = await searchDoctors('orthopedist');

    expect(results).toHaveLength(1);
    expect(results[0].doctor_name).toEqual('Dr. Robert Brown');
    expect(results[0].type).toEqual('orthopedist');
    expect(results[0].comments).toEqual('Sports medicine specialist');
  });

  it('should only return approved referrals', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Test Clinic'
      })
      .returning()
      .execute();

    // Create pending doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Pending Doctor',
        type: 'general_practitioner',
        address: '300 Test St',
        phone_number: '555-0300',
        gender: 'female',
        online_appointments: false,
        url: null,
        wait_time: 'unknown',
        same_day_service: false,
        comments: null,
        approval_status: 'pending',
        submitted_by: 'user987',
        approved_by: null
      })
      .execute();

    // Create rejected doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Rejected Doctor',
        type: 'general_practitioner',
        address: '400 Test St',
        phone_number: '555-0400',
        gender: 'male',
        online_appointments: false,
        url: null,
        wait_time: 'unknown',
        same_day_service: false,
        comments: null,
        approval_status: 'rejected',
        submitted_by: 'user111',
        approved_by: 'admin222'
      })
      .execute();

    const results = await searchDoctors('Doctor');

    // Should return no results since none are approved
    expect(results).toHaveLength(0);
  });

  it('should return multiple matching results', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Multi Doctor Clinic'
      })
      .returning()
      .execute();

    // Create multiple approved doctor referrals
    await db.insert(doctorReferralsTable)
      .values([
        {
          office_id: office[0].id,
          doctor_name: 'Dr. Smith Johnson',
          type: 'general_practitioner',
          address: '500 Main St',
          phone_number: '555-0500',
          gender: 'male',
          online_appointments: true,
          url: null,
          wait_time: 'within_week',
          same_day_service: false,
          comments: null,
          approval_status: 'approved',
          submitted_by: 'user123',
          approved_by: 'admin456'
        },
        {
          office_id: office[0].id,
          doctor_name: 'Dr. Johnson Smith',
          type: 'pediatrician',
          address: '600 Oak St',
          phone_number: '555-0600',
          gender: 'female',
          online_appointments: false,
          url: 'https://pediatrics.example.com',
          wait_time: 'same_day',
          same_day_service: true,
          comments: 'Great with children',
          approval_status: 'approved',
          submitted_by: 'user456',
          approved_by: 'admin789'
        }
      ])
      .execute();

    const results = await searchDoctors('Johnson');

    expect(results).toHaveLength(2);
    expect(results.map(r => r.doctor_name)).toContain('Dr. Smith Johnson');
    expect(results.map(r => r.doctor_name)).toContain('Dr. Johnson Smith');
  });

  it('should return empty array for no matches', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Empty Search Clinic'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. Test Doctor',
        type: 'general_practitioner',
        address: '700 Test Ave',
        phone_number: '555-0700',
        gender: 'non_binary',
        online_appointments: true,
        url: null,
        wait_time: 'within_month',
        same_day_service: false,
        comments: 'Regular checkups',
        approval_status: 'approved',
        submitted_by: 'user789',
        approved_by: 'admin123'
      })
      .execute();

    const results = await searchDoctors('NonExistentTerm');

    expect(results).toHaveLength(0);
  });

  it('should perform case-insensitive search', async () => {
    // Create test office
    const office = await db.insert(officesTable)
      .values({
        name: 'Case Test Clinic'
      })
      .returning()
      .execute();

    // Create approved doctor referral
    await db.insert(doctorReferralsTable)
      .values({
        office_id: office[0].id,
        doctor_name: 'Dr. UPPERCASE Name',
        type: 'psychiatrist',
        address: '800 Lower Case St',
        phone_number: '555-0800',
        gender: 'prefer_not_to_say',
        online_appointments: false,
        url: 'https://MIXED-case.example.com',
        wait_time: 'within_week',
        same_day_service: false,
        comments: 'MiXeD cAsE comments',
        approval_status: 'approved',
        submitted_by: 'user888',
        approved_by: 'admin999'
      })
      .execute();

    // Test various case combinations
    const results1 = await searchDoctors('uppercase');
    const results2 = await searchDoctors('LOWER');
    const results3 = await searchDoctors('mixed');

    expect(results1).toHaveLength(1);
    expect(results2).toHaveLength(1);
    expect(results3).toHaveLength(1);
    expect(results1[0].doctor_name).toEqual('Dr. UPPERCASE Name');
    expect(results2[0].address).toEqual('800 Lower Case St');
    expect(results3[0].comments).toEqual('MiXeD cAsE comments');
  });
});