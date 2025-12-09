import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

// ==================== INTERFACES ====================

export interface FinanceStats {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  inventoryValue: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  profitMargin: number;
  expenseRatio: number;
}

export interface PeriodStats {
  period: string;
  sales: number;
  salesCount: number;
  expenses: number;
  expensesCount: number;
  profit: number;
  avgTicket: number;
}

export interface MonthlyData {
  month: string;
  monthName: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface DailyData {
  date: string;
  dayName: string;
  sales: number;
  expenses: number;
  transactions: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  reference: string | null;
  date: string;
}

export interface TransactionFilters {
  type?: 'all' | 'income' | 'expense';
  date_from?: string;
  date_to?: string;
  search?: string;
  payment_method?: string;
}

export interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

export interface FinanceSummary {
  today: PeriodStats;
  thisWeek: PeriodStats;
  thisMonth: PeriodStats;
  lastMonth: PeriodStats;
  thisYear: PeriodStats;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
  profit_margin: number;
}

export interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
  avgAmount: number;
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

// ==================== MAIN STATS ====================

export async function getFinanceStats(): Promise<FinanceStats> {
  if (!sql) {
    return {
      totalSales: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0,
      inventoryValue: 0, cashSales: 0, cardSales: 0, transferSales: 0,
      profitMargin: 0, expenseRatio: 0,
    };
  }

  try {
    const salesStats = await sql`
      SELECT
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer_sales
      FROM sales
    `;

    const expenseStats = await sql`
      SELECT COALESCE(SUM(total), 0) as total_expenses
      FROM purchases WHERE status = 'received'
    `;

    const inventoryStats = await sql`
      SELECT COALESCE(SUM(stock * cost), 0) as inventory_value
      FROM products WHERE active = true
    `;

    const profitStats = await sql`
      SELECT COALESCE(SUM(
        (SELECT COALESCE(SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity), 0)
         FROM sale_items si
         LEFT JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = s.id)
      ), 0) as gross_profit
      FROM sales s
    `;

    const totalSales = parseNumber(salesStats[0].total_sales);
    const totalExpenses = parseNumber(expenseStats[0].total_expenses);
    const grossProfit = parseNumber(profitStats[0].gross_profit);
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const expenseRatio = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;

    return {
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      inventoryValue: parseNumber(inventoryStats[0].inventory_value),
      cashSales: parseNumber(salesStats[0].cash_sales),
      cardSales: parseNumber(salesStats[0].card_sales),
      transferSales: parseNumber(salesStats[0].transfer_sales),
      profitMargin: Math.round(profitMargin * 10) / 10,
      expenseRatio: Math.round(expenseRatio * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting finance stats:', error);
    throw error;
  }
}

// ==================== PERIOD STATS ====================

export async function getFinanceSummary(): Promise<FinanceSummary> {
  if (!sql) {
    const emptyPeriod: PeriodStats = { period: '', sales: 0, salesCount: 0, expenses: 0, expensesCount: 0, profit: 0, avgTicket: 0 };
    return {
      today: { ...emptyPeriod, period: 'Hoy' },
      thisWeek: { ...emptyPeriod, period: 'Esta Semana' },
      thisMonth: { ...emptyPeriod, period: 'Este Mes' },
      lastMonth: { ...emptyPeriod, period: 'Mes Anterior' },
      thisYear: { ...emptyPeriod, period: 'Este Año' },
    };
  }

  try {
    const results = await sql`
      SELECT
        -- Today
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_sales,
        -- This week
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as week_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as week_sales,
        -- This month
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as month_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as month_sales,
        -- Last month
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)), 0) as last_month_sales,
        -- This year
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)) as year_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)), 0) as year_sales
      FROM sales
    `;

    const expenses = await sql`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as week,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as week_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as month,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as month_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)), 0) as last_month,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as last_month_count,
        COALESCE(SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)), 0) as year,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)) as year_count
      FROM purchases WHERE status = 'received'
    `;

    const r = results[0];
    const e = expenses[0];

    const createPeriod = (period: string, sales: number, salesCount: number, expenses: number, expensesCount: number): PeriodStats => ({
      period,
      sales,
      salesCount,
      expenses,
      expensesCount,
      profit: sales - expenses,
      avgTicket: salesCount > 0 ? sales / salesCount : 0,
    });

    return {
      today: createPeriod('Hoy', parseNumber(r.today_sales), parseInt2(r.today_count), parseNumber(e.today), parseInt2(e.today_count)),
      thisWeek: createPeriod('Esta Semana', parseNumber(r.week_sales), parseInt2(r.week_count), parseNumber(e.week), parseInt2(e.week_count)),
      thisMonth: createPeriod('Este Mes', parseNumber(r.month_sales), parseInt2(r.month_count), parseNumber(e.month), parseInt2(e.month_count)),
      lastMonth: createPeriod('Mes Anterior', parseNumber(r.last_month_sales), parseInt2(r.last_month_count), parseNumber(e.last_month), parseInt2(e.last_month_count)),
      thisYear: createPeriod('Este Año', parseNumber(r.year_sales), parseInt2(r.year_count), parseNumber(e.year), parseInt2(e.year_count)),
    };
  } catch (error) {
    console.error('Error getting finance summary:', error);
    throw error;
  }
}

// ==================== MONTHLY DATA ====================

export async function getMonthlyData(months = 12): Promise<MonthlyData[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - (${months - 1} || ' months')::interval,
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        )::date as month
      )
      SELECT
        m.month::text,
        TO_CHAR(m.month, 'Mon') as month_name,
        COALESCE((
          SELECT SUM(total) FROM sales
          WHERE DATE_TRUNC('month', created_at) = m.month
        ), 0) as sales,
        COALESCE((
          SELECT SUM(total) FROM purchases
          WHERE DATE_TRUNC('month', created_at) = m.month AND status = 'received'
        ), 0) as expenses
      FROM months m
      ORDER BY m.month
    `;

    const monthNames: Record<string, string> = {
      'Jan': 'Ene', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Abr',
      'May': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago',
      'Sep': 'Sep', 'Oct': 'Oct', 'Nov': 'Nov', 'Dec': 'Dic'
    };

    return results.map((row: any) => {
      const sales = parseNumber(row.sales);
      const expenses = parseNumber(row.expenses);
      return {
        month: row.month,
        monthName: monthNames[row.month_name] || row.month_name,
        sales,
        expenses,
        profit: sales - expenses,
      };
    });
  } catch (error) {
    console.error('Error getting monthly data:', error);
    throw error;
  }
}

// ==================== DAILY DATA (Last 30 days) ====================

export async function getDailyData(days = 30): Promise<DailyData[]> {
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
        COALESCE((
          SELECT SUM(total) FROM sales
          WHERE DATE(created_at) = d.date
        ), 0) as sales,
        COALESCE((
          SELECT SUM(total) FROM purchases
          WHERE DATE(created_at) = d.date AND status = 'received'
        ), 0) as expenses,
        COALESCE((
          SELECT COUNT(*) FROM sales
          WHERE DATE(created_at) = d.date
        ), 0) as transactions
      FROM dates d
      ORDER BY d.date
    `;

    const dayNames: Record<string, string> = {
      'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue',
      'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom'
    };

    return results.map((row: any) => ({
      date: row.date,
      dayName: dayNames[row.day_name] || row.day_name,
      sales: parseNumber(row.sales),
      expenses: parseNumber(row.expenses),
      transactions: parseInt2(row.transactions),
    }));
  } catch (error) {
    console.error('Error getting daily data:', error);
    throw error;
  }
}

