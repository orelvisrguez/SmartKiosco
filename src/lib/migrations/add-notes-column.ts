import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';

export async function addNotesColumn() {
  if (!connectionString) {
    console.error('No database connection string');
    return;
  }

  const sql = neon(connectionString);

  try {
    // Add notes column to purchases table if it doesn't exist
    await sql`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL
    `;
    console.log('Notes column added successfully');
    return true;
  } catch (error) {
    console.error('Error adding notes column:', error);
    throw error;
  }
}
