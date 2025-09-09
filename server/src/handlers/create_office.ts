import { type CreateOfficeInput, type Office } from '../schema';

export async function createOffice(input: CreateOfficeInput): Promise<Office> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is creating a new medical office and persisting it in the database.
  // This will be used by administrators to add new offices to the predefined list.
  return Promise.resolve({
    id: 0, // Placeholder ID
    name: input.name,
    created_at: new Date(),
    updated_at: new Date()
  } as Office);
}