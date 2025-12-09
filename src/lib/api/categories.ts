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

// ==================== EXTENDED STATISTICS ====================

export interface CategoryWithStats extends DBCategory {
  product_count: number;
  total_sales: number;
  total_revenue: number;
  avg_product_price: number;
  stock_value: number;
  low_stock_count: number;
}

export async function fetchCategoriesWithStats(): Promise<CategoryWithStats[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        c.*,
        COALESCE(p_stats.product_count, 0) as product_count,
        COALESCE(s_stats.total_sales, 0) as total_sales,
        COALESCE(s_stats.total_revenue, 0) as total_revenue,
        COALESCE(p_stats.avg_price, 0) as avg_product_price,
        COALESCE(p_stats.stock_value, 0) as stock_value,
        COALESCE(p_stats.low_stock_count, 0) as low_stock_count
      FROM categories c
      LEFT JOIN (
        SELECT
          category_id,
          COUNT(*) as product_count,
          AVG(price) as avg_price,
          SUM(stock * cost) as stock_value,
          COUNT(*) FILTER (WHERE stock <= min_stock) as low_stock_count
        FROM products
        WHERE active = true
        GROUP BY category_id
      ) p_stats ON c.id = p_stats.category_id
      LEFT JOIN (
        SELECT
          p.category_id,
          COUNT(DISTINCT si.sale_id) as total_sales,
          SUM(si.subtotal) as total_revenue
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        GROUP BY p.category_id
      ) s_stats ON c.id = s_stats.category_id
      ORDER BY c.name
    `;
    return results as CategoryWithStats[];
  } catch (error) {
    console.error('Error fetching categories with stats:', error);
    return [];
  }
}

export interface CategorySummary {
  totalCategories: number;
  totalProducts: number;
  totalRevenue: number;
  avgProductsPerCategory: number;
}

export async function getCategoriesSummary(): Promise<CategorySummary> {
  if (!sql) {
    return { totalCategories: 0, totalProducts: 0, totalRevenue: 0, avgProductsPerCategory: 0 };
  }

  try {
    const catCount = await sql`SELECT COUNT(*) as count FROM categories`;
    const prodCount = await sql`SELECT COUNT(*) as count FROM products WHERE active = true`;
    const revenue = await sql`
      SELECT COALESCE(SUM(si.subtotal), 0) as total
      FROM sale_items si
    `;

    const totalCategories = parseInt(catCount[0].count);
    const totalProducts = parseInt(prodCount[0].count);
    const totalRevenue = parseFloat(revenue[0].total);
    const avgProductsPerCategory = totalCategories > 0 ? totalProducts / totalCategories : 0;

    return { totalCategories, totalProducts, totalRevenue, avgProductsPerCategory };
  } catch (error) {
    console.error('Error getting categories summary:', error);
    return { totalCategories: 0, totalProducts: 0, totalRevenue: 0, avgProductsPerCategory: 0 };
  }
}
