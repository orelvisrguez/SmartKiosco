import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface InventoryProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  cost: number;
  price: number;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  active: boolean;
  days_of_stock: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
}

export interface InventoryStats {
  totalStock: number;
  totalValue: number;
  totalCost: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalProducts: number;
  activeProducts: number;
  categoriesCount: number;
  avgTurnoverDays: number;
  topMovingProducts: number;
}

export interface CategoryInventory {
  category_id: string;
  category_name: string;
  category_color: string;
  products_count: number;
  total_stock: number;
  total_value: number;
  low_stock_count: number;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  product_name: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  current_value: number;
  threshold_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

function parseProduct(row: any): InventoryProduct {
  const stock = parseInt(row.stock) || 0;
  const minStock = parseInt(row.min_stock) || 5;
  return {
    id: row.id,
    name: row.name,
    stock: stock,
    min_stock: minStock,
    max_stock: minStock * 10 || 100,
    cost: parseFloat(row.cost) || 0,
    price: parseFloat(row.price) || 0,
    category_id: row.category_id,
    category_name: row.category_name || null,
    category_color: row.category_color || null,
    active: row.active,
    days_of_stock: stock > 0 ? Math.min(999, Math.round(stock / 2)) : 0,
  };
}

// Fetch inventory products
export async function fetchInventory(filters?: {
  category_id?: string;
  status?: 'all' | 'low_stock' | 'out_of_stock' | 'normal' | 'overstock';
  search?: string;
}): Promise<InventoryProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        p.cost,
        p.price,
        p.category_id,
        p.active,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      ORDER BY p.name
    `;

    let products = results.map((row: any) => parseProduct(row));

    // Apply filters in JS
    if (filters?.category_id) {
      products = products.filter(p => p.category_id === filters.category_id);
    }

    if (filters?.status === 'low_stock') {
      products = products.filter(p => p.stock > 0 && p.stock <= p.min_stock);
    } else if (filters?.status === 'out_of_stock') {
      products = products.filter(p => p.stock === 0);
    } else if (filters?.status === 'normal') {
      products = products.filter(p => p.stock > p.min_stock && p.stock <= p.max_stock);
    } else if (filters?.status === 'overstock') {
      products = products.filter(p => p.stock > p.max_stock);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(search));
    }

    return products;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}

// Adjust stock with tracking
export async function adjustStock(productId: string, adjustment: {
  type: 'entrada' | 'salida' | 'ajuste' | 'merma' | 'devolucion';
  quantity: number;
  reason?: string;
}): Promise<InventoryProduct> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Get current stock
    const current = await sql`SELECT stock FROM products WHERE id = ${productId}`;
    const previousStock = parseInt(current[0]?.stock) || 0;

    let newStock: number;
    // Map type for stock movement table compatibility
    let movementType: string;

    if (['entrada', 'devolucion'].includes(adjustment.type)) {
      newStock = previousStock + adjustment.quantity;
      movementType = 'add';
    } else {
      newStock = Math.max(0, previousStock - adjustment.quantity);
      movementType = 'subtract';
    }

    // Update product stock
    const results = await sql`
      UPDATE products
      SET stock = ${newStock}, updated_at = NOW()
      WHERE id = ${productId}
      RETURNING *
    `;

    // Record stock movement
    await sql`
      INSERT INTO stock_movements (product_id, type, quantity, reason)
      VALUES (${productId}, ${movementType}, ${adjustment.quantity}, ${adjustment.reason || null})
    `;

    // Get category info
    const product = results[0];
    const category = await sql`SELECT name, color FROM categories WHERE id = ${product.category_id}`;

    return parseProduct({
      ...product,
      category_name: category[0]?.name || null,
      category_color: category[0]?.color || null,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }
}

// Get stock movements history
export async function getStockMovements(params?: {
  product_id?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ movements: StockMovement[]; total: number }> {
  if (!sql) return { movements: [], total: 0 };

  try {
    const limit = params?.limit || 50;
    const offset = params?.offset || 0;

    // Count total
    let countResult;
    if (params?.product_id) {
      countResult = await sql`SELECT COUNT(*) as total FROM stock_movements WHERE product_id = ${params.product_id}`;
    } else if (params?.type) {
      const mappedType = params.type === 'entrada' ? 'add' : params.type === 'salida' ? 'subtract' : params.type;
      countResult = await sql`SELECT COUNT(*) as total FROM stock_movements WHERE type = ${mappedType}`;
    } else {
      countResult = await sql`SELECT COUNT(*) as total FROM stock_movements`;
    }

    // Get movements
    let results;
    if (params?.product_id) {
      results = await sql`
        SELECT
          sm.id,
          sm.product_id,
          p.name as product_name,
          sm.type,
          sm.quantity,
          sm.reason,
          sm.created_at
        FROM stock_movements sm
        LEFT JOIN products p ON p.id = sm.product_id
        WHERE sm.product_id = ${params.product_id}
        ORDER BY sm.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (params?.type) {
      const mappedType = params.type === 'entrada' ? 'add' : params.type === 'salida' ? 'subtract' : params.type;
      results = await sql`
        SELECT
          sm.id,
          sm.product_id,
          p.name as product_name,
          sm.type,
          sm.quantity,
          sm.reason,
          sm.created_at
        FROM stock_movements sm
        LEFT JOIN products p ON p.id = sm.product_id
        WHERE sm.type = ${mappedType}
        ORDER BY sm.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      results = await sql`
        SELECT
          sm.id,
          sm.product_id,
          p.name as product_name,
          sm.type,
          sm.quantity,
          sm.reason,
          sm.created_at
        FROM stock_movements sm
        LEFT JOIN products p ON p.id = sm.product_id
        ORDER BY sm.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return {
      movements: results.map((row: any) => ({
        ...row,
        quantity: parseInt(row.quantity) || 0,
        previous_stock: 0,
        new_stock: 0,
        // Map type for display
        type: row.type === 'add' ? 'entrada' : row.type === 'subtract' ? 'salida' : row.type,
      })),
      total: parseInt(countResult[0]?.total) || 0,
    };
  } catch (error) {
    console.error('Error getting stock movements:', error);
    return { movements: [], total: 0 };
  }
}

