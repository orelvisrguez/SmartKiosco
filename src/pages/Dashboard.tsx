import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Box,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  getDashboardStats,
  getSalesComparison,
  getWeeklySalesData,
  getTopProducts,
  getCategorySales,
  getLowStockProducts,
  getRecentSales,
  getHourlySales,
  getPaymentMethodStats,
  getInventoryValue,
  type DashboardStats,
  type SalesComparison,
  type WeeklySalesData,
  type TopProduct,
  type CategorySales,
  type LowStockProduct,
  type RecentSale,
  type HourlySales,
  type PaymentMethodStats,
} from '@/lib/api/dashboard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, icon: Icon, color, subtitle, onClick }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? 'bg-success/20 text-success'
                : 'bg-error/20 text-error'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-sm text-neutral-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-neutral-50">{value}</p>
      {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<SalesComparison | null>(null);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([]);
  const [inventoryValue, setInventoryValue] = useState({ totalValue: 0, totalCost: 0, potentialProfit: 0 });

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        statsData,
        comparisonData,
        weeklyData,
        topProductsData,
        categoryData,
        lowStockData,
        recentData,
        hourlyData,
        paymentData,
        inventoryData,
      ] = await Promise.all([
        getDashboardStats(),
        getSalesComparison(),
        getWeeklySalesData(),
        getTopProducts(5),
        getCategorySales(),
        getLowStockProducts(5),
        getRecentSales(8),
        getHourlySales(),
        getPaymentMethodStats(),
        getInventoryValue(),
      ]);

      setStats(statsData);
      setComparison(comparisonData);
      setWeeklySales(weeklyData);
      setTopProducts(topProductsData);
      setCategorySales(categoryData);
      setLowStockProducts(lowStockData);
      setRecentSales(recentData);
      setHourlySales(hourlyData);
      setPaymentStats(paymentData);
      setInventoryValue(inventoryData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const salesChange = comparison ? calculateChange(comparison.todaySales, comparison.yesterdaySales) : 0;
  const transactionsChange = comparison ? calculateChange(comparison.todayTransactions, comparison.yesterdayTransactions) : 0;
  const weekChange = comparison ? calculateChange(comparison.weekSales, comparison.lastWeekSales) : 0;

  // Payment method icons and colors
  const paymentMethodConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    cash: { icon: Banknote, color: '#4ADE80', label: 'Efectivo' },
    card: { icon: CreditCard, color: '#22D3EE', label: 'Tarjeta' },
    transfer: { icon: Wallet, color: '#FBBF24', label: 'Transferencia' },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Dashboard</h1>
          <p className="text-neutral-400 mt-1">
            Resumen general del negocio •{' '}
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/reportes')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Ver Reportes
          </button>
        </div>
      </motion.div>

      {/* Cash Register Alert */}
      {stats && !stats.openCashRegister && (
        <motion.div
          variants={item}
          className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-warning" />
            <div>
              <p className="font-medium text-warning">Caja cerrada</p>
              <p className="text-sm text-neutral-400">
                Abre la caja para comenzar a registrar ventas
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/caja')}
            className="px-4 py-2 bg-warning text-neutral-950 font-medium rounded-lg hover:bg-warning/80 transition-colors"
          >
            Abrir Caja
          </button>
        </motion.div>
      )}

      {/* Main KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas del Día"
          value={formatCurrency(stats?.todaySales || 0)}
          change={salesChange}
          icon={DollarSign}
          color="#4ADE80"
          subtitle="vs. ayer"
        />
        <StatCard
          title="Transacciones"
          value={formatNumber(stats?.todayTransactions || 0)}
          change={transactionsChange}
          icon={ShoppingCart}
          color="#22D3EE"
          subtitle="vs. ayer"
        />
        <StatCard
          title="Ganancia del Día"
          value={formatCurrency(stats?.todayProfit || 0)}
          icon={TrendingUp}
          color="#A78BFA"
        />
        <StatCard
          title="Efectivo en Caja"
          value={formatCurrency(stats?.cashInRegister || 0)}
          icon={Banknote}
          color="#FBBF24"
          subtitle={stats?.openCashRegister ? 'Caja abierta' : 'Caja cerrada'}
          onClick={() => navigate('/caja')}
        />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Ventas Semana</p>
              <p className="text-lg font-bold text-neutral-50">{formatCurrency(comparison?.weekSales || 0)}</p>
              {weekChange !== 0 && (
                <p className={`text-xs ${weekChange >= 0 ? 'text-success' : 'text-error'}`}>
                  {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(1)}% vs. semana anterior
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Ventas Mes</p>
              <p className="text-lg font-bold text-neutral-50">{formatCurrency(comparison?.monthSales || 0)}</p>
            </div>
          </div>
        </div>
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-neutral-700 transition-colors"
          onClick={() => navigate('/productos')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Productos Activos</p>
              <p className="text-lg font-bold text-neutral-50">{stats?.activeProducts || 0}</p>
            </div>
          </div>
        </div>
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-warning/50 transition-colors"
          onClick={() => navigate('/inventario')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Stock Bajo / Agotado</p>
              <p className="text-lg font-bold text-neutral-50">
                {stats?.lowStockCount || 0} / {stats?.outOfStockCount || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Ventas de la Semana</h2>
              <p className="text-neutral-400 text-sm">Últimos 7 días</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-neutral-400">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-neutral-400">Ganancia</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklySales}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="dayName" stroke="#a3a3a3" fontSize={12} />
              <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
                labelStyle={{ color: '#fafafa' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Ventas"
                stroke="#22D3EE"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Ganancia"
                stroke="#4ADE80"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Ventas por Categoría</h2>
              <p className="text-neutral-400 text-sm">Última semana</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-neutral-500" />
          </div>
          {categorySales.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="total_sales"
                    nameKey="category_name"
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category_color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #404040',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categorySales.slice(0, 4).map((cat) => (
                  <div key={cat.category_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.category_color }}
                      />
                      <span className="text-sm text-neutral-300 truncate max-w-[100px]">
                        {cat.category_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-neutral-50">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-neutral-500">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sin datos de ventas</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payment Methods & Hourly Sales */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Métodos de Pago</h2>
              <p className="text-neutral-400 text-sm">Distribución del día</p>
            </div>
            <CreditCard className="w-5 h-5 text-neutral-500" />
          </div>
          {paymentStats.length > 0 ? (
            <div className="space-y-4">
              {paymentStats.map((payment) => {
                const config = paymentMethodConfig[payment.method] || {
                  icon: Wallet,
                  color: '#6B7280',
                  label: payment.method,
                };
                const Icon = config.icon;
                return (
                  <div key={payment.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-50">{config.label}</p>
                          <p className="text-xs text-neutral-400">{payment.count} transacciones</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-50">{formatCurrency(payment.total)}</p>
                        <p className="text-xs text-neutral-400">{payment.percentage}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${payment.percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-neutral-500">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sin ventas hoy</p>
              </div>
            </div>
          )}
        </div>

        {/* Hourly Sales */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Ventas por Hora</h2>
              <p className="text-neutral-400 text-sm">Actividad del día</p>
            </div>
            <Clock className="w-5 h-5 text-neutral-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlySales.filter(h => h.hour >= 6 && h.hour <= 22)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#a3a3a3"
                fontSize={11}
                tickFormatter={(h) => `${h}h`}
              />
              <YAxis stroke="#a3a3a3" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(h) => `${h}:00 - ${h}:59`}
              />
              <Bar dataKey="sales" fill="#22D3EE" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Productos Top</h2>
              <p className="text-neutral-400 text-sm">Más vendidos esta semana</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-50 truncate">{product.name}</p>
                    <p className="text-xs text-neutral-400">
                      {product.quantity_sold} vendidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-50">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-neutral-500">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sin datos de ventas</p>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Alertas de Stock</h2>
              <p className="text-neutral-400 text-sm">Requieren atención</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-50 truncate">{product.name}</p>
                    <p className="text-xs text-neutral-400">Mín: {product.min_stock} unidades</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`text-lg font-bold ${product.stock === 0 ? 'text-error' : 'text-warning'}`}>
                      {product.stock}
                    </p>
                    <p className="text-xs text-neutral-400">en stock</p>
                  </div>
                </motion.div>
              ))}
              <button
                onClick={() => navigate('/inventario')}
                className="w-full py-2 text-sm text-primary-500 hover:text-primary-400 transition-colors"
              >
                Ver todos los productos con stock bajo
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-neutral-500">
              <div className="text-center">
                <Box className="w-12 h-12 mx-auto mb-2 opacity-50 text-success" />
                <p className="text-success">Stock saludable</p>
                <p className="text-xs">Todos los productos tienen stock suficiente</p>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Value */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-50">Valor del Inventario</h2>
              <p className="text-neutral-400 text-sm">Productos activos</p>
            </div>
            <Box className="w-5 h-5 text-neutral-500" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-400 mb-1">Valor de Venta</p>
              <p className="text-2xl font-bold text-neutral-50">
                {formatCurrency(inventoryValue.totalValue)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-400 mb-1">Costo Total</p>
                <p className="text-lg font-bold text-neutral-50">
                  {formatCurrency(inventoryValue.totalCost)}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                <p className="text-xs text-neutral-400 mb-1">Ganancia Potencial</p>
                <p className="text-lg font-bold text-success">
                  {formatCurrency(inventoryValue.potentialProfit)}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-neutral-400">Margen promedio</span>
                <span className="text-neutral-50 font-medium">
                  {inventoryValue.totalValue > 0
                    ? ((inventoryValue.potentialProfit / inventoryValue.totalValue) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-success transition-all duration-500"
                  style={{
                    width: `${inventoryValue.totalValue > 0
                      ? (inventoryValue.potentialProfit / inventoryValue.totalValue) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={item} className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">Transacciones Recientes</h2>
            <p className="text-neutral-400 text-sm">Últimas ventas registradas</p>
          </div>
          <button
            onClick={() => navigate('/reportes')}
            className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
          >
            Ver todas
          </button>
        </div>
        {recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Productos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Método</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, index) => {
                  const config = paymentMethodConfig[sale.payment_method] || {
                    color: '#6B7280',
                    label: sale.payment_method,
                  };
                  return (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-neutral-50 font-mono">
                        #{sale.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-300">
                        {sale.items_count} {sale.items_count === 1 ? 'producto' : 'productos'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-50 font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-400">
                        {new Date(sale.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-neutral-500">
            <div className="text-center">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay ventas recientes</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
