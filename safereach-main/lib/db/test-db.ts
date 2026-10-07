import { db } from './src/index';
import { sheltersTable } from './src/schema/safereach';
import { eq } from 'drizzle-orm';

async function run() {
  console.log('=== DB INSERT ===');
  const [shelter] = await db.insert(sheltersTable).values({
    name: 'Real Supabase Shelter',
    address: '123 Cloud St',
    latitude: 35.0,
    longitude: 135.0,
    capacity: 50,
  }).returning();
  console.log('INSERTED:', shelter);

  console.log('=== DB SELECT ===');
  const allShelters = await db.select().from(sheltersTable).where(eq(sheltersTable.id, shelter.id));
  console.log('SELECTED:', allShelters);

  console.log('=== DB UPDATE ===');
  const [updated] = await db.update(sheltersTable).set({ occupied: 5 }).where(eq(sheltersTable.id, shelter.id)).returning();
  console.log('UPDATED:', updated);

  console.log('=== DB DELETE ===');
  await db.delete(sheltersTable).where(eq(sheltersTable.id, shelter.id));
  console.log('DELETED shelter with id:', shelter.id);

  console.log('=== DB FINAL CHECK ===');
  const finalCheck = await db.select().from(sheltersTable).where(eq(sheltersTable.id, shelter.id));
  console.log('REMAINING:', finalCheck);
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
