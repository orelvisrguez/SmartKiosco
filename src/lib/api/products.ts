import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBProduct {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ProductWithCategory extends DBProduct {
  category_name: string | null;
  category_color: string | null;
}

// Helper to convert DB row to proper types
function parseProduct(row: any): ProductWithCategory {
  return {
    ...row,
    price: parseFloat(row.price) || 0,
    cost: parseFloat(row.cost) || 0,
    stock: parseInt(row.stock) || 0,
    min_stock: parseInt(row.min_stock) || 0,
  };
}

// Fetch all products with category info
export async function fetchProducts(): Promise<ProductWithCategory[]> {
  if (!sql) {
    console.warn('Database not configured');
    return [];
  }

  try {
    const results = await sql`
      SELECT
        p.*,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    return results.map(parseProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Fetch all categories
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

// Create a new product
export async function createProduct(product: {
  name: string;
  barcode?: string;
  category_id?: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  image_url?: string;
  active?: boolean;
}): Promise<DBProduct> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, image_url, active)
      VALUES (
        ${product.name},
        ${product.barcode || null},
        ${product.category_id || null},
        ${product.price},
        ${product.cost},
        ${product.stock},
        ${product.min_stock},
        ${product.image_url || null},
        ${product.active !== false}
      )
      RETURNING *
    `;
    return results[0] as DBProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Update a product
export async function updateProduct(id: string, product: Partial<{
  name: string;
  barcode: string;
  category_id: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  image_url: string;
  active: boolean;
}>): Promise<DBProduct> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE products
      SET
        name = COALESCE(${product.name}, name),
        barcode = COALESCE(${product.barcode}, barcode),
        category_id = COALESCE(${product.category_id}, category_id),
        price = COALESCE(${product.price}, price),
        cost = COALESCE(${product.cost}, cost),
        stock = COALESCE(${product.stock}, stock),
        min_stock = COALESCE(${product.min_stock}, min_stock),
        image_url = COALESCE(${product.image_url}, image_url),
        active = COALESCE(${product.active}, active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return results[0] as DBProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Bulk delete products
export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    for (const id of ids) {
      await sql`DELETE FROM products WHERE id = ${id}`;
    }
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    throw error;
  }
}

// Bulk update product status
export async function bulkUpdateStatus(ids: string[], active: boolean): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    for (const id of ids) {
      await sql`UPDATE products SET active = ${active}, updated_at = NOW() WHERE id = ${id}`;
    }
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  }
}

// Update stock
export async function updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<DBProduct> {
  if (!sql) throw new Error('Database not configured');

  try {
    let results;
    if (operation === 'set') {
      results = await sql`
        UPDATE products SET stock = ${quantity}, updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
    } else if (operation === 'add') {
      results = await sql`
        UPDATE products SET stock = stock + ${quantity}, updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
    } else {
      results = await sql`
        UPDATE products SET stock = GREATEST(0, stock - ${quantity}), updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
    }
    return results[0] as DBProduct;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
}

// Get product stats
export async function getProductStats(): Promise<{
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  totalCost: number;
}> {
  if (!sql) {
    return { total: 0, active: 0, lowStock: 0, outOfStock: 0, totalValue: 0, totalCost: 0 };
  }

  try {
    const results = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true) as active,
        COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0) as low_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COALESCE(SUM(price * stock), 0) as total_value,
        COALESCE(SUM(cost * stock), 0) as total_cost
      FROM products
    `;
    return {
      total: parseInt(results[0].total),
      active: parseInt(results[0].active),
      lowStock: parseInt(results[0].low_stock),
      outOfStock: parseInt(results[0].out_of_stock),
      totalValue: parseFloat(results[0].total_value),
      totalCost: parseFloat(results[0].total_cost),
    };
  } catch (error) {
    console.error('Error getting product stats:', error);
    throw error;
  }
}

// Search products
export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.*,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE
        p.name ILIKE ${'%' + query + '%'} OR
        p.barcode ILIKE ${'%' + query + '%'}
      ORDER BY p.name
      LIMIT 50
    `;
    return results.map(parseProduct);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}