// Get inventory stats
export async function getInventoryStats(): Promise<InventoryStats> {
  if (!sql) return {
    totalStock: 0, totalValue: 0, totalCost: 0, potentialProfit: 0,
    lowStockCount: 0, outOfStockCount: 0, overstockCount: 0,
    totalProducts: 0, activeProducts: 0, categoriesCount: 0,
    avgTurnoverDays: 0, topMovingProducts: 0,
  };

  try {
    const results = await sql`
      SELECT
        COALESCE(SUM(stock), 0) as total_stock,
        COALESCE(SUM(stock * price), 0) as total_value,
        COALESCE(SUM(stock * cost), 0) as total_cost,
        COALESCE(SUM(stock * (price - cost)), 0) as potential_profit,
        COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0) as low_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE stock > min_stock * 10) as overstock,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE active = true) as active_products,
        COUNT(DISTINCT category_id) as categories_count
      FROM products
      WHERE active = true
    `;

    return {
      totalStock: parseInt(results[0].total_stock) || 0,
      totalValue: parseFloat(results[0].total_value) || 0,
      totalCost: parseFloat(results[0].total_cost) || 0,
      potentialProfit: parseFloat(results[0].potential_profit) || 0,
      lowStockCount: parseInt(results[0].low_stock) || 0,
      outOfStockCount: parseInt(results[0].out_of_stock) || 0,
      overstockCount: parseInt(results[0].overstock) || 0,
      totalProducts: parseInt(results[0].total_products) || 0,
      activeProducts: parseInt(results[0].active_products) || 0,
      categoriesCount: parseInt(results[0].categories_count) || 0,
      avgTurnoverDays: 30,
      topMovingProducts: 0,
    };
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    throw error;
  }
}

