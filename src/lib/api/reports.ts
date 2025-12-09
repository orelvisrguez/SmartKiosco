import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

// ==================== INTERFACES ====================

export type DateRangeType = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  type: DateRangeType;
  from?: string;
  to?: string;
}

export interface ReportStats {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalProductsSold: number;
  totalProfit: number;
  profitMargin: number;
}

export interface HourlySales {
  hour: string;
  sales: number;
  transactions: number;
  avgTicket: number;
}

export interface DailySales {
  date: string;
  dayName: string;
  sales: number;
  transactions: number;
  profit: number;
}

export interface WeeklyTrend {
  day: string;
  current: number;
  previous: number;
  change: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category_name: string | null;
  category_color: string | null;
  quantity_sold: number;
  revenue: number;
  profit: number;
  profit_margin: number;
  avg_price: number;
}

export interface CategoryReport {
  category_id: string;
  category_name: string;
  category_color: string | null;
  products_count: number;
  quantity_sold: number;
  revenue: number;
  profit: number;
  percentage: number;
}

export interface PaymentMethodReport {
  method: string;
  method_label: string;
  transactions: number;
  amount: number;
  percentage: number;
  avgTicket: number;
}

export interface InventoryReport {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstocked_count: number;
  categories_count: number;
  avg_stock_level: number;
  potential_revenue: number;
}

export interface InventoryProductReport {
  id: string;
  name: string;
  category_name: string | null;
  category_color: string | null;
  stock: number;
  min_stock: number;
  cost: number;
  price: number;
  stock_value: number;
  status: 'out_of_stock' | 'low_stock' | 'normal' | 'overstock';
  days_of_stock: number;
}

export interface SupplierReport {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_amount: number;
  orders_count: number;
  avg_order: number;
  last_purchase: string | null;
}

export interface FinancialReport {
  total_sales: number;
  total_cost: number;
  gross_profit: number;
  total_purchases: number;
  net_profit: number;
  profit_margin: number;
  expense_ratio: number;
  inventory_value: number;
}

export interface SalesDetailReport {
  id: string;
  date: string;
  total: number;
  items_count: number;
  payment_method: string;
  profit: number;
}

export interface ComparativeReport {
  current_period: {
    sales: number;
    transactions: number;
    profit: number;
    avgTicket: number;
  };
  previous_period: {
    sales: number;
    transactions: number;
    profit: number;
    avgTicket: number;
  };
  changes: {
    sales: number;
    transactions: number;
    profit: number;
    avgTicket: number;
  };
}

// ==================== HELPER FUNCTIONS ====================

function parseNumber(value: any, fallback = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

function parseInt2(value: any, fallback = 0): number {
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
}

// ==================== SALES REPORTS ====================

export async function getReportStats(dateRange: DateRangeType = 'today'): Promise<ReportStats> {
  if (!sql) return { totalSales: 0, totalTransactions: 0, averageTicket: 0, totalProductsSold: 0, totalProfit: 0, profitMargin: 0 };

  try {
    const dateFilter = dateRange === 'today' ? sql`DATE(s.created_at) = CURRENT_DATE` :
                       dateRange === 'yesterday' ? sql`DATE(s.created_at) = CURRENT_DATE - 1` :
                       dateRange === 'week' ? sql`s.created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
                       dateRange === 'month' ? sql`s.created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
                       dateRange === 'quarter' ? sql`s.created_at >= DATE_TRUNC('quarter', CURRENT_DATE)` :
                       sql`s.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;

    const results = await sql`
      SELECT
        COALESCE(SUM(s.total), 0) as total_sales,
        COUNT(s.id) as total_transactions,
        COALESCE(AVG(s.total), 0) as average_ticket
      FROM sales s
      WHERE ${dateFilter}
    `;

    const itemsResult = await sql`
      SELECT COALESCE(SUM(si.quantity), 0) as total_products
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE ${dateFilter}
    `;

    const profitResult = await sql`
      SELECT COALESCE(SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity), 0) as total_profit
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE ${dateFilter}
    `;

    const totalSales = parseNumber(results[0].total_sales);
    const totalProfit = parseNumber(profitResult[0].total_profit);

    return {
      totalSales,
      totalTransactions: parseInt2(results[0].total_transactions),
      averageTicket: parseNumber(results[0].average_ticket),
      totalProductsSold: parseInt2(itemsResult[0].total_products),
      totalProfit,
      profitMargin: totalSales > 0 ? Math.round((totalProfit / totalSales) * 1000) / 10 : 0,
    };
  } catch (error) {
    console.error('Error getting report stats:', error);
    return { totalSales: 0, totalTransactions: 0, averageTicket: 0, totalProductsSold: 0, totalProfit: 0, profitMargin: 0 };
  }
}

export async function getHourlySales(): Promise<HourlySales[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH hours AS (
        SELECT generate_series(6, 22) as hour
      )
      SELECT
        LPAD(h.hour::text, 2, '0') || ':00' as hour,
        COALESCE(SUM(s.total), 0) as sales,
        COUNT(s.id) as transactions,
        COALESCE(AVG(s.total), 0) as avg_ticket
      FROM hours h
      LEFT JOIN sales s ON EXTRACT(HOUR FROM s.created_at) = h.hour
        AND DATE(s.created_at) = CURRENT_DATE
      GROUP BY h.hour
      ORDER BY h.hour
    `;

    return results.map((row: any) => ({
      hour: row.hour,
      sales: parseNumber(row.sales),
      transactions: parseInt2(row.transactions),
      avgTicket: parseNumber(row.avg_ticket),
    }));
  } catch (error) {
    console.error('Error getting hourly sales:', error);
    return [];
  }
}

