import { db } from '../db';
import { doctorReferralsTable, officesTable } from '../db/schema';
import { type FilterDoctorsInput, type DoctorWithOffice } from '../schema';
import { eq, and, ilike, or, type SQL } from 'drizzle-orm';

export async function getApprovedDoctors(filters?: FilterDoctorsInput): Promise<DoctorWithOffice[]> {
  try {
    // Start with base query joining doctors with offices
    let baseQuery = db.select({
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
    .innerJoin(officesTable, eq(doctorReferralsTable.office_id, officesTable.id));

    // Build conditions array - always include approved status filter
    const conditions: SQL<unknown>[] = [
      eq(doctorReferralsTable.approval_status, 'approved')
    ];

    // Apply filters if provided
    if (filters) {
      if (filters.office_id !== undefined) {
        conditions.push(eq(doctorReferralsTable.office_id, filters.office_id));
      }

      if (filters.doctor_name) {
        conditions.push(ilike(doctorReferralsTable.doctor_name, `%${filters.doctor_name}%`));
      }

      if (filters.type) {
        conditions.push(eq(doctorReferralsTable.type, filters.type));
      }

      if (filters.gender) {
        conditions.push(eq(doctorReferralsTable.gender, filters.gender));
      }

      if (filters.online_appointments !== undefined) {
        conditions.push(eq(doctorReferralsTable.online_appointments, filters.online_appointments));
      }

      if (filters.wait_time) {
        conditions.push(eq(doctorReferralsTable.wait_time, filters.wait_time));
      }

      if (filters.same_day_service !== undefined) {
        conditions.push(eq(doctorReferralsTable.same_day_service, filters.same_day_service));
      }

      // General search across doctor name and office name
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        const searchCondition = or(
          ilike(doctorReferralsTable.doctor_name, searchTerm),
          ilike(officesTable.name, searchTerm)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
    }

    // Apply where clause with conditions
    const query = conditions.length === 1 
      ? baseQuery.where(conditions[0])
      : baseQuery.where(and(...conditions));

    // Execute query
    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch approved doctors:', error);
    throw error;
  }
}