// Get inventory by category
export async function getInventoryByCategory(): Promise<CategoryInventory[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        COALESCE(c.id::text, 'uncategorized') as category_id,
        COALESCE(c.name, 'Sin Categoria') as category_name,
        COALESCE(c.color, '#6B7280') as category_color,
        COUNT(p.id) as products_count,
        COALESCE(SUM(p.stock), 0) as total_stock,
        COALESCE(SUM(p.stock * p.cost), 0) as total_value,
        COUNT(*) FILTER (WHERE p.stock <= p.min_stock) as low_stock_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      GROUP BY c.id, c.name, c.color
      ORDER BY total_value DESC
    `;

    return results.map((row: any) => ({
      ...row,
      products_count: parseInt(row.products_count) || 0,
      total_stock: parseInt(row.total_stock) || 0,
      total_value: parseFloat(row.total_value) || 0,
      low_stock_count: parseInt(row.low_stock_count) || 0,
    }));
  } catch (error) {
    console.error('Error getting inventory by category:', error);
    return [];
  }
}

// Get inventory alerts
export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name as product_name,
        p.stock,
        p.min_stock
      FROM products p
      WHERE p.active = true
        AND p.stock <= p.min_stock
      ORDER BY p.stock ASC
    `;

    return results.map((row: any, index: number) => {
      const stock = parseInt(row.stock) || 0;
      const minStock = parseInt(row.min_stock) || 5;

      let alertType: 'out_of_stock' | 'low_stock' = stock === 0 ? 'out_of_stock' : 'low_stock';
      let severity: 'critical' | 'high' | 'medium' | 'low';

      if (stock === 0) {
        severity = 'critical';
      } else if (stock <= minStock * 0.5) {
        severity = 'high';
      } else {
        severity = 'medium';
      }

      return {
        id: `alert-${index}`,
        product_id: row.id,
        product_name: row.product_name,
        alert_type: alertType,
        current_value: stock,
        threshold_value: minStock,
        severity: severity,
        created_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    return [];
  }
}

// Get low stock products
export async function getLowStockProducts(): Promise<InventoryProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        p.cost,
        p.price,
        p.category_id,
        p.active,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true AND p.stock <= p.min_stock
      ORDER BY p.stock ASC
    `;
    return results.map(parseProduct);
  } catch (error) {
    console.error('Error getting low stock products:', error);
    return [];
  }
}

// Update min stock level
export async function updateStockLevels(
  productId: string,
  levels: { min_stock?: number; max_stock?: number }
): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    if (levels.min_stock !== undefined) {
      await sql`
        UPDATE products
        SET min_stock = ${levels.min_stock}, updated_at = NOW()
        WHERE id = ${productId}
      `;
    }
  } catch (error) {
    console.error('Error updating stock levels:', error);
    throw error;
  }
}

// Get inventory valuation report
export async function getInventoryValuation(): Promise<{
  by_category: Array<{ category: string; cost: number; value: number; margin: number }>;
  total_cost: number;
  total_value: number;
  total_margin: number;
}> {
  if (!sql) return { by_category: [], total_cost: 0, total_value: 0, total_margin: 0 };

  try {
    const results = await sql`
      SELECT
        COALESCE(c.name, 'Sin Categoria') as category,
        COALESCE(SUM(p.stock * p.cost), 0) as cost,
        COALESCE(SUM(p.stock * p.price), 0) as value
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      GROUP BY c.name
      ORDER BY value DESC
    `;

    const by_category = results.map((row: any) => ({
      category: row.category,
      cost: parseFloat(row.cost) || 0,
      value: parseFloat(row.value) || 0,
      margin: parseFloat(row.value) - parseFloat(row.cost),
    }));

    const total_cost = by_category.reduce((sum, item) => sum + item.cost, 0);
    const total_value = by_category.reduce((sum, item) => sum + item.value, 0);

    return {
      by_category,
      total_cost,
      total_value,
      total_margin: total_value - total_cost,
    };
  } catch (error) {
    console.error('Error getting inventory valuation:', error);
    return { by_category: [], total_cost: 0, total_value: 0, total_margin: 0 };
  }
}