export async function getDailySales(days = 30): Promise<DailySales[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - (${days - 1} || ' days')::interval,
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      )
      SELECT
        d.date::text,
        TO_CHAR(d.date, 'Dy') as day_name,
        COALESCE(SUM(s.total), 0) as sales,
        COUNT(s.id) as transactions
      FROM dates d
      LEFT JOIN sales s ON DATE(s.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `;

    const dayNames: Record<string, string> = {
      'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mie', 'Thu': 'Jue',
      'Fri': 'Vie', 'Sat': 'Sab', 'Sun': 'Dom'
    };

    return results.map((row: any) => ({
      date: row.date,
      dayName: dayNames[row.day_name] || row.day_name,
      sales: parseNumber(row.sales),
      transactions: parseInt2(row.transactions),
      profit: parseNumber(row.sales) * 0.3,
    }));
  } catch (error) {
    console.error('Error getting daily sales:', error);
    return [];
  }
}

export async function getWeeklyTrend(): Promise<WeeklyTrend[]> {
  if (!sql) return [];

  try {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const currentWeek = await sql`
      SELECT
        EXTRACT(DOW FROM created_at)::int as dow,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
      GROUP BY EXTRACT(DOW FROM created_at)
    `;

    const previousWeek = await sql`
      SELECT
        EXTRACT(DOW FROM created_at)::int as dow,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
        AND created_at < DATE_TRUNC('week', CURRENT_DATE)
      GROUP BY EXTRACT(DOW FROM created_at)
    `;

    const currentMap = new Map(currentWeek.map((r: any) => [r.dow, parseNumber(r.total)]));
    const previousMap = new Map(previousWeek.map((r: any) => [r.dow, parseNumber(r.total)]));

    return days.map((day, idx) => {
      const current = currentMap.get(idx) || 0;
      const previous = previousMap.get(idx) || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
      return { day, current, previous, change: Math.round(change * 10) / 10 };
    });
  } catch (error) {
    console.error('Error getting weekly trend:', error);
    return [];
  }
}

export async function getSalesDetail(dateRange: DateRangeType = 'today', limit = 100): Promise<SalesDetailReport[]> {
  if (!sql) return [];

  try {
    const dateFilter = dateRange === 'today' ? sql`DATE(s.created_at) = CURRENT_DATE` :
                       dateRange === 'yesterday' ? sql`DATE(s.created_at) = CURRENT_DATE - 1` :
                       dateRange === 'week' ? sql`s.created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
                       dateRange === 'month' ? sql`s.created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
                       sql`s.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;

    const results = await sql`
      SELECT
        s.id,
        s.created_at as date,
        s.total,
        s.payment_method,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      WHERE ${dateFilter}
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => ({
      id: row.id,
      date: row.date,
      total: parseNumber(row.total),
      items_count: parseInt2(row.items_count),
      payment_method: row.payment_method,
      profit: parseNumber(row.total) * 0.3,
    }));
  } catch (error) {
    console.error('Error getting sales detail:', error);
    return [];
  }
}

// ==================== PRODUCT REPORTS ====================

export async function getTopProducts(dateRange: DateRangeType = 'week', limit = 10): Promise<TopProduct[]> {
  if (!sql) return [];

  try {
    const dateFilter = dateRange === 'today' ? sql`DATE(s.created_at) = CURRENT_DATE` :
                       dateRange === 'week' ? sql`s.created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
                       dateRange === 'month' ? sql`s.created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
                       sql`s.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;

    const results = await sql`
      SELECT
        p.id,
        p.name,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        COALESCE(SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity), 0) as profit,
        COALESCE(AVG(si.unit_price), 0) as avg_price
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id AND ${dateFilter}
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      GROUP BY p.id, p.name, c.name, c.color
      HAVING COALESCE(SUM(si.quantity), 0) > 0
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => {
      const revenue = parseNumber(row.revenue);
      const profit = parseNumber(row.profit);
      return {
        id: row.id,
        name: row.name,
        category_name: row.category_name,
        category_color: row.category_color,
        quantity_sold: parseInt2(row.quantity_sold),
        revenue,
        profit,
        profit_margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
        avg_price: parseNumber(row.avg_price),
      };
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

export async function getLowPerformingProducts(limit = 10): Promise<TopProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        p.price as avg_price,
        p.stock
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true AND p.stock > 0
      GROUP BY p.id, p.name, p.price, p.stock, c.name, c.color
      ORDER BY quantity_sold ASC, p.stock DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => {
      const revenue = parseNumber(row.revenue);
      return {
        id: row.id,
        name: row.name,
        category_name: row.category_name,
        category_color: row.category_color,
        quantity_sold: parseInt2(row.quantity_sold),
        revenue,
        profit: revenue * 0.3,
        profit_margin: 30,
        avg_price: parseNumber(row.avg_price),
      };
    });
  } catch (error) {
    console.error('Error getting low performing products:', error);
    return [];
  }
}

export async function getCategoryReport(dateRange: DateRangeType = 'month'): Promise<CategoryReport[]> {
  if (!sql) return [];

  try {
    const dateFilter = dateRange === 'today' ? sql`DATE(s.created_at) = CURRENT_DATE` :
                       dateRange === 'week' ? sql`s.created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
                       dateRange === 'month' ? sql`s.created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
                       sql`s.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;

    const results = await sql`
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        COALESCE(SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity), 0) as profit
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.active = true
      LEFT JOIN sale_items si ON si.product_id = p.id
      LEFT JOIN sales s ON s.id = si.sale_id AND ${dateFilter}
      GROUP BY c.id, c.name, c.color
      ORDER BY revenue DESC
    `;

    const totalRevenue = results.reduce((sum: number, r: any) => sum + parseNumber(r.revenue), 0);

    return results.map((row: any) => {
      const revenue = parseNumber(row.revenue);
      return {
        category_id: row.category_id,
        category_name: row.category_name,
        category_color: row.category_color,
        products_count: parseInt2(row.products_count),
        quantity_sold: parseInt2(row.quantity_sold),
        revenue,
        profit: parseNumber(row.profit),
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0,
      };
    });
  } catch (error) {
    console.error('Error getting category report:', error);
    return [];
  }
}

