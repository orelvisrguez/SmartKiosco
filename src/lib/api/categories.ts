import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export async function fetchCategories(): Promise<DBCategory[]> {
  if (!sql) return [];

  try {
    const results = await sql`SELECT * FROM categories ORDER BY name`;
    return results as DBCategory[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCategory(category: {
  name: string;
  color: string;
  icon: string;
}): Promise<DBCategory> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      INSERT INTO categories (name, color, icon)
      VALUES (${category.name}, ${category.color}, ${category.icon})
      RETURNING *
    `;
    return results[0] as DBCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

export async function updateCategory(id: string, category: Partial<{
  name: string;
  color: string;
  icon: string;
}>): Promise<DBCategory> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE categories
      SET
        name = COALESCE(${category.name}, name),
        color = COALESCE(${category.color}, color),
        icon = COALESCE(${category.icon}, icon),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return results[0] as DBCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    await sql`DELETE FROM categories WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export async function getCategoryProductCount(id: string): Promise<number> {
  if (!sql) return 0;

  try {
    const results = await sql`SELECT COUNT(*) as count FROM products WHERE category_id = ${id}`;
    return parseInt(results[0].count);
  } catch (error) {
    console.error('Error getting category product count:', error);
    return 0;
  }
}
