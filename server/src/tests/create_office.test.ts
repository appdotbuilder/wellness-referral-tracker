import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { officesTable } from '../db/schema';
import { type CreateOfficeInput } from '../schema';
import { createOffice } from '../handlers/create_office';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateOfficeInput = {
  name: 'Test Medical Office'
};

describe('createOffice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an office', async () => {
    const result = await createOffice(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Medical Office');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save office to database', async () => {
    const result = await createOffice(testInput);

    // Query using proper drizzle syntax
    const offices = await db.select()
      .from(officesTable)
      .where(eq(officesTable.id, result.id))
      .execute();

    expect(offices).toHaveLength(1);
    expect(offices[0].name).toEqual('Test Medical Office');
    expect(offices[0].created_at).toBeInstanceOf(Date);
    expect(offices[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle special characters in office name', async () => {
    const specialInput: CreateOfficeInput = {
      name: 'St. Mary\'s Medical Center & Hospital (Downtown)'
    };

    const result = await createOffice(specialInput);

    expect(result.name).toEqual('St. Mary\'s Medical Center & Hospital (Downtown)');
    
    // Verify in database
    const offices = await db.select()
      .from(officesTable)
      .where(eq(officesTable.id, result.id))
      .execute();

    expect(offices[0].name).toEqual('St. Mary\'s Medical Center & Hospital (Downtown)');
  });

  it('should handle long office names', async () => {
    const longInput: CreateOfficeInput = {
      name: 'Very Long Medical Office Name That Exceeds Normal Length To Test Database Text Field Handling'
    };

    const result = await createOffice(longInput);

    expect(result.name).toEqual(longInput.name);
    
    // Verify in database
    const offices = await db.select()
      .from(officesTable)
      .where(eq(officesTable.id, result.id))
      .execute();

    expect(offices[0].name).toEqual(longInput.name);
  });

  it('should create multiple offices with unique IDs', async () => {
    const office1 = await createOffice({ name: 'First Office' });
    const office2 = await createOffice({ name: 'Second Office' });

    expect(office1.id).not.toEqual(office2.id);
    expect(office1.name).toEqual('First Office');
    expect(office2.name).toEqual('Second Office');

    // Verify both exist in database
    const allOffices = await db.select()
      .from(officesTable)
      .execute();

    expect(allOffices).toHaveLength(2);
    const names = allOffices.map(o => o.name).sort();
    expect(names).toEqual(['First Office', 'Second Office']);
  });
});