// ==================== PAYMENT METHOD REPORTS ====================

export async function getPaymentMethodReport(dateRange: DateRangeType = 'month'): Promise<PaymentMethodReport[]> {
  if (!sql) return [];

  try {
    const dateFilter = dateRange === 'today' ? sql`DATE(created_at) = CURRENT_DATE` :
                       dateRange === 'week' ? sql`created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
                       dateRange === 'month' ? sql`created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
                       sql`created_at >= DATE_TRUNC('year', CURRENT_DATE)`;

    const results = await sql`
      SELECT
        payment_method as method,
        COUNT(*) as transactions,
        COALESCE(SUM(total), 0) as amount,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales
      WHERE ${dateFilter}
      GROUP BY payment_method
      ORDER BY amount DESC
    `;

    const total = results.reduce((sum: number, r: any) => sum + parseNumber(r.amount), 0);
    const methodLabels: Record<string, string> = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
    };

    return results.map((row: any) => {
      const amount = parseNumber(row.amount);
      return {
        method: row.method,
        method_label: methodLabels[row.method] || row.method,
        transactions: parseInt2(row.transactions),
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        avgTicket: parseNumber(row.avg_ticket),
      };
    });
  } catch (error) {
    console.error('Error getting payment method report:', error);
    return [];
  }
}

// ==================== INVENTORY REPORTS ====================

