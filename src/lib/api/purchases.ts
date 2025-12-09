import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBPurchase {
  id: string;
  supplier_id: string;
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBPurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

export interface PurchaseWithDetails extends DBPurchase {
  supplier_name: string;
  supplier_ruc: string | null;
  items_count: number;
  items: DBPurchaseItem[];
}

export interface PurchaseStats {
  total: number;
  pending: number;
  received: number;
  cancelled: number;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  avgOrderValue: number;
  thisMonthOrders: number;
  thisMonthAmount: number;
  lastMonthOrders: number;
  lastMonthAmount: number;
  growthPercent: number;
}

export interface PurchasesBySupplier {
  supplier_id: string;
  supplier_name: string;
  orders_count: number;
  total_amount: number;
  avg_order_value: number;
  last_purchase: string | null;
}

export interface PurchasesByMonth {
  month: string;
  orders_count: number;
  total_amount: number;
}

export interface PurchaseFilters {
  status?: 'all' | 'pending' | 'received' | 'cancelled';
  supplier_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

function parsePurchase(row: any): PurchaseWithDetails {
  return {
    ...row,
    total: parseFloat(row.total) || 0,
    items_count: parseInt(row.items_count) || 0,
    items: row.items || [],
  };
}

// Fetch all purchases with filters
export async function fetchPurchases(filters?: PurchaseFilters): Promise<PurchaseWithDetails[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.*,
        s.name as supplier_name,
        s.ruc as supplier_ruc,
        (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as items_count
      FROM purchases p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      ORDER BY p.created_at DESC
    `;

    let purchases = results.map(parsePurchase);

    // Apply filters in JS for flexibility
    if (filters?.status && filters.status !== 'all') {
      purchases = purchases.filter(p => p.status === filters.status);
    }

    if (filters?.supplier_id) {
      purchases = purchases.filter(p => p.supplier_id === filters.supplier_id);
    }

    if (filters?.date_from) {
      const fromDate = new Date(filters.date_from);
      purchases = purchases.filter(p => new Date(p.created_at) >= fromDate);
    }

    if (filters?.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999);
      purchases = purchases.filter(p => new Date(p.created_at) <= toDate);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      purchases = purchases.filter(p =>
        p.id.toLowerCase().includes(search) ||
        p.supplier_name?.toLowerCase().includes(search) ||
        p.notes?.toLowerCase().includes(search)
      );
    }

    return purchases;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
}

// Get single purchase with full details
export async function getPurchaseById(id: string): Promise<PurchaseWithDetails | null> {
  if (!sql) return null;

  try {
    const results = await sql`
      SELECT
        p.*,
        s.name as supplier_name,
        s.ruc as supplier_ruc,
        (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as items_count
      FROM purchases p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.id = ${id}
    `;

    if (results.length === 0) return null;

    const purchase = parsePurchase(results[0]);
    purchase.items = await getPurchaseItems(id);

    return purchase;
  } catch (error) {
    console.error('Error fetching purchase:', error);
    throw error;
  }
}

// Create purchase with items
export async function createPurchase(purchase: {
  supplier_id: string;
  items: { product_id: string; quantity: number; cost: number }[];
  notes?: string;
}): Promise<DBPurchase> {
  if (!sql) throw new Error('Database not configured');

  try {
    const total = purchase.items.reduce((acc, item) => acc + item.quantity * item.cost, 0);

    const purchaseResult = await sql`
      INSERT INTO purchases (supplier_id, total, status, notes)
      VALUES (${purchase.supplier_id}, ${total}, 'pending', ${purchase.notes || null})
      RETURNING *
    `;

    const purchaseId = purchaseResult[0].id;

    // Insert items
    for (const item of purchase.items) {
      await sql`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, cost)
        VALUES (${purchaseId}, ${item.product_id}, ${item.quantity}, ${item.cost})
      `;
    }

    return purchaseResult[0] as DBPurchase;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
}

// Update purchase
export async function updatePurchase(id: string, data: {
  notes?: string;
}): Promise<DBPurchase> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE purchases
      SET notes = COALESCE(${data.notes}, notes), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return results[0] as DBPurchase;
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
}

// Update purchase status
export async function updatePurchaseStatus(id: string, status: 'pending' | 'received' | 'cancelled'): Promise<DBPurchase> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE purchases
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return results[0] as DBPurchase;
  } catch (error) {
    console.error('Error updating purchase status:', error);
    throw error;
  }
}

// Receive purchase and update stock
export async function receivePurchase(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Get purchase items
    const items = await sql`
      SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ${id}
    `;

    // Update stock for each item
    for (const item of items) {
      await sql`
        UPDATE products
        SET stock = stock + ${item.quantity}, updated_at = NOW()
        WHERE id = ${item.product_id}
      `;

      // Record stock movement
      await sql`
        INSERT INTO stock_movements (product_id, type, quantity, reason)
        VALUES (${item.product_id}, 'add', ${item.quantity}, 'Compra recibida')
      `;
    }

    // Update purchase status
    await sql`
      UPDATE purchases SET status = 'received', updated_at = NOW() WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error receiving purchase:', error);
    throw error;
  }
}

// Delete purchase (only pending)
export async function deletePurchase(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Check if pending
    const check = await sql`SELECT status FROM purchases WHERE id = ${id}`;
    if (check[0]?.status !== 'pending') {
      throw new Error('Solo se pueden eliminar ordenes pendientes');
    }

    // Delete items first
    await sql`DELETE FROM purchase_items WHERE purchase_id = ${id}`;
    // Delete purchase
    await sql`DELETE FROM purchases WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
}

// Get purchase items
export async function getPurchaseItems(purchaseId: string): Promise<DBPurchaseItem[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        pi.id,
        pi.purchase_id,
        pi.product_id,
        p.name as product_name,
        pi.quantity,
        pi.cost,
        (pi.quantity * pi.cost) as subtotal
      FROM purchase_items pi
      LEFT JOIN products p ON p.id = pi.product_id
      WHERE pi.purchase_id = ${purchaseId}
      ORDER BY p.name
    `;
    return results.map((row: any) => ({
      ...row,
      quantity: parseInt(row.quantity) || 0,
      cost: parseFloat(row.cost) || 0,
      subtotal: parseFloat(row.subtotal) || 0,
    }));
  } catch (error) {
    console.error('Error getting purchase items:', error);
    throw error;
  }
}

// Get comprehensive purchase stats
export async function getPurchaseStats(): Promise<PurchaseStats> {
  if (!sql) return {
    total: 0, pending: 0, received: 0, cancelled: 0,
    totalAmount: 0, receivedAmount: 0, pendingAmount: 0,
    avgOrderValue: 0, thisMonthOrders: 0, thisMonthAmount: 0,
    lastMonthOrders: 0, lastMonthAmount: 0, growthPercent: 0,
  };

  try {
    // Basic stats
    const basicStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'received') as received,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'received'), 0) as received_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COALESCE(AVG(total) FILTER (WHERE status != 'cancelled'), 0) as avg_order_value
      FROM purchases
    `;

    // This month stats
    const thisMonthStats = await sql`
      SELECT
        COUNT(*) as orders,
        COALESCE(SUM(total), 0) as amount
      FROM purchases
      WHERE created_at >= DATE_TRUNC('month', NOW())
        AND status != 'cancelled'
    `;

    // Last month stats
    const lastMonthStats = await sql`
      SELECT
        COUNT(*) as orders,
        COALESCE(SUM(total), 0) as amount
      FROM purchases
      WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', NOW())
        AND status != 'cancelled'
    `;

    const thisMonthAmount = parseFloat(thisMonthStats[0].amount) || 0;
    const lastMonthAmount = parseFloat(lastMonthStats[0].amount) || 0;
    const growthPercent = lastMonthAmount > 0
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
      : thisMonthAmount > 0 ? 100 : 0;

    return {
      total: parseInt(basicStats[0].total) || 0,
      pending: parseInt(basicStats[0].pending) || 0,
      received: parseInt(basicStats[0].received) || 0,
      cancelled: parseInt(basicStats[0].cancelled) || 0,
      totalAmount: parseFloat(basicStats[0].total_amount) || 0,
      receivedAmount: parseFloat(basicStats[0].received_amount) || 0,
      pendingAmount: parseFloat(basicStats[0].pending_amount) || 0,
      avgOrderValue: parseFloat(basicStats[0].avg_order_value) || 0,
      thisMonthOrders: parseInt(thisMonthStats[0].orders) || 0,
      thisMonthAmount,
      lastMonthOrders: parseInt(lastMonthStats[0].orders) || 0,
      lastMonthAmount,
      growthPercent: Math.round(growthPercent * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting purchase stats:', error);
    return {
      total: 0, pending: 0, received: 0, cancelled: 0,
      totalAmount: 0, receivedAmount: 0, pendingAmount: 0,
      avgOrderValue: 0, thisMonthOrders: 0, thisMonthAmount: 0,
      lastMonthOrders: 0, lastMonthAmount: 0, growthPercent: 0,
    };
  }
}

// Get purchases grouped by supplier
export async function getPurchasesBySupplier(): Promise<PurchasesBySupplier[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(p.id) as orders_count,
        COALESCE(SUM(p.total), 0) as total_amount,
        COALESCE(AVG(p.total), 0) as avg_order_value,
        MAX(p.created_at) as last_purchase
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id AND p.status != 'cancelled'
      WHERE s.active = true
      GROUP BY s.id, s.name
      HAVING COUNT(p.id) > 0
      ORDER BY total_amount DESC
    `;

    return results.map((row: any) => ({
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      orders_count: parseInt(row.orders_count) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      avg_order_value: parseFloat(row.avg_order_value) || 0,
      last_purchase: row.last_purchase,
    }));
  } catch (error) {
    console.error('Error getting purchases by supplier:', error);
    return [];
  }
}

