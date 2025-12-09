import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayProfit: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  openCashRegister: boolean;
  cashInRegister: number;
}

export interface SalesComparison {
  todaySales: number;
  yesterdaySales: number;
  todayTransactions: number;
  yesterdayTransactions: number;
  weekSales: number;
  lastWeekSales: number;
  monthSales: number;
  lastMonthSales: number;
}

export interface WeeklySalesData {
  day: string;
  dayName: string;
  sales: number;
  transactions: number;
  profit: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity_sold: number;
  total_revenue: number;
  category_name: string | null;
  category_color: string | null;
}

export interface CategorySales {
  category_id: string | null;
  category_name: string;
  category_color: string;
  total_sales: number;
  percentage: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  category_name: string | null;
}

export interface RecentSale {
  id: string;
  total: number;
  payment_method: string;
  items_count: number;
  created_at: string;
}

export interface HourlySales {
  hour: number;
  sales: number;
  transactions: number;
}

export interface PaymentMethodStats {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

// Get dashboard main stats
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!sql) {
    return {
      todaySales: 0,
      todayTransactions: 0,
      todayProfit: 0,
      activeProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      openCashRegister: false,
      cashInRegister: 0,
    };
  }

  try {
    // Get today's sales stats
    const salesStats = await sql`
      SELECT
        COALESCE(SUM(s.total), 0) as today_sales,
        COUNT(s.id) as today_transactions,
        COALESCE(SUM(
          (SELECT SUM((si.unit_price - p.cost) * si.quantity)
           FROM sale_items si
           JOIN products p ON p.id = si.product_id
           WHERE si.sale_id = s.id)
        ), 0) as today_profit
      FROM sales s
      WHERE DATE(s.created_at) = CURRENT_DATE
    `;

    // Get product stats
    const productStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE active = true) as active_products,
        COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0) as low_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock
      FROM products
    `;

    // Get cash register status
    const cashRegister = await sql`
      SELECT
        opening_amount,
        COALESCE((
          SELECT SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END)
          FROM sales WHERE created_at >= cr.opened_at
        ), 0) as cash_sales,
        COALESCE((
          SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
          FROM cash_movements WHERE cash_register_id = cr.id
        ), 0) as movements_total
      FROM cash_registers cr
      WHERE status = 'open'
      LIMIT 1
    `;

    const hasOpenRegister = cashRegister.length > 0;
    const cashInRegister = hasOpenRegister
      ? parseFloat(cashRegister[0].opening_amount) +
        parseFloat(cashRegister[0].cash_sales) +
        parseFloat(cashRegister[0].movements_total)
      : 0;

    return {
      todaySales: parseFloat(salesStats[0].today_sales) || 0,
      todayTransactions: parseInt(salesStats[0].today_transactions) || 0,
      todayProfit: parseFloat(salesStats[0].today_profit) || 0,
      activeProducts: parseInt(productStats[0].active_products) || 0,
      lowStockCount: parseInt(productStats[0].low_stock) || 0,
      outOfStockCount: parseInt(productStats[0].out_of_stock) || 0,
      openCashRegister: hasOpenRegister,
      cashInRegister,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

// Get sales comparison (today vs yesterday, this week vs last week, etc.)
export async function getSalesComparison(): Promise<SalesComparison> {
  if (!sql) {
    return {
      todaySales: 0,
      yesterdaySales: 0,
      todayTransactions: 0,
      yesterdayTransactions: 0,
      weekSales: 0,
      lastWeekSales: 0,
      monthSales: 0,
      lastMonthSales: 0,
    };
  }

  try {
    const results = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total ELSE 0 END), 0) as today_sales,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - 1 THEN total ELSE 0 END), 0) as yesterday_sales,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_transactions,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - 1 THEN 1 END) as yesterday_transactions,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN total ELSE 0 END), 0) as week_sales,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
                         AND created_at < DATE_TRUNC('week', CURRENT_DATE) THEN total ELSE 0 END), 0) as last_week_sales,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0) as month_sales,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                         AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0) as last_month_sales
      FROM sales
    `;

    return {
      todaySales: parseFloat(results[0].today_sales) || 0,
      yesterdaySales: parseFloat(results[0].yesterday_sales) || 0,
      todayTransactions: parseInt(results[0].today_transactions) || 0,
      yesterdayTransactions: parseInt(results[0].yesterday_transactions) || 0,
      weekSales: parseFloat(results[0].week_sales) || 0,
      lastWeekSales: parseFloat(results[0].last_week_sales) || 0,
      monthSales: parseFloat(results[0].month_sales) || 0,
      lastMonthSales: parseFloat(results[0].last_month_sales) || 0,
    };
  } catch (error) {
    console.error('Error getting sales comparison:', error);
    throw error;
  }
}