export async function getInventoryReport(): Promise<InventoryReport> {
  if (!sql) {
    return {
      total_products: 0, total_value: 0, low_stock_count: 0, out_of_stock_count: 0,
      overstocked_count: 0, categories_count: 0, avg_stock_level: 0, potential_revenue: 0
    };
  }

  try {
    const results = await sql`
      SELECT
        COUNT(*) as total_products,
        COALESCE(SUM(stock * cost), 0) as total_value,
        COALESCE(SUM(stock * price), 0) as potential_revenue,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE(min_stock, 5)) as low_stock,
        COUNT(*) FILTER (WHERE stock > COALESCE(min_stock, 5) * 10) as overstocked,
        COALESCE(AVG(stock), 0) as avg_stock,
        COUNT(DISTINCT category_id) as categories_count
      FROM products
      WHERE active = true
    `;

    return {
      total_products: parseInt2(results[0].total_products),
      total_value: parseNumber(results[0].total_value),
      low_stock_count: parseInt2(results[0].low_stock),
      out_of_stock_count: parseInt2(results[0].out_of_stock),
      overstocked_count: parseInt2(results[0].overstocked),
      categories_count: parseInt2(results[0].categories_count),
      avg_stock_level: Math.round(parseNumber(results[0].avg_stock)),
      potential_revenue: parseNumber(results[0].potential_revenue),
    };
  } catch (error) {
    console.error('Error getting inventory report:', error);
    return {
      total_products: 0, total_value: 0, low_stock_count: 0, out_of_stock_count: 0,
      overstocked_count: 0, categories_count: 0, avg_stock_level: 0, potential_revenue: 0
    };
  }
}

export async function getInventoryProductReport(filter?: 'all' | 'low_stock' | 'out_of_stock' | 'overstock'): Promise<InventoryProductReport[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id,
        p.name,
        c.name as category_name,
        c.color as category_color,
        p.stock,
        COALESCE(p.min_stock, 5) as min_stock,
        p.cost,
        p.price,
        (p.stock * p.cost) as stock_value
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      ORDER BY p.stock ASC
    `;

    let products = results.map((row: any) => {
      const stock = parseInt2(row.stock);
      const minStock = parseInt2(row.min_stock) || 5;
      const maxStock = minStock * 10;

      let status: 'out_of_stock' | 'low_stock' | 'normal' | 'overstock' = 'normal';
      if (stock === 0) status = 'out_of_stock';
      else if (stock <= minStock) status = 'low_stock';
      else if (stock > maxStock) status = 'overstock';

      return {
        id: row.id,
        name: row.name,
        category_name: row.category_name,
        category_color: row.category_color,
        stock,
        min_stock: minStock,
        cost: parseNumber(row.cost),
        price: parseNumber(row.price),
        stock_value: parseNumber(row.stock_value),
        status,
        days_of_stock: stock > 0 ? Math.min(999, Math.round(stock / 2)) : 0,
      };
    });

    if (filter && filter !== 'all') {
      products = products.filter(p => p.status === filter);
    }

    return products;
  } catch (error) {
    console.error('Error getting inventory product report:', error);
    return [];
  }
}

// ==================== SUPPLIER REPORTS ====================

export async function getSupplierReport(): Promise<SupplierReport[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(p.id) as orders_count,
        COALESCE(SUM(p.total), 0) as total_amount,
        COALESCE(AVG(p.total), 0) as avg_order,
        MAX(p.created_at) as last_purchase
      FROM suppliers s
      LEFT JOIN purchases p ON p.supplier_id = s.id AND p.status = 'received'
      WHERE s.active = true
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
    `;

    return results.map((row: any) => ({
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      total_purchases: parseInt2(row.orders_count),
      total_amount: parseNumber(row.total_amount),
      orders_count: parseInt2(row.orders_count),
      avg_order: parseNumber(row.avg_order),
      last_purchase: row.last_purchase,
    }));
  } catch (error) {
    console.error('Error getting supplier report:', error);
    return [];
  }
}

// ==================== FINANCIAL REPORTS ====================

