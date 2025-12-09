import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBCashRegister {
  id: string;
  cashier_id: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
}

export interface DBCashMovement {
  id: string;
  cash_register_id: string;
  type: 'income' | 'expense' | 'sale' | 'adjustment';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface CashRegisterWithSales extends DBCashRegister {
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  sales_count: number;
}

// Helper to parse cash register
function parseCashRegister(row: any): DBCashRegister {
  return {
    ...row,
    opening_amount: parseFloat(row.opening_amount) || 0,
    closing_amount: row.closing_amount ? parseFloat(row.closing_amount) : null,
    expected_amount: row.expected_amount ? parseFloat(row.expected_amount) : null,
    difference: row.difference ? parseFloat(row.difference) : null,
  };
}

function parseCashMovement(row: any): DBCashMovement {
  return {
    ...row,
    amount: parseFloat(row.amount) || 0,
  };
}

// Get current open cash register
export async function getCurrentCashRegister(): Promise<CashRegisterWithSales | null> {
  if (!sql) return null;

  try {
    const results = await sql`
      SELECT * FROM cash_registers
      WHERE status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `;

    if (results.length === 0) return null;

    const register = parseCashRegister(results[0]);

    // Get sales for this register
    const salesStats = await sql`
      SELECT
        COUNT(*) as sales_count,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer_sales
      FROM sales
      WHERE created_at >= ${register.opened_at}
    `;

    return {
      ...register,
      total_sales: parseFloat(salesStats[0].total_sales) || 0,
      cash_sales: parseFloat(salesStats[0].cash_sales) || 0,
      card_sales: parseFloat(salesStats[0].card_sales) || 0,
      transfer_sales: parseFloat(salesStats[0].transfer_sales) || 0,
      sales_count: parseInt(salesStats[0].sales_count) || 0,
    };
  } catch (error) {
    console.error('Error getting current cash register:', error);
    throw error;
  }
}

// Open cash register
export async function openCashRegister(openingAmount: number, cashierId?: string): Promise<DBCashRegister> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Check if there's already an open register
    const existing = await sql`SELECT id FROM cash_registers WHERE status = 'open' LIMIT 1`;
    if (existing.length > 0) {
      throw new Error('Ya hay una caja abierta');
    }

    const results = await sql`
      INSERT INTO cash_registers (opening_amount, cashier_id, status, opened_at)
      VALUES (${openingAmount}, ${cashierId || null}, 'open', NOW())
      RETURNING *
    `;

    return parseCashRegister(results[0]);
  } catch (error) {
    console.error('Error opening cash register:', error);
    throw error;
  }
}

// Close cash register
export async function closeCashRegister(
  registerId: string,
  closingAmount: number,
  expectedAmount: number,
  notes?: string
): Promise<DBCashRegister> {
  if (!sql) throw new Error('Database not configured');

  try {
    const difference = closingAmount - expectedAmount;

    const results = await sql`
      UPDATE cash_registers
      SET
        closing_amount = ${closingAmount},
        expected_amount = ${expectedAmount},
        difference = ${difference},
        status = 'closed',
        notes = ${notes || null},
        closed_at = NOW()
      WHERE id = ${registerId}
      RETURNING *
    `;

    return parseCashRegister(results[0]);
  } catch (error) {
    console.error('Error closing cash register:', error);
    throw error;
  }
}

