import { db } from '../db';
import { officesTable } from '../db/schema';
import { type CreateOfficeInput, type Office } from '../schema';

export const createOffice = async (input: CreateOfficeInput): Promise<Office> => {
  try {
    // Insert office record
    const result = await db.insert(officesTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    // Return the created office
    const office = result[0];
    return {
      ...office
    };
  } catch (error) {
    console.error('Office creation failed:', error);
    throw error;
  }
};