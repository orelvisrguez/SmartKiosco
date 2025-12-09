// Run this script to add the notes column to purchases table
// Usage: node run-migration.js

import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_VJih5mNw6Oye@ep-aged-darkness-acjhbj4a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  console.log('Running migration...');

  const sql = neon(connectionString);

  try {
    // Add notes column to purchases table if it doesn't exist
    await sql`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL
    `;
    console.log('✅ Notes column added successfully to purchases table');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