// Get cash register history
export async function getCashRegisterHistory(limit = 30): Promise<CashRegisterWithSales[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        cr.*,
        COALESCE((
          SELECT COUNT(*) FROM sales s
          WHERE s.created_at >= cr.opened_at
          AND (cr.closed_at IS NULL OR s.created_at <= cr.closed_at)
        ), 0) as sales_count,
        COALESCE((
          SELECT SUM(total) FROM sales s
          WHERE s.created_at >= cr.opened_at
          AND (cr.closed_at IS NULL OR s.created_at <= cr.closed_at)
        ), 0) as total_sales,
        COALESCE((
          SELECT SUM(total) FROM sales s
          WHERE s.created_at >= cr.opened_at
          AND (cr.closed_at IS NULL OR s.created_at <= cr.closed_at)
          AND s.payment_method = 'cash'
        ), 0) as cash_sales,
        COALESCE((
          SELECT SUM(total) FROM sales s
          WHERE s.created_at >= cr.opened_at
          AND (cr.closed_at IS NULL OR s.created_at <= cr.closed_at)
          AND s.payment_method = 'card'
        ), 0) as card_sales,
        COALESCE((
          SELECT SUM(total) FROM sales s
          WHERE s.created_at >= cr.opened_at
          AND (cr.closed_at IS NULL OR s.created_at <= cr.closed_at)
          AND s.payment_method = 'transfer'
        ), 0) as transfer_sales
      FROM cash_registers cr
      ORDER BY cr.opened_at DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      ...parseCashRegister(row),
      total_sales: parseFloat(row.total_sales) || 0,
      cash_sales: parseFloat(row.cash_sales) || 0,
      card_sales: parseFloat(row.card_sales) || 0,
      transfer_sales: parseFloat(row.transfer_sales) || 0,
      sales_count: parseInt(row.sales_count) || 0,
    }));
  } catch (error) {
    console.error('Error getting cash register history:', error);
    throw error;
  }
}

// Add cash movement
export async function addCashMovement(movement: {
  cash_register_id: string;
  type: 'income' | 'expense' | 'adjustment';
  amount: number;
  description?: string;
}): Promise<DBCashMovement> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      INSERT INTO cash_movements (cash_register_id, type, amount, description)
      VALUES (${movement.cash_register_id}, ${movement.type}, ${movement.amount}, ${movement.description || null})
      RETURNING *
    `;

    return parseCashMovement(results[0]);
  } catch (error) {
    console.error('Error adding cash movement:', error);
    throw error;
  }
}

// Get movements for a cash register
export async function getCashMovements(registerId: string): Promise<DBCashMovement[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT * FROM cash_movements
      WHERE cash_register_id = ${registerId}
      ORDER BY created_at DESC
    `;

    return results.map(parseCashMovement);
  } catch (error) {
    console.error('Error getting cash movements:', error);
    throw error;
  }
}

// Get today's sales for current register
export async function getTodaySales(openedAt: string): Promise<any[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      WHERE s.created_at >= ${openedAt}
      ORDER BY s.created_at DESC
    `;

    return results.map((row: any) => ({
      ...row,
      total: parseFloat(row.total) || 0,
      items_count: parseInt(row.items_count) || 0,
    }));
  } catch (error) {
    console.error('Error getting today sales:', error);
    throw error;
  }
}

// Get cash register stats
export async function getCashRegisterStats(): Promise<{
  totalRegisters: number;
  totalSales: number;
  averageDifference: number;
  registersWithSurplus: number;
  registersWithShortage: number;
}> {
  if (!sql) {
    return {
      totalRegisters: 0,
      totalSales: 0,
      averageDifference: 0,
      registersWithSurplus: 0,
      registersWithShortage: 0,
    };
  }

  try {
    const results = await sql`
      SELECT
        COUNT(*) as total_registers,
        COALESCE(SUM(closing_amount), 0) as total_sales,
        COALESCE(AVG(difference), 0) as avg_difference,
        COUNT(*) FILTER (WHERE difference > 0) as surplus_count,
        COUNT(*) FILTER (WHERE difference < 0) as shortage_count
      FROM cash_registers
      WHERE status = 'closed'
    `;

    return {
      totalRegisters: parseInt(results[0].total_registers) || 0,
      totalSales: parseFloat(results[0].total_sales) || 0,
      averageDifference: parseFloat(results[0].avg_difference) || 0,
      registersWithSurplus: parseInt(results[0].surplus_count) || 0,
      registersWithShortage: parseInt(results[0].shortage_count) || 0,
    };
  } catch (error) {
    console.error('Error getting cash register stats:', error);
    throw error;
  }
}
