import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBSale {
  id: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  payment_method: string;
  cashier_id: string | null;
  cash_register_id: string | null;
  customer_name: string | null;
  customer_id: string | null;
  notes: string | null;
  receipt_number: string;
  created_at: string;
}

export interface DBSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
}

export interface SaleWithItems extends DBSale {
  items: (DBSaleItem & { product_name?: string })[];
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount?: number;
}

// ==================== HELD ORDERS (In-Memory for demo) ====================

export interface HeldOrder {
  id: string;
  name: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  customerName?: string;
  notes?: string;
  createdAt: Date;
}

// In-memory storage for held orders (in production, use database)
let heldOrders: HeldOrder[] = [];

export function holdOrder(order: Omit<HeldOrder, 'id' | 'createdAt'>): HeldOrder {
  const newOrder: HeldOrder = {
    ...order,
    id: `hold-${Date.now()}`,
    createdAt: new Date(),
  };
  heldOrders.push(newOrder);
  return newOrder;
}

export function getHeldOrders(): HeldOrder[] {
  return [...heldOrders];
}

export function retrieveHeldOrder(id: string): HeldOrder | null {
  const index = heldOrders.findIndex(o => o.id === id);
  if (index === -1) return null;
  const [order] = heldOrders.splice(index, 1);
  return order;
}

export function deleteHeldOrder(id: string): boolean {
  const index = heldOrders.findIndex(o => o.id === id);
  if (index === -1) return false;
  heldOrders.splice(index, 1);
  return true;
}

// ==================== RECEIPT NUMBER GENERATION ====================

export async function generateReceiptNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  if (!sql) {
    return `${datePrefix}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  }

  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM sales
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const count = parseInt(result[0].count) + 1;
    return `${datePrefix}-${String(count).padStart(4, '0')}`;
  } catch {
    return `${datePrefix}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  }
}

export async function createSale(sale: {
  total: number;
  subtotal?: number;
  discount_amount?: number;
  discount_percent?: number;
  tax_amount?: number;
  payment_method: string;
  cashier_id?: string;
  cash_register_id?: string;
  customer_name?: string;
  customer_id?: string;
  notes?: string;
  items: CartItem[];
}): Promise<DBSale> {
  if (!sql) throw new Error('Database not configured');

  try {
    const receiptNumber = await generateReceiptNumber();

    // Create the sale with extended fields
    const saleResults = await sql`
      INSERT INTO sales (total, payment_method, cashier_id, cash_register_id)
      VALUES (
        ${sale.total},
        ${sale.payment_method},
        ${sale.cashier_id || null},
        ${sale.cash_register_id || null}
      )
      RETURNING *
    `;

    const newSale = saleResults[0] as DBSale;
    // Add receipt number to response
    (newSale as any).receipt_number = receiptNumber;

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

// ==================== SESSION STATS ====================

export interface SessionStats {
  salesCount: number;
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
  avgTicket: number;
  lastSaleTime: string | null;
}

export async function getSessionStats(): Promise<SessionStats> {
  if (!sql) {
    return {
      salesCount: 0,
      totalAmount: 0,
      cashAmount: 0,
      cardAmount: 0,
      transferAmount: 0,
      avgTicket: 0,
      lastSaleTime: null,
    };
  }

  try {
    const results = await sql`
      SELECT
        COUNT(*) as sales_count,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'cash'), 0) as cash_amount,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'card'), 0) as card_amount,
        COALESCE(SUM(total) FILTER (WHERE payment_method = 'transfer'), 0) as transfer_amount,
        COALESCE(AVG(total), 0) as avg_ticket,
        MAX(created_at) as last_sale_time
      FROM sales
      WHERE created_at >= CURRENT_DATE
    `;

    return {
      salesCount: parseInt(results[0].sales_count),
      totalAmount: parseFloat(results[0].total_amount),
      cashAmount: parseFloat(results[0].cash_amount),
      cardAmount: parseFloat(results[0].card_amount),
      transferAmount: parseFloat(results[0].transfer_amount),
      avgTicket: parseFloat(results[0].avg_ticket),
      lastSaleTime: results[0].last_sale_time,
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return {
      salesCount: 0,
      totalAmount: 0,
      cashAmount: 0,
      cardAmount: 0,
      transferAmount: 0,
      avgTicket: 0,
      lastSaleTime: null,
    };
  }
}

// ==================== RECENT SALES ====================

export async function getRecentSales(limit = 10): Promise<(DBSale & { items_count: number })[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT s.*,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      WHERE s.created_at >= CURRENT_DATE
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;
    return results as (DBSale & { items_count: number })[];
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}