// Get weekly sales data for chart
export async function getWeeklySalesData(): Promise<WeeklySalesData[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as day
      )
      SELECT
        d.day::text,
        TO_CHAR(d.day, 'Dy') as day_name,
        COALESCE(SUM(s.total), 0) as sales,
        COUNT(s.id) as transactions,
        COALESCE(SUM(
          (SELECT SUM((si.unit_price - p.cost) * si.quantity)
           FROM sale_items si
           JOIN products p ON p.id = si.product_id
           WHERE si.sale_id = s.id)
        ), 0) as profit
      FROM days d
      LEFT JOIN sales s ON DATE(s.created_at) = d.day
      GROUP BY d.day
      ORDER BY d.day
    `;

    const dayNames: Record<string, string> = {
      'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue',
      'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'
    };

    return results.map((row: any) => ({
      day: row.day,
      dayName: dayNames[row.day_name] || row.day_name,
      sales: parseFloat(row.sales) || 0,
      transactions: parseInt(row.transactions) || 0,
      profit: parseFloat(row.profit) || 0,
    }));
  } catch (error) {
    console.error('Error getting weekly sales data:', error);
    throw error;
  }
}

// Get top selling products
export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(SUM(si.quantity * si.unit_price), 0) as total_revenue,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id AND s.created_at >= CURRENT_DATE - INTERVAL '7 days'
      LEFT JOIN categories c ON c.id = p.category_id
      GROUP BY p.id, p.name, c.name, c.color
      HAVING COALESCE(SUM(si.quantity), 0) > 0
      ORDER BY quantity_sold DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      quantity_sold: parseInt(row.quantity_sold) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      category_name: row.category_name,
      category_color: row.category_color,
    }));
  } catch (error) {
    console.error('Error getting top products:', error);
    throw error;
  }
}

// Get sales by category
export async function getCategorySales(): Promise<CategorySales[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH category_totals AS (
        SELECT
          c.id as category_id,
          COALESCE(c.name, 'Sin categoría') as category_name,
          COALESCE(c.color, '#6B7280') as category_color,
          COALESCE(SUM(si.quantity * si.unit_price), 0) as total_sales
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        LEFT JOIN sale_items si ON si.product_id = p.id
        LEFT JOIN sales s ON s.id = si.sale_id AND s.created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY c.id, c.name, c.color
        HAVING COALESCE(SUM(si.quantity * si.unit_price), 0) > 0
      ),
      total AS (
        SELECT COALESCE(SUM(total_sales), 1) as grand_total FROM category_totals
      )
      SELECT
        ct.category_id,
        ct.category_name,
        ct.category_color,
        ct.total_sales,
        ROUND((ct.total_sales / t.grand_total * 100)::numeric, 1) as percentage
      FROM category_totals ct, total t
      ORDER BY ct.total_sales DESC
    `;

    return results.map((row: any) => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_color: row.category_color,
      total_sales: parseFloat(row.total_sales) || 0,
      percentage: parseFloat(row.percentage) || 0,
    }));
  } catch (error) {
    console.error('Error getting category sales:', error);
    throw error;
  }
}

// Get low stock products
export async function getLowStockProducts(limit = 10): Promise<LowStockProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.stock <= p.min_stock AND p.active = true
      ORDER BY (p.stock::float / NULLIF(p.min_stock, 0)) ASC, p.stock ASC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      stock: parseInt(row.stock) || 0,
      min_stock: parseInt(row.min_stock) || 0,
      category_name: row.category_name,
    }));
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
}

// Get recent sales
export async function getRecentSales(limit = 10): Promise<RecentSale[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.id,
        s.total,
        s.payment_method,
        s.created_at,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      id: row.id,
      total: parseFloat(row.total) || 0,
      payment_method: row.payment_method,
      items_count: parseInt(row.items_count) || 0,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Error getting recent sales:', error);
    throw error;
  }
}

// Get hourly sales for today
export async function getHourlySales(): Promise<HourlySales[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      )
      SELECT
        h.hour,
        COALESCE(SUM(s.total), 0) as sales,
        COUNT(s.id) as transactions
      FROM hours h
      LEFT JOIN sales s ON EXTRACT(HOUR FROM s.created_at) = h.hour
        AND DATE(s.created_at) = CURRENT_DATE
      GROUP BY h.hour
      ORDER BY h.hour
    `;

    return results.map((row: any) => ({
      hour: parseInt(row.hour),
      sales: parseFloat(row.sales) || 0,
      transactions: parseInt(row.transactions) || 0,
    }));
  } catch (error) {
    console.error('Error getting hourly sales:', error);
    throw error;
  }
}

// Get payment method statistics
export async function getPaymentMethodStats(): Promise<PaymentMethodStats[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH totals AS (
        SELECT
          payment_method as method,
          SUM(total) as total,
          COUNT(*) as count
        FROM sales
        WHERE DATE(created_at) = CURRENT_DATE
        GROUP BY payment_method
      ),
      grand_total AS (
        SELECT COALESCE(SUM(total), 1) as gt FROM totals
      )
      SELECT
        t.method,
        t.total,
        t.count,
        ROUND((t.total / gt.gt * 100)::numeric, 1) as percentage
      FROM totals t, grand_total gt
      ORDER BY t.total DESC
    `;

    return results.map((row: any) => ({
      method: row.method,
      total: parseFloat(row.total) || 0,
      count: parseInt(row.count) || 0,
      percentage: parseFloat(row.percentage) || 0,
    }));
  } catch (error) {
    console.error('Error getting payment method stats:', error);
    throw error;
  }
}

// Get inventory value
export async function getInventoryValue(): Promise<{ totalValue: number; totalCost: number; potentialProfit: number }> {
  if (!sql) {
    return { totalValue: 0, totalCost: 0, potentialProfit: 0 };
  }

  try {
    const results = await sql`
      SELECT
        COALESCE(SUM(price * stock), 0) as total_value,
        COALESCE(SUM(cost * stock), 0) as total_cost,
        COALESCE(SUM((price - cost) * stock), 0) as potential_profit
      FROM products
      WHERE active = true
    `;

    return {
      totalValue: parseFloat(results[0].total_value) || 0,
      totalCost: parseFloat(results[0].total_cost) || 0,
      potentialProfit: parseFloat(results[0].potential_profit) || 0,
    };
  } catch (error) {
    console.error('Error getting inventory value:', error);
    throw error;
  }
}
