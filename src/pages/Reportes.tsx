import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Calendar,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Filter,
  Search,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  getReportStats,
  getHourlySales,
  getDailySales,
  getWeeklyTrend,
  getSalesDetail,
  getTopProducts,
  getLowPerformingProducts,
  getCategoryReport,
  getPaymentMethodReport,
  getInventoryReport,
  getInventoryProductReport,
  getSupplierReport,
  getFinancialReport,
  getComparativeReport,
  type DateRangeType,
  type ReportStats,
  type HourlySales,
  type DailySales,
  type WeeklyTrend,
  type SalesDetailReport,
  type TopProduct,
  type CategoryReport,
  type PaymentMethodReport,
  type InventoryReport,
  type InventoryProductReport,
  type SupplierReport,
  type FinancialReport,
  type ComparativeReport,
} from '@/lib/api/reports';

const tabs = [
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'inventario', label: 'Inventario', icon: Layers },
  { id: 'financiero', label: 'Financiero', icon: DollarSign },
];

const dateRangeOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' },
];

const CHART_COLORS = ['#22D3EE', '#4ADE80', '#FBBF24', '#F472B6', '#A78BFA', '#FB7185'];

export function Reportes() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [dateRange, setDateRange] = useState<DateRangeType>('month');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'overstock'>('all');

  // Sales data
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [salesDetail, setSalesDetail] = useState<SalesDetailReport[]>([]);

  // Product data
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowProducts, setLowProducts] = useState<TopProduct[]>([]);
  const [categoryReport, setCategoryReport] = useState<CategoryReport[]>([]);

  // Payment data
  const [paymentReport, setPaymentReport] = useState<PaymentMethodReport[]>([]);

  // Inventory data
  const [inventoryStats, setInventoryStats] = useState<InventoryReport | null>(null);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProductReport[]>([]);
  const [supplierReport, setSupplierReport] = useState<SupplierReport[]>([]);

  // Financial data
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [comparativeReport, setComparativeReport] = useState<ComparativeReport | null>(null);

  const loadSalesData = async () => {
    try {
      const [statsData, hourly, daily, weekly, detail, payment] = await Promise.all([
        getReportStats(dateRange),
        getHourlySales(),
        getDailySales(30),
        getWeeklyTrend(),
        getSalesDetail(dateRange, 50),
        getPaymentMethodReport(dateRange),
      ]);
      setStats(statsData);
      setHourlySales(hourly);
      setDailySales(daily);
      setWeeklyTrend(weekly);
      setSalesDetail(detail);
      setPaymentReport(payment);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Error al cargar datos de ventas');
    }
  };

  const loadProductData = async () => {
    try {
      const [top, low, categories] = await Promise.all([
        getTopProducts(dateRange, 10),
        getLowPerformingProducts(10),
        getCategoryReport(dateRange),
      ]);
      setTopProducts(top);
      setLowProducts(low);
      setCategoryReport(categories);
    } catch (error) {
      console.error('Error loading product data:', error);
      toast.error('Error al cargar datos de productos');
    }
  };

  const loadInventoryData = async () => {
    try {
      const [invStats, products, suppliers] = await Promise.all([
        getInventoryReport(),
        getInventoryProductReport(inventoryFilter),
        getSupplierReport(),
      ]);
      setInventoryStats(invStats);
      setInventoryProducts(products);
      setSupplierReport(suppliers);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Error al cargar datos de inventario');
    }
  };

  const loadFinancialData = async () => {
    try {
      const [financial, comparative] = await Promise.all([
        getFinancialReport(dateRange),
        getComparativeReport(dateRange),
      ]);
      setFinancialReport(financial);
      setComparativeReport(comparative);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Error al cargar datos financieros');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadSalesData(), loadProductData(), loadInventoryData(), loadFinancialData()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === 'inventario') {
      getInventoryProductReport(inventoryFilter).then(setInventoryProducts);
    }
  }, [inventoryFilter]);

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.error('No hay datos para exportar');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte exportado exitosamente');
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Reportes</h1>
          <p className="text-neutral-300 mt-1">Analiza el rendimiento de tu negocio con reportes detallados</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeType)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={loadAllData}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-neutral-950'
                : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ventas' && (
          <motion.div
            key="ventas"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span className="text-sm text-neutral-400">Ventas</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{formatCurrency(stats?.totalSales || 0)}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-primary-500" />
                  <span className="text-sm text-neutral-400">Transacciones</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{stats?.totalTransactions || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-warning" />
                  <span className="text-sm text-neutral-400">Ticket Promedio</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{formatCurrency(stats?.averageTicket || 0)}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-[#A78BFA]" />
                  <span className="text-sm text-neutral-400">Productos</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{stats?.totalProductsSold || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <span className="text-sm text-neutral-400">Utilidad</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{formatCurrency(stats?.totalProfit || 0)}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-5 h-5 text-primary-500" />
                  <span className="text-sm text-neutral-400">Margen</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{stats?.profitMargin || 0}%</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Sales */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  Ventas por Hora (Hoy)
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="hour" stroke="#a3a3a3" fontSize={10} />
                    <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                    />
                    <Bar dataKey="sales" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Trend */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Tendencia de Ventas (30 días)
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="date" stroke="#a3a3a3" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#4ADE80" strokeWidth={2} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Comparison & Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Comparison */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-warning" />
                  Comparativo Semanal
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="day" stroke="#a3a3a3" fontSize={12} />
                    <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name === 'current' ? 'Esta semana' : 'Semana anterior']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="current" stroke="#4ADE80" strokeWidth={2} dot={{ fill: '#4ADE80' }} name="Esta semana" />
                    <Line type="monotone" dataKey="previous" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#a3a3a3' }} name="Semana anterior" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Methods */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#A78BFA]" />
                  Métodos de Pago
                </h2>
                <div className="flex items-center justify-center h-[280px]">
                  {paymentReport.length > 0 ? (
                    <div className="flex items-center gap-8 w-full">
                      <ResponsiveContainer width="50%" height={200}>
                        <RePieChart>
                          <Pie
                            data={paymentReport}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="amount"
                            nameKey="method_label"
                          >
                            {paymentReport.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                            formatter={(value: number) => [formatCurrency(value), 'Monto']}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {paymentReport.map((pm, idx) => (
                          <div key={pm.method} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                              <span className="text-neutral-300">{pm.method_label}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-50">{formatCurrency(pm.amount)}</p>
                              <p className="text-xs text-neutral-400">{pm.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-400">No hay datos de pagos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Detail Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  Detalle de Ventas
                </h2>
                <button
                  onClick={() => handleExportCSV(salesDetail, 'ventas')}
                  className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Productos</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Método</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesDetail.length > 0 ? salesDetail.slice(0, 10).map((sale) => (
                      <tr key={sale.id} className="border-b border-neutral-800">
                        <td className="px-4 py-3 text-neutral-300">{new Date(sale.date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="px-4 py-3 text-neutral-400 font-mono text-sm">{sale.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-neutral-800 rounded text-neutral-300 text-sm">{sale.items_count} items</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sale.payment_method === 'cash' ? 'bg-success/20 text-success' :
                            sale.payment_method === 'card' ? 'bg-primary-500/20 text-primary-500' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-50">{formatCurrency(sale.total)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-success">{formatCurrency(sale.profit)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No hay ventas en el período seleccionado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'productos' && (
          <motion.div
            key="productos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products Chart */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Top 10 Productos por Ingresos
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis type="number" stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" stroke="#a3a3a3" fontSize={11} width={120} tick={{ fill: '#a3a3a3' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    />
                    <Bar dataKey="revenue" fill="#4ADE80" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary-500" />
                  Ventas por Categoría
                </h2>
                {categoryReport.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={300}>
                      <RePieChart>
                        <Pie
                          data={categoryReport}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="revenue"
                          nameKey="category_name"
                        >
                          {categoryReport.map((cat, index) => (
                            <Cell key={`cell-${index}`} fill={cat.category_color || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                          formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto">
                      {categoryReport.map((cat) => (
                        <div key={cat.category_id} className="flex items-center justify-between p-2 rounded hover:bg-neutral-800">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color || '#22D3EE' }} />
                            <span className="text-neutral-300 text-sm">{cat.category_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-50 text-sm">{formatCurrency(cat.revenue)}</p>
                            <p className="text-xs text-neutral-400">{cat.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-neutral-400">No hay datos de categorías</div>
                )}
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
                  <Package className="w-5 h-5 text-success" />
                  Productos Más Vendidos
                </h2>
                <button
                  onClick={() => handleExportCSV(topProducts, 'productos_top')}
                  className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Vendidos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Precio Prom.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Ingresos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Utilidad</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.id} className="border-b border-neutral-800">
                        <td className="px-4 py-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-warning text-neutral-950' :
                            index === 1 ? 'bg-neutral-400 text-neutral-950' :
                            index === 2 ? 'bg-orange-600 text-neutral-50' :
                            'bg-neutral-700 text-neutral-300'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${product.category_color || '#22D3EE'}20` }}>
                              <Package className="w-5 h-5" style={{ color: product.category_color || '#22D3EE' }} />
                            </div>
                            <span className="font-medium text-neutral-50">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${product.category_color || '#22D3EE'}20`, color: product.category_color || '#22D3EE' }}>
                            {product.category_name || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-50">{product.quantity_sold}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{formatCurrency(product.avg_price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-50">{formatCurrency(product.revenue)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-success">{formatCurrency(product.profit)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${product.profit_margin >= 30 ? 'text-success' : product.profit_margin >= 15 ? 'text-warning' : 'text-error'}`}>
                            {product.profit_margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Performing Products */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-warning" />
                  Productos con Bajo Rendimiento
                </h2>
                <span className="text-sm text-neutral-400">Últimos 30 días</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Vendidos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Ingresos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowProducts.map((product) => (
                      <tr key={product.id} className="border-b border-neutral-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/20">
                              <AlertTriangle className="w-5 h-5 text-warning" />
                            </div>
                            <span className="font-medium text-neutral-50">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${product.category_color || '#22D3EE'}20`, color: product.category_color || '#22D3EE' }}>
                            {product.category_name || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-50">{product.quantity_sold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-300">{formatCurrency(product.revenue)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-warning/20 text-warning">Bajo movimiento</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'inventario' && (
          <motion.div
            key="inventario"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Inventory Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-primary-500" />
                  <span className="text-xs text-neutral-400">Productos</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{inventoryStats?.total_products || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-[#A78BFA]" />
                  <span className="text-xs text-neutral-400">Categorías</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{inventoryStats?.categories_count || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span className="text-xs text-neutral-400">Valor</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{formatCurrency(inventoryStats?.total_value || 0)}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  <span className="text-xs text-neutral-400">Potencial</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{formatCurrency(inventoryStats?.potential_revenue || 0)}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-neutral-400" />
                  <span className="text-xs text-neutral-400">Stock Prom.</span>
                </div>
                <p className="text-xl font-bold text-neutral-50">{inventoryStats?.avg_stock_level || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span className="text-xs text-neutral-400">Stock Bajo</span>
                </div>
                <p className="text-xl font-bold text-warning">{inventoryStats?.low_stock_count || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <span className="text-xs text-neutral-400">Sin Stock</span>
                </div>
                <p className="text-xl font-bold text-error">{inventoryStats?.out_of_stock_count || 0}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-[#A78BFA]" />
                  <span className="text-xs text-neutral-400">Exceso</span>
                </div>
                <p className="text-xl font-bold text-[#A78BFA]">{inventoryStats?.overstocked_count || 0}</p>
              </div>
            </div>

            {/* Inventory Products */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-500" />
                  Inventario de Productos
                </h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value as typeof inventoryFilter)}
                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">Todos</option>
                    <option value="low_stock">Stock Bajo</option>
                    <option value="out_of_stock">Sin Stock</option>
                    <option value="overstock">Exceso</option>
                  </select>
                  <button
                    onClick={() => handleExportCSV(inventoryProducts, 'inventario')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-primary-500 hover:text-primary-400 border border-neutral-700 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Stock</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Mín.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Costo</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Precio</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Valor Stock</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-300">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryProducts
                      .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .slice(0, 20)
                      .map((product) => (
                        <tr key={product.id} className="border-b border-neutral-800">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${product.category_color || '#22D3EE'}20` }}>
                                <Package className="w-5 h-5" style={{ color: product.category_color || '#22D3EE' }} />
                              </div>
                              <span className="font-medium text-neutral-50">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${product.category_color || '#22D3EE'}20`, color: product.category_color || '#22D3EE' }}>
                              {product.category_name || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-neutral-50">{product.stock}</td>
                          <td className="px-4 py-3 text-right text-neutral-400">{product.min_stock}</td>
                          <td className="px-4 py-3 text-right text-neutral-300">{formatCurrency(product.cost)}</td>
                          <td className="px-4 py-3 text-right text-neutral-50">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-success">{formatCurrency(product.stock_value)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              product.status === 'out_of_stock' ? 'bg-error/20 text-error' :
                              product.status === 'low_stock' ? 'bg-warning/20 text-warning' :
                              product.status === 'overstock' ? 'bg-[#A78BFA]/20 text-[#A78BFA]' :
                              'bg-success/20 text-success'
                            }`}>
                              {product.status === 'out_of_stock' ? 'Sin Stock' :
                               product.status === 'low_stock' ? 'Stock Bajo' :
                               product.status === 'overstock' ? 'Exceso' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier Report */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-500" />
                  Reporte de Proveedores
                </h2>
                <button
                  onClick={() => handleExportCSV(supplierReport, 'proveedores')}
                  className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Proveedor</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Órdenes</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Total Compras</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Promedio</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-300">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierReport.length > 0 ? supplierReport.map((supplier) => (
                      <tr key={supplier.supplier_id} className="border-b border-neutral-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-500/20">
                              <Truck className="w-5 h-5 text-primary-500" />
                            </div>
                            <span className="font-medium text-neutral-50">{supplier.supplier_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-50">{supplier.orders_count}</td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-50">{formatCurrency(supplier.total_amount)}</td>
                        <td className="px-4 py-3 text-right text-neutral-300">{formatCurrency(supplier.avg_order)}</td>
                        <td className="px-4 py-3 text-right text-neutral-400">
                          {supplier.last_purchase ? new Date(supplier.last_purchase).toLocaleDateString('es-MX') : 'N/A'}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No hay datos de proveedores</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'financiero' && (
          <motion.div
            key="financiero"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Financial Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <span className="text-neutral-300">Ventas Totales</span>
                </div>
                <p className="text-2xl font-bold text-neutral-50">{formatCurrency(financialReport?.total_sales || 0)}</p>
                {comparativeReport && (
                  <p className={`text-sm mt-2 flex items-center gap-1 ${comparativeReport.changes.sales >= 0 ? 'text-success' : 'text-error'}`}>
                    {comparativeReport.changes.sales >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatPercent(comparativeReport.changes.sales)} vs período anterior
                  </p>
                )}
              </div>

              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-error" />
                  </div>
                  <span className="text-neutral-300">Costo de Ventas</span>
                </div>
                <p className="text-2xl font-bold text-neutral-50">{formatCurrency(financialReport?.total_cost || 0)}</p>
                <p className="text-sm mt-2 text-neutral-400">Costo de productos vendidos</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-500" />
                  </div>
                  <span className="text-neutral-300">Utilidad Bruta</span>
                </div>
                <p className="text-2xl font-bold text-neutral-50">{formatCurrency(financialReport?.gross_profit || 0)}</p>
                <p className="text-sm mt-2 text-primary-500">Margen: {financialReport?.profit_margin || 0}%</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-warning" />
                  </div>
                  <span className="text-neutral-300">Compras</span>
                </div>
                <p className="text-2xl font-bold text-neutral-50">{formatCurrency(financialReport?.total_purchases || 0)}</p>
                <p className="text-sm mt-2 text-warning">Ratio: {financialReport?.expense_ratio || 0}%</p>
              </div>
            </div>

            {/* Comparative Analysis */}
            {comparativeReport && (
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  Análisis Comparativo vs Período Anterior
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-400 mb-2">Ventas</p>
                    <p className="text-xl font-bold text-neutral-50">{formatCurrency(comparativeReport.current_period.sales)}</p>
                    <p className="text-sm text-neutral-400 mt-1">Anterior: {formatCurrency(comparativeReport.previous_period.sales)}</p>
                    <p className={`text-sm mt-2 font-semibold ${comparativeReport.changes.sales >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(comparativeReport.changes.sales)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-400 mb-2">Transacciones</p>
                    <p className="text-xl font-bold text-neutral-50">{comparativeReport.current_period.transactions}</p>
                    <p className="text-sm text-neutral-400 mt-1">Anterior: {comparativeReport.previous_period.transactions}</p>
                    <p className={`text-sm mt-2 font-semibold ${comparativeReport.changes.transactions >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(comparativeReport.changes.transactions)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-400 mb-2">Ticket Promedio</p>
                    <p className="text-xl font-bold text-neutral-50">{formatCurrency(comparativeReport.current_period.avgTicket)}</p>
                    <p className="text-sm text-neutral-400 mt-1">Anterior: {formatCurrency(comparativeReport.previous_period.avgTicket)}</p>
                    <p className={`text-sm mt-2 font-semibold ${comparativeReport.changes.avgTicket >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(comparativeReport.changes.avgTicket)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-neutral-800 rounded-xl">
                    <p className="text-sm text-neutral-400 mb-2">Utilidad</p>
                    <p className="text-xl font-bold text-neutral-50">{formatCurrency(comparativeReport.current_period.profit)}</p>
                    <p className="text-sm text-neutral-400 mt-1">Anterior: {formatCurrency(comparativeReport.previous_period.profit)}</p>
                    <p className={`text-sm mt-2 font-semibold ${comparativeReport.changes.profit >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatPercent(comparativeReport.changes.profit)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* P&L Summary */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-success" />
                  Estado de Resultados
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Ventas Totales</span>
                    <span className="font-semibold text-success">{formatCurrency(financialReport?.total_sales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">(-) Costo de Ventas</span>
                    <span className="font-semibold text-error">-{formatCurrency(financialReport?.total_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700 bg-neutral-800 -mx-6 px-6">
                    <span className="text-neutral-50 font-semibold">Utilidad Bruta</span>
                    <span className="font-bold text-primary-500">{formatCurrency(financialReport?.gross_profit || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Compras del Período</span>
                    <span className="font-semibold text-warning">{formatCurrency(financialReport?.total_purchases || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-success/10 -mx-6 px-6 rounded-lg">
                    <span className="text-neutral-50 font-bold">Utilidad Neta</span>
                    <span className="font-bold text-success text-xl">{formatCurrency(financialReport?.net_profit || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Asset Summary */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#A78BFA]" />
                  Resumen de Activos
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Valor de Inventario</span>
                    <span className="font-semibold text-neutral-50">{formatCurrency(financialReport?.inventory_value || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Ingresos Potenciales</span>
                    <span className="font-semibold text-success">{formatCurrency(inventoryStats?.potential_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Productos Totales</span>
                    <span className="font-semibold text-neutral-50">{inventoryStats?.total_products || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-700">
                    <span className="text-neutral-300">Stock Promedio</span>
                    <span className="font-semibold text-neutral-50">{inventoryStats?.avg_stock_level || 0} unidades</span>
                  </div>
                </div>

                {/* Key Ratios */}
                <div className="mt-6 pt-4 border-t border-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-400 mb-3">Indicadores Clave</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Margen de Utilidad</p>
                      <p className={`text-lg font-bold ${(financialReport?.profit_margin || 0) >= 25 ? 'text-success' : (financialReport?.profit_margin || 0) >= 15 ? 'text-warning' : 'text-error'}`}>
                        {financialReport?.profit_margin || 0}%
                      </p>
                    </div>
                    <div className="bg-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-400">Ratio de Gastos</p>
                      <p className={`text-lg font-bold ${(financialReport?.expense_ratio || 0) <= 30 ? 'text-success' : (financialReport?.expense_ratio || 0) <= 50 ? 'text-warning' : 'text-error'}`}>
                        {financialReport?.expense_ratio || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
