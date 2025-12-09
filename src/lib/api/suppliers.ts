import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBSupplier {
  id: string;
  name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_name: string | null;
  notes: string | null;
  active: boolean;
  total_purchases: number;
  total_amount: number;
  last_purchase: string | null;
  products_count: number;
}

export interface SupplierPurchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total: number;
  status: string;
  items_count: number;
  created_at: string;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  totalPurchases: number;
  totalAmount: number;
  avgPurchaseAmount: number;
  topSupplier: string | null;
  purchasesThisMonth: number;
}

// Fetch all suppliers with stats
export async function fetchSuppliers(): Promise<DBSupplier[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.id,
        s.name,
        s.ruc,
        s.phone,
        s.email,
        s.address,
        s.active,
        COALESCE(purchase_stats.total_purchases, 0) as total_purchases,
        COALESCE(purchase_stats.total_amount, 0) as total_amount,
        purchase_stats.last_purchase
      FROM suppliers s
      LEFT JOIN (
        SELECT
          supplier_id,
          COUNT(*) as total_purchases,
          COALESCE(SUM(total), 0) as total_amount,
          MAX(created_at) as last_purchase
        FROM purchases
        GROUP BY supplier_id
      ) purchase_stats ON purchase_stats.supplier_id = s.id
      ORDER BY s.name
    `;

    return results.map((row: any) => ({
      ...row,
      total_purchases: parseInt(row.total_purchases) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      products_count: 0,
    }));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
}

// Get single supplier with details
export async function getSupplierById(id: string): Promise<DBSupplier | null> {
  if (!sql) return null;

  try {
    const results = await sql`
      SELECT
        s.*,
        COALESCE(purchase_stats.total_purchases, 0) as total_purchases,
        COALESCE(purchase_stats.total_amount, 0) as total_amount,
        purchase_stats.last_purchase
      FROM suppliers s
      LEFT JOIN (
        SELECT
          supplier_id,
          COUNT(*) as total_purchases,
          COALESCE(SUM(total), 0) as total_amount,
          MAX(created_at) as last_purchase
        FROM purchases
        GROUP BY supplier_id
      ) purchase_stats ON purchase_stats.supplier_id = s.id
      WHERE s.id = ${id}
    `;

    if (results.length === 0) return null;

    return {
      ...results[0],
      total_purchases: parseInt(results[0].total_purchases) || 0,
      total_amount: parseFloat(results[0].total_amount) || 0,
      products_count: 0,
    } as DBSupplier;
  } catch (error) {
    console.error('Error fetching supplier:', error);
    throw error;
  }
}

// Create supplier
export async function createSupplier(supplier: {
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_name?: string;
  notes?: string;
}): Promise<DBSupplier> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      INSERT INTO suppliers (name, ruc, phone, email, address, active)
      VALUES (${supplier.name}, ${supplier.ruc || null}, ${supplier.phone || null}, ${supplier.email || null}, ${supplier.address || null}, true)
      RETURNING *
    `;
    return {
      ...results[0],
      total_purchases: 0,
      total_amount: 0,
      products_count: 0,
    } as DBSupplier;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
}

// Update supplier
export async function updateSupplier(id: string, supplier: Partial<{
  name: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  contact_name: string;
  notes: string;
  active: boolean;
}>): Promise<DBSupplier> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE suppliers
      SET
        name = COALESCE(${supplier.name}, name),
        ruc = COALESCE(${supplier.ruc}, ruc),
        phone = COALESCE(${supplier.phone}, phone),
        email = COALESCE(${supplier.email}, email),
        address = COALESCE(${supplier.address}, address),
        active = COALESCE(${supplier.active}, active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return {
      ...results[0],
      total_purchases: 0,
      total_amount: 0,
      products_count: 0,
    } as DBSupplier;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
}

