import { type DoctorWithOffice } from '../schema';

export async function getDoctorsWithLocations(): Promise<DoctorWithOffice[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching all approved doctor referrals that have address information.
  // This is specifically for the map feature to display location pins.
  // Only returns doctors with non-null addresses for mapping purposes.
  // Includes full doctor and office information for map popup details.
  return Promise.resolve([]);
}