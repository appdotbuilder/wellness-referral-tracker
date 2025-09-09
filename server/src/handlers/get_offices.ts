import { db } from '../db';
import { officesTable } from '../db/schema';
import { type Office } from '../schema';

export const getOffices = async (): Promise<Office[]> => {
  try {
    const results = await db.select()
      .from(officesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch offices:', error);
    throw error;
  }
};