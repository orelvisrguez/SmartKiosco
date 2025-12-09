import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBSale {
  id: string;
  total: number;
  payment_method: string;
  cashier_id: string | null;
  cash_register_id: string | null;
  created_at: string;
}

export interface DBSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleWithItems extends DBSale {
  items: DBSaleItem[];
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export async function createSale(sale: {
  total: number;
  payment_method: string;
  cashier_id?: string;
  cash_register_id?: string;
  items: CartItem[];
}): Promise<DBSale> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Create the sale
    const saleResults = await sql`
      INSERT INTO sales (total, payment_method, cashier_id, cash_register_id)
      VALUES (${sale.total}, ${sale.payment_method}, ${sale.cashier_id || null}, ${sale.cash_register_id || null})
      RETURNING *
    `;

    const newSale = saleResults[0] as DBSale;

    // Create sale items and update stock
    for (const item of sale.items) {
      await sql`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (${newSale.id}, ${item.productId}, ${item.quantity}, ${item.unitPrice}, ${item.subtotal})
      `;

      // Update product stock
      await sql`
        UPDATE products
        SET stock = GREATEST(0, stock - ${item.quantity}), updated_at = NOW()
        WHERE id = ${item.productId}
      `;
    }

    return newSale;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
}

export async function fetchSales(limit = 50): Promise<DBSale[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT * FROM sales
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return results as DBSale[];
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
}

export async function fetchSaleWithItems(saleId: string): Promise<SaleWithItems | null> {
  if (!sql) return null;

  try {
    const saleResults = await sql`SELECT * FROM sales WHERE id = ${saleId}`;
    if (saleResults.length === 0) return null;

    const itemResults = await sql`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ${saleId}
    `;

    return {
      ...saleResults[0],
      items: itemResults,
    } as SaleWithItems;
  } catch (error) {
    console.error('Error fetching sale with items:', error);
    throw error;
  }
}

export async function getSalesStats(): Promise<{
  todaySales: number;
  todayTotal: number;
  weekSales: number;
  weekTotal: number;
}> {
  if (!sql) {
    return { todaySales: 0, todayTotal: 0, weekSales: 0, weekTotal: 0 };
  }

  try {
    const results = await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_sales,
        COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_total,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_sales,
        COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as week_total
      FROM sales
    `;

    return {
      todaySales: parseInt(results[0].today_sales),
      todayTotal: parseFloat(results[0].today_total),
      weekSales: parseInt(results[0].week_sales),
      weekTotal: parseFloat(results[0].week_total),
    };
  } catch (error) {
    console.error('Error getting sales stats:', error);
    throw error;
  }
}
