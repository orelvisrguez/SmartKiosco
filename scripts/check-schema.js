import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_VJih5mNw6Oye@ep-aged-darkness-acjhbj4a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

const saleItemsCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sale_items' ORDER BY ordinal_position`;
console.log('sale_items columns:', saleItemsCols);

const salesCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales' ORDER BY ordinal_position`;
console.log('sales columns:', salesCols);