export async function getFinancialReport(dateRange: DateRangeType = 'month'): Promise<FinancialReport> {
  if (!sql) {
    return {
      total_sales: 0, total_cost: 0, gross_profit: 0, total_purchases: 0,
      net_profit: 0, profit_margin: 0, expense_ratio: 0, inventory_value: 0
    };
  }

  try {
    const salesData = await sql`
      SELECT COALESCE(SUM(total), 0) as total_sales
      FROM sales
      WHERE ${dateRange === 'today' ? sql`DATE(created_at) = CURRENT_DATE` :
             dateRange === 'week' ? sql`created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
             dateRange === 'month' ? sql`created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
             sql`created_at >= DATE_TRUNC('year', CURRENT_DATE)`}
    `;

    const costData = await sql`
      SELECT COALESCE(SUM(COALESCE(p.cost, 0) * si.quantity), 0) as total_cost
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE ${dateRange === 'today' ? sql`DATE(s.created_at) = CURRENT_DATE` :
             dateRange === 'week' ? sql`s.created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
             dateRange === 'month' ? sql`s.created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
             sql`s.created_at >= DATE_TRUNC('year', CURRENT_DATE)`}
    `;

    const purchasesData = await sql`
      SELECT COALESCE(SUM(total), 0) as total_purchases
      FROM purchases
      WHERE status = 'received' AND ${dateRange === 'today' ? sql`DATE(created_at) = CURRENT_DATE` :
             dateRange === 'week' ? sql`created_at >= DATE_TRUNC('week', CURRENT_DATE)` :
             dateRange === 'month' ? sql`created_at >= DATE_TRUNC('month', CURRENT_DATE)` :
             sql`created_at >= DATE_TRUNC('year', CURRENT_DATE)`}
    `;

    const inventoryData = await sql`
      SELECT COALESCE(SUM(stock * cost), 0) as inventory_value
      FROM products WHERE active = true
    `;

    const totalSales = parseNumber(salesData[0].total_sales);
    const totalCost = parseNumber(costData[0].total_cost);
    const grossProfit = totalSales - totalCost;
    const totalPurchases = parseNumber(purchasesData[0].total_purchases);
    const netProfit = grossProfit;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const expenseRatio = totalSales > 0 ? (totalPurchases / totalSales) * 100 : 0;

    return {
      total_sales: totalSales,
      total_cost: totalCost,
      gross_profit: grossProfit,
      total_purchases: totalPurchases,
      net_profit: netProfit,
      profit_margin: Math.round(profitMargin * 10) / 10,
      expense_ratio: Math.round(expenseRatio * 10) / 10,
      inventory_value: parseNumber(inventoryData[0].inventory_value),
    };
  } catch (error) {
    console.error('Error getting financial report:', error);
    return {
      total_sales: 0, total_cost: 0, gross_profit: 0, total_purchases: 0,
      net_profit: 0, profit_margin: 0, expense_ratio: 0, inventory_value: 0
    };
  }
}

// ==================== COMPARATIVE REPORTS ====================

export async function getComparativeReport(dateRange: DateRangeType = 'month'): Promise<ComparativeReport> {
  if (!sql) {
    const empty = { sales: 0, transactions: 0, profit: 0, avgTicket: 0 };
    return { current_period: empty, previous_period: empty, changes: empty };
  }

  try {
    let currentFilter, previousFilter;

    switch (dateRange) {
      case 'today':
        currentFilter = sql`DATE(created_at) = CURRENT_DATE`;
        previousFilter = sql`DATE(created_at) = CURRENT_DATE - 1`;
        break;
      case 'week':
        currentFilter = sql`created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
        previousFilter = sql`created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days' AND created_at < DATE_TRUNC('week', CURRENT_DATE)`;
        break;
      case 'month':
        currentFilter = sql`created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
        previousFilter = sql`created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      default:
        currentFilter = sql`created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
        previousFilter = sql`created_at >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' AND created_at < DATE_TRUNC('year', CURRENT_DATE)`;
    }

    const current = await sql`
      SELECT
        COALESCE(SUM(total), 0) as sales,
        COUNT(*) as transactions,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales
      WHERE ${currentFilter}
    `;

    const previous = await sql`
      SELECT
        COALESCE(SUM(total), 0) as sales,
        COUNT(*) as transactions,
        COALESCE(AVG(total), 0) as avg_ticket
      FROM sales
      WHERE ${previousFilter}
    `;

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const currSales = parseNumber(current[0].sales);
    const prevSales = parseNumber(previous[0].sales);
    const currTx = parseInt2(current[0].transactions);
    const prevTx = parseInt2(previous[0].transactions);
    const currTicket = parseNumber(current[0].avg_ticket);
    const prevTicket = parseNumber(previous[0].avg_ticket);

    return {
      current_period: { sales: currSales, transactions: currTx, profit: currSales * 0.3, avgTicket: currTicket },
      previous_period: { sales: prevSales, transactions: prevTx, profit: prevSales * 0.3, avgTicket: prevTicket },
      changes: {
        sales: calcChange(currSales, prevSales),
        transactions: calcChange(currTx, prevTx),
        profit: calcChange(currSales * 0.3, prevSales * 0.3),
        avgTicket: calcChange(currTicket, prevTicket),
      },
    };
  } catch (error) {
    console.error('Error getting comparative report:', error);
    const empty = { sales: 0, transactions: 0, profit: 0, avgTicket: 0 };
    return { current_period: empty, previous_period: empty, changes: empty };
  }
}