// ==================== CASH FLOW ====================

export async function getCashFlowData(months = 6): Promise<CashFlowData[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - (${months - 1} || ' months')::interval,
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        )::date as month
      )
      SELECT
        TO_CHAR(m.month, 'YYYY-MM') as period,
        COALESCE((
          SELECT SUM(total) FROM sales
          WHERE DATE_TRUNC('month', created_at) = m.month
        ), 0) as inflow,
        COALESCE((
          SELECT SUM(total) FROM purchases
          WHERE DATE_TRUNC('month', created_at) = m.month AND status = 'received'
        ), 0) as outflow
      FROM months m
      ORDER BY m.month
    `;

    let cumulative = 0;
    return results.map((row: any) => {
      const inflow = parseNumber(row.inflow);
      const outflow = parseNumber(row.outflow);
      const net = inflow - outflow;
      cumulative += net;
      return {
        period: row.period,
        inflow,
        outflow,
        net,
        cumulative,
      };
    });
  } catch (error) {
    console.error('Error getting cash flow data:', error);
    throw error;
  }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(filters?: TransactionFilters, limit = 100): Promise<Transaction[]> {
  if (!sql) return [];

  try {
    // Get sales
    const sales = await sql`
      SELECT
        id,
        'income' as type,
        'Venta' as category,
        'Venta realizada' as description,
        total as amount,
        payment_method,
        id as reference,
        created_at as date
      FROM sales
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Get purchases
    const purchases = await sql`
      SELECT
        p.id,
        'expense' as type,
        'Compra' as category,
        CONCAT('Compra a ', s.name) as description,
        p.total as amount,
        NULL as payment_method,
        p.id as reference,
        p.created_at as date
      FROM purchases p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.status = 'received'
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;

    let transactions = [...sales, ...purchases]
      .map((row: any) => ({
        id: row.id,
        type: row.type as 'income' | 'expense',
        category: row.category,
        description: row.description,
        amount: parseNumber(row.amount),
        payment_method: row.payment_method,
        reference: row.reference,
        date: row.date,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filters
    if (filters?.type && filters.type !== 'all') {
      transactions = transactions.filter(t => t.type === filters.type);
    }

    if (filters?.date_from) {
      const fromDate = new Date(filters.date_from);
      transactions = transactions.filter(t => new Date(t.date) >= fromDate);
    }

    if (filters?.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter(t => new Date(t.date) <= toDate);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      transactions = transactions.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }

    if (filters?.payment_method) {
      transactions = transactions.filter(t => t.payment_method === filters.payment_method);
    }

    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  return getTransactions(undefined, limit);
}

// ==================== EXPENSE DISTRIBUTION ====================

export async function getExpenseDistribution(): Promise<ExpenseCategory[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        s.name as category,
        COALESCE(SUM(p.total), 0) as amount,
        COUNT(p.id) as count
      FROM purchases p
      JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.status = 'received'
      GROUP BY s.id, s.name
      ORDER BY amount DESC
      LIMIT 10
    `;

    const total = results.reduce((sum: number, r: any) => sum + parseNumber(r.amount), 0);

    return results.map((row: any) => {
      const amount = parseNumber(row.amount);
      return {
        category: row.category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        count: parseInt2(row.count),
      };
    });
  } catch (error) {
    console.error('Error getting expense distribution:', error);
    return [];
  }
}