// Delete supplier (soft delete - set inactive)
export async function deleteSupplier(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    await sql`UPDATE suppliers SET active = false, updated_at = NOW() WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
}

// Toggle supplier active status
export async function toggleSupplierStatus(id: string): Promise<DBSupplier> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE suppliers
      SET active = NOT active, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return {
      ...results[0],
      total_purchases: 0,
      total_amount: 0,
      products_count: 0,
    } as DBSupplier;
  } catch (error) {
    console.error('Error toggling supplier status:', error);
    throw error;
  }
}

// Get supplier stats
export async function getSupplierStats(): Promise<SupplierStats> {
  if (!sql) return {
    total: 0, active: 0, inactive: 0, totalPurchases: 0,
    totalAmount: 0, avgPurchaseAmount: 0, topSupplier: null, purchasesThisMonth: 0
  };

  try {
    const supplierCounts = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true) as active,
        COUNT(*) FILTER (WHERE active = false) as inactive
      FROM suppliers
    `;

    const purchaseStats = await sql`
      SELECT
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(AVG(total), 0) as avg_amount,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month
      FROM purchases
    `;

    const topSupplier = await sql`
      SELECT s.name
      FROM suppliers s
      JOIN purchases p ON p.supplier_id = s.id
      GROUP BY s.id, s.name
      ORDER BY SUM(p.total) DESC
      LIMIT 1
    `;

    return {
      total: parseInt(supplierCounts[0].total) || 0,
      active: parseInt(supplierCounts[0].active) || 0,
      inactive: parseInt(supplierCounts[0].inactive) || 0,
      totalPurchases: parseInt(purchaseStats[0].total_purchases) || 0,
      totalAmount: parseFloat(purchaseStats[0].total_amount) || 0,
      avgPurchaseAmount: parseFloat(purchaseStats[0].avg_amount) || 0,
      topSupplier: topSupplier[0]?.name || null,
      purchasesThisMonth: parseInt(purchaseStats[0].this_month) || 0,
    };
  } catch (error) {
    console.error('Error getting supplier stats:', error);
    return {
      total: 0, active: 0, inactive: 0, totalPurchases: 0,
      totalAmount: 0, avgPurchaseAmount: 0, topSupplier: null, purchasesThisMonth: 0
    };
  }
}

// Get purchases by supplier
export async function getSupplierPurchases(supplierId?: string, limit = 50): Promise<SupplierPurchase[]> {
  if (!sql) return [];

  try {
    let results;
    if (supplierId) {
      results = await sql`
        SELECT
          p.id,
          p.supplier_id,
          s.name as supplier_name,
          p.total,
          p.status,
          p.created_at,
          COALESCE(items.count, 0) as items_count
        FROM purchases p
        LEFT JOIN suppliers s ON s.id = p.supplier_id
        LEFT JOIN (
          SELECT purchase_id, COUNT(*) as count
          FROM purchase_items
          GROUP BY purchase_id
        ) items ON items.purchase_id = p.id
        WHERE p.supplier_id = ${supplierId}
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      results = await sql`
        SELECT
          p.id,
          p.supplier_id,
          s.name as supplier_name,
          p.total,
          p.status,
          p.created_at,
          COALESCE(items.count, 0) as items_count
        FROM purchases p
        LEFT JOIN suppliers s ON s.id = p.supplier_id
        LEFT JOIN (
          SELECT purchase_id, COUNT(*) as count
          FROM purchase_items
          GROUP BY purchase_id
        ) items ON items.purchase_id = p.id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;
    }

    return results.map((row: any) => ({
      ...row,
      total: parseFloat(row.total) || 0,
      items_count: parseInt(row.items_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching supplier purchases:', error);
    return [];
  }
}

// Get top suppliers by purchases
export async function getTopSuppliers(limit = 5): Promise<Array<{
  id: string;
  name: string;
  total_purchases: number;
  total_amount: number;
}>> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.id,
        s.name,
        COUNT(p.id) as total_purchases,
        COALESCE(SUM(p.total), 0) as total_amount
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id
      WHERE s.active = true
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      total_purchases: parseInt(row.total_purchases) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
    }));
  } catch (error) {
    console.error('Error fetching top suppliers:', error);
    return [];
  }
}
