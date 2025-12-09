import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Search,
  Download,
  Filter,
  ChevronRight,
  Package,
  Target,
  Percent,
  Clock,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  getFinanceStats,
  getFinanceSummary,
  getMonthlyData,
  getDailyData,
  getCashFlowData,
  getTransactions,
  getExpenseDistribution,
  getPaymentMethodStats,
  getTopProducts,
  getHourlySales,
  getComparisonStats,
  type FinanceStats,
  type FinanceSummary,
  type MonthlyData,
  type DailyData,
  type CashFlowData,
  type Transaction,
  type TransactionFilters,
  type ExpenseCategory,
  type PaymentMethodStats,
  type TopProduct,
} from '@/lib/api/finances';

type TabType = 'overview' | 'transactions' | 'cashflow' | 'analytics';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3 },
  { id: 'transactions', label: 'Transacciones', icon: ArrowRightLeft },
  { id: 'cashflow', label: 'Flujo de Caja', icon: Wallet },
  { id: 'analytics', label: 'Analisis', icon: Target },
];

const pieColors = ['#22D3EE', '#4ADE80', '#FBBF24', '#A78BFA', '#F87171', '#FB923C'];

export function Finanzas() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStats[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [hourlySales, setHourlySales] = useState<{ hour: number; sales: number; count: number }[]>([]);
  const [comparison, setComparison] = useState({ salesGrowth: 0, profitGrowth: 0, expenseGrowth: 0, ticketGrowth: 0 });

  // Filters
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        summaryData,
        monthly,
        daily,
        cashFlow,
        txns,
        expenses,
        payments,
        products,
        hourly,
        comp,
      ] = await Promise.all([
        getFinanceStats(),
        getFinanceSummary(),
        getMonthlyData(12),
        getDailyData(30),
        getCashFlowData(6),
        getTransactions(transactionFilters, 100),
        getExpenseDistribution(),
        getPaymentMethodStats(),
        getTopProducts(10),
        getHourlySales(),
        getComparisonStats(),
      ]);

      setStats(statsData);
      setSummary(summaryData);
      setMonthlyData(monthly);
      setDailyData(daily);
      setCashFlowData(cashFlow);
      setTransactions(txns);
      setExpenseCategories(expenses);
      setPaymentMethods(payments);
      setTopProducts(products);
      setHourlySales(hourly);
      setComparison(comp);
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load transactions when filters change
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const txns = await getTransactions({ ...transactionFilters, search: searchTerm }, 100);
        setTransactions(txns);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    };
    if (!loading) {
      loadTransactions();
    }
  }, [transactionFilters, searchTerm]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const search = searchTerm.toLowerCase();
    return transactions.filter(t =>
      t.description.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search)
    );
  }, [transactions, searchTerm]);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoria', 'Descripcion', 'Monto', 'Metodo de Pago'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('es-ES'),
      t.type === 'income' ? 'Ingreso' : 'Egreso',
      t.category,
      t.description,
      t.amount.toFixed(2),
      t.payment_method || '-',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transacciones exportadas');
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatGrowth = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Finanzas</h1>
          <p className="text-neutral-300 mt-1">Control financiero integral del negocio</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-xl border border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -4, borderColor: '#4ADE80' }}
                className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                    comparison.salesGrowth >= 0 ? 'text-success bg-success/20' : 'text-error bg-error/20'
                  }`}>
                    {comparison.salesGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatGrowth(comparison.salesGrowth)}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm mb-1">Ingresos Totales</p>
                <p className="text-3xl font-bold text-neutral-50">{formatCurrency(stats?.totalSales || 0)}</p>
                <p className="text-xs text-neutral-500 mt-2">Margen: {stats?.profitMargin || 0}%</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, borderColor: '#F87171' }}
                className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-error" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                    comparison.expenseGrowth <= 0 ? 'text-success bg-success/20' : 'text-error bg-error/20'
                  }`}>
                    {comparison.expenseGrowth <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    {formatGrowth(comparison.expenseGrowth)}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm mb-1">Gastos Totales</p>
                <p className="text-3xl font-bold text-neutral-50">{formatCurrency(stats?.totalExpenses || 0)}</p>
                <p className="text-xs text-neutral-500 mt-2">Ratio: {stats?.expenseRatio || 0}%</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, borderColor: '#22D3EE' }}
                className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary-500" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                    comparison.profitGrowth >= 0 ? 'text-success bg-success/20' : 'text-error bg-error/20'
                  }`}>
                    {comparison.profitGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatGrowth(comparison.profitGrowth)}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm mb-1">Ganancia Neta</p>
                <p className={`text-3xl font-bold ${(stats?.netProfit || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(stats?.netProfit || 0)}
                </p>
                <p className="text-xs text-neutral-500 mt-2">Bruta: {formatCurrency(stats?.grossProfit || 0)}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, borderColor: '#A78BFA' }}
                className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
                    <PiggyBank className="w-6 h-6 text-[#A78BFA]" />
                  </div>
                </div>
                <p className="text-neutral-300 text-sm mb-1">Valor Inventario</p>
                <p className="text-3xl font-bold text-neutral-50">{formatCurrency(stats?.inventoryValue || 0)}</p>
                <p className="text-xs text-neutral-500 mt-2">Activos en stock</p>
              </motion.div>
            </div>

            {/* Period Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {summary && Object.entries(summary).map(([key, period]) => (
                <div key={key} className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                  <p className="text-sm text-neutral-400 mb-2">{period.period}</p>
                  <p className="text-xl font-bold text-neutral-50">{formatCurrency(period.sales)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-500">{period.salesCount} ventas</span>
                    <span className={`text-xs font-medium ${period.profit >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(period.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-6">Ingresos vs Gastos (12 meses)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData.map(m => ({
                    name: m.monthName,
                    ingresos: m.sales,
                    gastos: m.expenses,
                    ganancia: m.profit,
                  }))}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} />
                    <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ingresos" stroke="#4ADE80" strokeWidth={2} fill="url(#colorIngresos)" />
                    <Area type="monotone" dataKey="gastos" stroke="#F87171" strokeWidth={2} fill="url(#colorGastos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Methods */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-6">Metodos de Pago</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="method"
                    >
                      {paymentMethods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {paymentMethods.map((method, index) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                        <span className="text-sm text-neutral-300">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-neutral-50">{method.percentage}%</span>
                        <span className="text-xs text-neutral-500 ml-2">({method.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions & Expense Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-neutral-50">Ultimos Movimientos</h2>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedTransaction(tx)}
                      className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-success/20' : 'bg-error/20'
                        }`}>
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-error" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-50">{tx.description}</p>
                          <p className="text-xs text-neutral-400">
                            {new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay movimientos recientes</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Distribution */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-6">Distribucion de Gastos por Proveedor</h2>
                {expenseCategories.length > 0 ? (
                  <div className="space-y-4">
                    {expenseCategories.slice(0, 6).map((cat, index) => (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-300">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-50">{formatCurrency(cat.amount)}</span>
                            <span className="text-xs text-neutral-500">({cat.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay datos de gastos</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar transaccion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
              </div>

              <select
                value={transactionFilters.type || 'all'}
                onChange={(e) => setTransactionFilters({ ...transactionFilters, type: e.target.value as 'all' | 'income' | 'expense' })}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Egresos</option>
              </select>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <input
                  type="date"
                  value={transactionFilters.date_from || ''}
                  onChange={(e) => setTransactionFilters({ ...transactionFilters, date_from: e.target.value })}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
                <span className="text-neutral-500">-</span>
                <input
                  type="date"
                  value={transactionFilters.date_to || ''}
                  onChange={(e) => setTransactionFilters({ ...transactionFilters, date_to: e.target.value })}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
              </div>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400">Total Transacciones</p>
                <p className="text-2xl font-bold text-neutral-50">{filteredTransactions.length}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400">Total Ingresos</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400">Total Egresos</p>
                <p className="text-2xl font-bold text-error">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <p className="text-sm text-neutral-400">Balance</p>
                <p className={`text-2xl font-bold ${
                  filteredTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0) >= 0
                    ? 'text-success' : 'text-error'
                }`}>
                  {formatCurrency(filteredTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0))}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Descripcion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Metodo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="hover:bg-neutral-800 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-neutral-300">
                          {new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            tx.type === 'income' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                          }`}>
                            {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-50">{tx.description}</td>
                        <td className="px-4 py-3 text-sm text-neutral-400">{tx.category}</td>
                        <td className="px-4 py-3 text-sm text-neutral-400">{tx.payment_method || '-'}</td>
                        <td className={`px-4 py-3 text-sm font-semibold text-right ${
                          tx.type === 'income' ? 'text-success' : 'text-error'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-neutral-400">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron transacciones</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'cashflow' && (
          <motion.div
            key="cashflow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Cash Flow Chart */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-neutral-50 mb-6">Flujo de Caja Mensual</h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="period" stroke="#a3a3a3" fontSize={12} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Bar dataKey="inflow" name="Entradas" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="Salidas" fill="#F87171" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="cumulative" name="Acumulado" stroke="#22D3EE" strokeWidth={3} dot={{ fill: '#22D3EE' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Cash Flow Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-50">Detalle por Periodo</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Periodo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Entradas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Salidas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Flujo Neto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {cashFlowData.map((row) => (
                      <tr key={row.period} className="hover:bg-neutral-800">
                        <td className="px-4 py-3 text-sm font-medium text-neutral-50">{row.period}</td>
                        <td className="px-4 py-3 text-sm text-success text-right">{formatCurrency(row.inflow)}</td>
                        <td className="px-4 py-3 text-sm text-error text-right">{formatCurrency(row.outflow)}</td>
                        <td className={`px-4 py-3 text-sm font-semibold text-right ${row.net >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatCurrency(row.net)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold text-right ${row.cumulative >= 0 ? 'text-primary-400' : 'text-error'}`}>
                          {formatCurrency(row.cumulative)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-neutral-50 mb-6">Tendencia Diaria (Ultimos 30 dias)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData.slice(-14)}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="date" stroke="#a3a3a3" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Area type="monotone" dataKey="sales" name="Ventas" stroke="#22D3EE" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Margen de Ganancia</p>
                    <p className="text-xl font-bold text-neutral-50">{stats?.profitMargin || 0}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Crecimiento Ventas</p>
                    <p className={`text-xl font-bold ${comparison.salesGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatGrowth(comparison.salesGrowth)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Ticket Promedio</p>
                    <p className="text-xl font-bold text-neutral-50">{formatCurrency(summary?.thisMonth.avgTicket || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Ratio Gastos</p>
                    <p className="text-xl font-bold text-neutral-50">{stats?.expenseRatio || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products & Hourly Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-6">Top 10 Productos por Ingresos</h2>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-50 truncate">{product.product_name}</p>
                        <p className="text-xs text-neutral-400">{product.quantity_sold} vendidos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-50">{formatCurrency(product.revenue)}</p>
                        <p className={`text-xs ${product.profit_margin >= 30 ? 'text-success' : product.profit_margin >= 15 ? 'text-warning' : 'text-error'}`}>
                          {product.profit_margin}% margen
                        </p>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay datos de productos</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hourly Sales */}
              <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-neutral-50 mb-6">Ventas por Hora (Hoy)</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={hourlySales.filter(h => h.hour >= 6 && h.hour <= 22)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis
                      dataKey="hour"
                      stroke="#a3a3a3"
                      fontSize={12}
                      tickFormatter={(h) => `${h}:00`}
                    />
                    <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [
                        name === 'sales' ? formatCurrency(value) : value,
                        name === 'sales' ? 'Ventas' : 'Transacciones'
                      ]}
                      labelFormatter={(h) => `${h}:00 - ${h}:59`}
                    />
                    <Bar dataKey="sales" name="Ventas" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Profit Chart */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-neutral-50 mb-6">Evolucion de Ganancias Mensuales</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="monthName" stroke="#a3a3a3" fontSize={12} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#4ADE80" strokeWidth={3} dot={{ fill: '#4ADE80', r: 4 }} />
                  <Line type="monotone" dataKey="sales" name="Ventas" stroke="#22D3EE" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-50">Detalle de Transaccion</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    selectedTransaction.type === 'income' ? 'bg-success/20' : 'bg-error/20'
                  }`}>
                    {selectedTransaction.type === 'income' ? (
                      <ArrowUpRight className="w-7 h-7 text-success" />
                    ) : (
                      <ArrowDownRight className="w-7 h-7 text-error" />
                    )}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      selectedTransaction.type === 'income' ? 'text-success' : 'text-error'
                    }`}>
                      {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction.type === 'income' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    }`}>
                      {selectedTransaction.type === 'income' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-700">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Descripcion</span>
                    <span className="text-neutral-50 font-medium">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Categoria</span>
                    <span className="text-neutral-50">{selectedTransaction.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Fecha</span>
                    <span className="text-neutral-50">
                      {new Date(selectedTransaction.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {selectedTransaction.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Metodo de Pago</span>
                      <span className="text-neutral-50 capitalize">{selectedTransaction.payment_method}</span>
                    </div>
                  )}
                  {selectedTransaction.reference && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Referencia</span>
                      <span className="text-neutral-50 font-mono text-sm">{selectedTransaction.reference.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