// ==================== PAYMENT METHODS STATS ====================

export async function getPaymentMethodStats(): Promise<PaymentMethodStats[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as amount,
        COALESCE(AVG(total), 0) as avg_amount
      FROM sales
      GROUP BY payment_method
      ORDER BY amount DESC
    `;

    const total = results.reduce((sum: number, r: any) => sum + parseNumber(r.amount), 0);

    const methodNames: Record<string, string> = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
    };

    return results.map((row: any) => {
      const amount = parseNumber(row.amount);
      return {
        method: methodNames[row.method] || row.method,
        amount,
        count: parseInt2(row.count),
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        avgAmount: parseNumber(row.avg_amount),
      };
    });
  } catch (error) {
    console.error('Error getting payment method stats:', error);
    return [];
  }
}

// ==================== TOP PRODUCTS ====================

export async function getTopProducts(limit = 10): Promise<TopProduct[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(SUM(si.subtotal), 0) as revenue,
        COALESCE(SUM((si.unit_price - COALESCE(p.cost, 0)) * si.quantity), 0) as profit
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      WHERE p.active = true
      GROUP BY p.id, p.name
      HAVING COALESCE(SUM(si.quantity), 0) > 0
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return results.map((row: any) => {
      const revenue = parseNumber(row.revenue);
      const profit = parseNumber(row.profit);
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_sold: parseInt2(row.quantity_sold),
        revenue,
        profit,
        profit_margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      };
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

// ==================== HOURLY SALES (Today) ====================

export async function getHourlySales(): Promise<{ hour: number; sales: number; count: number }[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      )
      SELECT
        h.hour,
        COALESCE(SUM(s.total), 0) as sales,
        COUNT(s.id) as count
      FROM hours h
      LEFT JOIN sales s ON EXTRACT(HOUR FROM s.created_at) = h.hour
        AND DATE(s.created_at) = CURRENT_DATE
      GROUP BY h.hour
      ORDER BY h.hour
    `;

    return results.map((row: any) => ({
      hour: parseInt2(row.hour),
      sales: parseNumber(row.sales),
      count: parseInt2(row.count),
    }));
  } catch (error) {
    console.error('Error getting hourly sales:', error);
    return [];
  }
}

// ==================== COMPARISON STATS ====================

export async function getComparisonStats(): Promise<{
  salesGrowth: number;
  profitGrowth: number;
  expenseGrowth: number;
  ticketGrowth: number;
}> {
  if (!sql) {
    return { salesGrowth: 0, profitGrowth: 0, expenseGrowth: 0, ticketGrowth: 0 };
  }

  try {
    const current = await sql`
      SELECT
        COALESCE(SUM(total), 0) as sales,
        COUNT(*) as count
      FROM sales
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const previous = await sql`
      SELECT
        COALESCE(SUM(total), 0) as sales,
        COUNT(*) as count
      FROM sales
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `;

    const currentExpenses = await sql`
      SELECT COALESCE(SUM(total), 0) as expenses
      FROM purchases
      WHERE status = 'received' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const previousExpenses = await sql`
      SELECT COALESCE(SUM(total), 0) as expenses
      FROM purchases
      WHERE status = 'received'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `;

    const currSales = parseNumber(current[0].sales);
    const prevSales = parseNumber(previous[0].sales);
    const currCount = parseInt2(current[0].count);
    const prevCount = parseInt2(previous[0].count);
    const currExp = parseNumber(currentExpenses[0].expenses);
    const prevExp = parseNumber(previousExpenses[0].expenses);

    const currTicket = currCount > 0 ? currSales / currCount : 0;
    const prevTicket = prevCount > 0 ? prevSales / prevCount : 0;

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    return {
      salesGrowth: calcGrowth(currSales, prevSales),
      profitGrowth: calcGrowth(currSales - currExp, prevSales - prevExp),
      expenseGrowth: calcGrowth(currExp, prevExp),
      ticketGrowth: calcGrowth(currTicket, prevTicket),
    };
  } catch (error) {
    console.error('Error getting comparison stats:', error);
    return { salesGrowth: 0, profitGrowth: 0, expenseGrowth: 0, ticketGrowth: 0 };
  }
}
