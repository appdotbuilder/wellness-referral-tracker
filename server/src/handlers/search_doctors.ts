import { type DoctorWithOffice } from '../schema';

export async function searchDoctors(searchTerm: string): Promise<DoctorWithOffice[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is performing full-text search across doctor referrals.
  // Searches across doctor name, office name, comments, and other relevant fields.
  // Only returns approved referrals for public search.
  // Used for general search functionality in the UI.
  return Promise.resolve([]);
}