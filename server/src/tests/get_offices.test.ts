import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { officesTable } from '../db/schema';
import { getOffices } from '../handlers/get_offices';

describe('getOffices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no offices exist', async () => {
    const result = await getOffices();
    expect(result).toEqual([]);
  });

  it('should return all offices when they exist', async () => {
    // Create test offices
    await db.insert(officesTable)
      .values([
        { name: 'Central Medical Center' },
        { name: 'Downtown Health Clinic' },
        { name: 'Northside Family Practice' }
      ])
      .execute();

    const result = await getOffices();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Central Medical Center');
    expect(result[1].name).toEqual('Downtown Health Clinic');
    expect(result[2].name).toEqual('Northside Family Practice');

    // Verify all fields are present
    result.forEach(office => {
      expect(office.id).toBeDefined();
      expect(typeof office.id).toBe('number');
      expect(office.name).toBeDefined();
      expect(typeof office.name).toBe('string');
      expect(office.created_at).toBeInstanceOf(Date);
      expect(office.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return offices in database insertion order', async () => {
    // Insert offices in specific order
    await db.insert(officesTable)
      .values({ name: 'First Office' })
      .execute();

    await db.insert(officesTable)
      .values({ name: 'Second Office' })
      .execute();

    await db.insert(officesTable)
      .values({ name: 'Third Office' })
      .execute();

    const result = await getOffices();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Office');
    expect(result[1].name).toEqual('Second Office');
    expect(result[2].name).toEqual('Third Office');

    // Verify IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle special characters in office names', async () => {
    // Test office names with special characters
    await db.insert(officesTable)
      .values([
        { name: 'St. Mary\'s Hospital & Medical Center' },
        { name: 'Children\'s Healthcare - North Campus' },
        { name: 'Emory Healthcare @ Midtown' }
      ])
      .execute();

    const result = await getOffices();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('St. Mary\'s Hospital & Medical Center');
    expect(result[1].name).toEqual('Children\'s Healthcare - North Campus');
    expect(result[2].name).toEqual('Emory Healthcare @ Midtown');
  });

  it('should correctly handle timestamp fields', async () => {
    const beforeInsert = new Date();
    
    await db.insert(officesTable)
      .values({ name: 'Test Medical Office' })
      .execute();

    const afterInsert = new Date();
    const result = await getOffices();

    expect(result).toHaveLength(1);
    const office = result[0];
    
    // Verify timestamps are within expected range
    expect(office.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(office.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    expect(office.updated_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(office.updated_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});