// Get purchases by month (last 12 months)
export async function getPurchasesByMonth(): Promise<PurchasesByMonth[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as orders_count,
        COALESCE(SUM(total), 0) as total_amount
      FROM purchases
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND status != 'cancelled'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    return results.map((row: any) => ({
      month: row.month,
      orders_count: parseInt(row.orders_count) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
    }));
  } catch (error) {
    console.error('Error getting purchases by month:', error);
    return [];
  }
}

// Get recent purchases
export async function getRecentPurchases(limit = 5): Promise<PurchaseWithDetails[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.*,
        s.name as supplier_name,
        s.ruc as supplier_ruc,
        (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as items_count
      FROM purchases p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;
    return results.map(parsePurchase);
  } catch (error) {
    console.error('Error getting recent purchases:', error);
    return [];
  }
}

// Get pending purchases count
export async function getPendingPurchasesCount(): Promise<number> {
  if (!sql) return 0;

  try {
    const results = await sql`
      SELECT COUNT(*) as count FROM purchases WHERE status = 'pending'
    `;
    return parseInt(results[0].count) || 0;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
}

// Get most purchased products
export async function getMostPurchasedProducts(limit = 10): Promise<Array<{
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_amount: number;
  orders_count: number;
}>> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        pi.product_id,
        pr.name as product_name,
        SUM(pi.quantity) as total_quantity,
        SUM(pi.quantity * pi.cost) as total_amount,
        COUNT(DISTINCT pi.purchase_id) as orders_count
      FROM purchase_items pi
      JOIN purchases p ON p.id = pi.purchase_id
      JOIN products pr ON pr.id = pi.product_id
      WHERE p.status != 'cancelled'
      GROUP BY pi.product_id, pr.name
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      total_quantity: parseInt(row.total_quantity) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      orders_count: parseInt(row.orders_count) || 0,
    }));
  } catch (error) {
    console.error('Error getting most purchased products:', error);
    return [];
  }
}
