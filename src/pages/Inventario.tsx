import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  X,
  RefreshCw,
  History,
  Bell,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchInventory,
  adjustStock,
  getInventoryStats,
  getStockMovements,
  getInventoryAlerts,
  getInventoryByCategory,
  getInventoryValuation,
  updateStockLevels,
  type InventoryProduct,
  type StockMovement,
  type InventoryStats,
  type InventoryAlert,
  type CategoryInventory,
} from '@/lib/api/inventory';
import { fetchCategories, type Category } from '@/lib/api/categories';

type TabType = 'inventario' | 'movimientos' | 'alertas' | 'valuacion';
type StatusFilter = 'all' | 'low_stock' | 'out_of_stock' | 'normal' | 'overstock';

export function Inventario() {
  const [activeTab, setActiveTab] = useState<TabType>('inventario');
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [categoryInventory, setCategoryInventory] = useState<CategoryInventory[]>([]);
  const [valuation, setValuation] = useState<{ by_category: any[]; total_cost: number; total_value: number; total_margin: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [adjustment, setAdjustment] = useState({
    type: 'entrada' as 'entrada' | 'salida' | 'ajuste' | 'merma' | 'devolucion',
    quantity: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [movementType, setMovementType] = useState('');
  const [movementPage, setMovementPage] = useState(0);

  // Levels modal
  const [newLevels, setNewLevels] = useState({ min_stock: 0, max_stock: 100 });

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [productsData, statsData, categoriesData] = await Promise.all([
        fetchInventory(),
        getInventoryStats(),
        fetchCategories(),
      ]);
      setProducts(productsData);
      setStats(statsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const { movements: data, total } = await getStockMovements({
        type: movementType || undefined,
        limit: 20,
        offset: movementPage * 20,
      });
      setMovements(data);
      setMovementsTotal(total);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await getInventoryAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadValuation = async () => {
    try {
      const [catInv, val] = await Promise.all([
        getInventoryByCategory(),
        getInventoryValuation(),
      ]);
      setCategoryInventory(catInv);
      setValuation(val);
    } catch (error) {
      console.error('Error loading valuation:', error);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    if (activeTab === 'movimientos') {
      loadMovements();
    } else if (activeTab === 'alertas') {
      loadAlerts();
    } else if (activeTab === 'valuacion') {
      loadValuation();
    }
  }, [activeTab, movementType, movementPage]);

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustment.quantity) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const qty = parseInt(adjustment.quantity);
      await adjustStock(selectedProduct.id, {
        type: adjustment.type,
        quantity: qty,
        reason: adjustment.reason || undefined,
      });
      toast.success(`Stock actualizado: ${selectedProduct.name}`);
      setShowAdjustModal(false);
      setAdjustment({ type: 'entrada', quantity: '', reason: '' });
      loadInventoryData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Error al ajustar stock');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLevels = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      await updateStockLevels(selectedProduct.id, newLevels);
      toast.success('Niveles actualizados');
      setShowLevelsModal(false);
      loadInventoryData();
    } catch (error) {
      toast.error('Error al actualizar niveles');
    } finally {
      setSaving(false);
    }
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(search));
    }

    if (categoryFilter) {
      result = result.filter(p => p.category_id === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => {
        if (statusFilter === 'out_of_stock') return p.stock === 0;
        if (statusFilter === 'low_stock') return p.stock > 0 && p.stock <= p.min_stock;
        if (statusFilter === 'normal') return p.stock > p.min_stock && p.stock <= p.max_stock;
        if (statusFilter === 'overstock') return p.stock > p.max_stock;
        return true;
      });
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof InventoryProduct];
        const bVal = b[sortConfig.key as keyof InventoryProduct];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, searchTerm, categoryFilter, statusFilter, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const exportToCSV = () => {
    const headers = ['Producto', 'Stock', 'Min', 'Max', 'Costo', 'Precio', 'Valor', 'Estado'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.stock,
      p.min_stock,
      p.max_stock,
      p.cost.toFixed(2),
      p.price.toFixed(2),
      (p.stock * p.cost).toFixed(2),
      p.stock === 0 ? 'Sin Stock' : p.stock <= p.min_stock ? 'Stock Bajo' : 'Normal',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Inventario exportado');
  };

  const getStatusBadge = (product: InventoryProduct) => {
    if (product.stock === 0) {
      return (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-error/20 text-error flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" /> Sin Stock
        </span>
      );
    }
    if (product.stock <= product.min_stock) {
      return (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Stock Bajo
        </span>
      );
    }
    if (product.stock > product.max_stock) {
      return (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1 w-fit">
          <TrendingUp className="w-3 h-3" /> Exceso
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-success/20 text-success flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" /> Normal
      </span>
    );
  };

  const tabs = [
    { id: 'inventario' as const, label: 'Inventario', icon: Package },
    { id: 'movimientos' as const, label: 'Movimientos', icon: History },
    { id: 'alertas' as const, label: 'Alertas', icon: Bell, badge: alerts.length },
    { id: 'valuacion' as const, label: 'Valuacion', icon: BarChart3 },
  ];

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
          <h1 className="text-3xl font-bold text-neutral-50">Inventario</h1>
          <p className="text-neutral-400 mt-1">Control y gestion integral de stock</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={loadInventoryData}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Warehouse className="w-4 h-4 text-primary-500" />
              <span className="text-xs text-neutral-400">Stock Total</span>
            </div>
            <p className="text-2xl font-bold text-neutral-50">{stats.totalStock.toLocaleString()}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-xs text-neutral-400">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-success">${stats.totalValue.toLocaleString()}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-neutral-400">Ganancia Pot.</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">${stats.potentialProfit.toLocaleString()}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs text-neutral-400">Stock Bajo</span>
            </div>
            <p className="text-2xl font-bold text-warning">{stats.lowStockCount}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-error" />
              <span className="text-xs text-neutral-400">Sin Stock</span>
            </div>
            <p className="text-2xl font-bold text-error">{stats.outOfStockCount}</p>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">Productos</span>
            </div>
            <p className="text-2xl font-bold text-neutral-50">{stats.totalProducts}</p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-800/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-neutral-950'
                : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-neutral-950/30 text-neutral-50' : 'bg-error text-white'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'inventario' && (
          <motion.div
            key="inventario"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
              >
                <option value="">Todas las categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
              >
                <option value="all">Todos los estados</option>
                <option value="normal">Normal</option>
                <option value="low_stock">Stock Bajo</option>
                <option value="out_of_stock">Sin Stock</option>
                <option value="overstock">Exceso</option>
              </select>

              <span className="text-sm text-neutral-400">
                {filteredProducts.length} productos
              </span>
            </div>

            {/* Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-neutral-50">
                          Producto
                          {sortConfig?.key === 'name' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
                        <button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-neutral-50">
                          Stock
                          {sortConfig?.key === 'stock' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Min/Max</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
                        <button onClick={() => handleSort('cost')} className="flex items-center gap-1 hover:text-neutral-50">
                          Valor
                          {sortConfig?.key === 'cost' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Dias Stock</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Estado</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-neutral-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockPercentage = Math.min(100, (product.stock / product.max_stock) * 100);
                      const stockColor = product.stock === 0
                        ? '#F87171'
                        : product.stock <= product.min_stock
                        ? '#FBBF24'
                        : product.stock > product.max_stock
                        ? '#60A5FA'
                        : '#4ADE80';

                      return (
                        <tr key={product.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${product.category_color || '#22D3EE'}20` }}
                              >
                                <Package className="w-5 h-5" style={{ color: product.category_color || '#22D3EE' }} />
                              </div>
                              <div>
                                <p className="font-medium text-neutral-50">{product.name}</p>
                                <p className="text-xs text-neutral-400">
                                  {product.category_name || 'Sin categoria'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <span className="text-lg font-semibold text-neutral-50">{product.stock}</span>
                              <div className="w-24 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${stockPercentage}%`, backgroundColor: stockColor }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <span className="text-neutral-400">Min: </span>
                              <span className="text-neutral-50">{product.min_stock}</span>
                              <span className="text-neutral-600 mx-1">/</span>
                              <span className="text-neutral-400">Max: </span>
                              <span className="text-neutral-50">{product.max_stock}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-neutral-50 font-medium">${(product.stock * product.cost).toFixed(2)}</p>
                              <p className="text-xs text-neutral-400">${product.cost.toFixed(2)} c/u</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-neutral-500" />
                              <span className={`${product.days_of_stock < 7 ? 'text-warning' : 'text-neutral-300'}`}>
                                {product.days_of_stock > 365 ? '+365' : product.days_of_stock} dias
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(product)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setNewLevels({ min_stock: product.min_stock, max_stock: product.max_stock });
                                  setShowLevelsModal(true);
                                }}
                                className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Configurar niveles"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowAdjustModal(true);
                                }}
                                className="px-3 py-1.5 text-sm bg-primary-500/20 text-primary-500 rounded-lg hover:bg-primary-500/30 transition-colors font-medium"
                              >
                                Ajustar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'movimientos' && (
          <motion.div
            key="movimientos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
              <select
                value={movementType}
                onChange={(e) => { setMovementType(e.target.value); setMovementPage(0); }}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos los tipos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
                <option value="ajuste">Ajustes</option>
                <option value="venta">Ventas</option>
                <option value="compra">Compras</option>
                <option value="merma">Mermas</option>
                <option value="devolucion">Devoluciones</option>
              </select>
              <span className="text-sm text-neutral-400">{movementsTotal} movimientos</span>
            </div>

            {/* Movements Table */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Fecha</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Producto</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Tipo</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Cantidad</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Stock</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Motivo</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => {
                    const isPositive = ['entrada', 'compra', 'devolucion', 'add'].includes(mov.type);
                    const typeColors: Record<string, string> = {
                      entrada: 'bg-success/20 text-success',
                      salida: 'bg-error/20 text-error',
                      ajuste: 'bg-blue-500/20 text-blue-400',
                      venta: 'bg-purple-500/20 text-purple-400',
                      compra: 'bg-success/20 text-success',
                      merma: 'bg-orange-500/20 text-orange-400',
                      devolucion: 'bg-cyan-500/20 text-cyan-400',
                      add: 'bg-success/20 text-success',
                      subtract: 'bg-error/20 text-error',
                    };
                    const typeLabels: Record<string, string> = {
                      entrada: 'Entrada',
                      salida: 'Salida',
                      ajuste: 'Ajuste',
                      venta: 'Venta',
                      compra: 'Compra',
                      merma: 'Merma',
                      devolucion: 'Devolucion',
                      add: 'Entrada',
                      subtract: 'Salida',
                    };

                    return (
                      <tr key={mov.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                        <td className="px-4 py-3 text-sm text-neutral-300">
                          {new Date(mov.created_at).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-neutral-50 font-medium">{mov.product_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[mov.type] || 'bg-neutral-700 text-neutral-300'}`}>
                            {typeLabels[mov.type] || mov.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${isPositive ? 'text-success' : 'text-error'}`}>
                            {isPositive ? '+' : '-'}{mov.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400">
                          {mov.previous_stock} → <span className="text-neutral-50">{mov.new_stock}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400 max-w-[200px] truncate">
                          {mov.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-400">{mov.user_name || 'Sistema'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700">
                <span className="text-sm text-neutral-400">
                  Pagina {movementPage + 1} de {Math.ceil(movementsTotal / 20)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementPage(p => Math.max(0, p - 1))}
                    disabled={movementPage === 0}
                    className="p-2 text-neutral-400 hover:text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMovementPage(p => p + 1)}
                    disabled={(movementPage + 1) * 20 >= movementsTotal}
                    className="p-2 text-neutral-400 hover:text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'alertas' && (
          <motion.div
            key="alertas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {alerts.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-12 text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-50 mb-2">Sin alertas</h3>
                <p className="text-neutral-400">Todos los productos tienen niveles de stock adecuados</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {alerts.map((alert) => {
                  const severityColors = {
                    critical: 'border-error bg-error/10',
                    high: 'border-orange-500 bg-orange-500/10',
                    medium: 'border-warning bg-warning/10',
                    low: 'border-blue-500 bg-blue-500/10',
                  };
                  const alertIcons = {
                    out_of_stock: XCircle,
                    low_stock: AlertTriangle,
                    overstock: TrendingUp,
                    expiring: Clock,
                  };
                  const AlertIcon = alertIcons[alert.alert_type] || AlertCircle;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 border rounded-lg ${severityColors[alert.severity]}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          alert.severity === 'critical' ? 'bg-error/20' :
                          alert.severity === 'high' ? 'bg-orange-500/20' :
                          alert.severity === 'medium' ? 'bg-warning/20' : 'bg-blue-500/20'
                        }`}>
                          <AlertIcon className={`w-6 h-6 ${
                            alert.severity === 'critical' ? 'text-error' :
                            alert.severity === 'high' ? 'text-orange-500' :
                            alert.severity === 'medium' ? 'text-warning' : 'text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-50">{alert.product_name}</p>
                          <p className="text-sm text-neutral-400">
                            {alert.alert_type === 'out_of_stock' && 'Sin stock disponible'}
                            {alert.alert_type === 'low_stock' && `Stock: ${alert.current_value} (Min: ${alert.threshold_value})`}
                            {alert.alert_type === 'overstock' && `Stock: ${alert.current_value} (Max: ${alert.threshold_value})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                          alert.severity === 'critical' ? 'bg-error text-white' :
                          alert.severity === 'high' ? 'bg-orange-500 text-white' :
                          alert.severity === 'medium' ? 'bg-warning text-neutral-900' : 'bg-blue-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                        <button
                          onClick={() => {
                            const product = products.find(p => p.id === alert.product_id);
                            if (product) {
                              setSelectedProduct(product);
                              setShowAdjustModal(true);
                            }
                          }}
                          className="px-4 py-2 bg-neutral-800 text-neutral-50 rounded-lg hover:bg-neutral-700 transition-colors text-sm font-medium"
                        >
                          Ajustar Stock
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'valuacion' && (
          <motion.div
            key="valuacion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            {valuation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Costo Total</p>
                      <p className="text-2xl font-bold text-blue-400">${valuation.total_cost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Valor de Venta</p>
                      <p className="text-2xl font-bold text-success">${valuation.total_value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Margen Potencial</p>
                      <p className="text-2xl font-bold text-primary-500">${valuation.total_margin.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-50 mb-4">Inventario por Categoria</h3>
              <div className="space-y-4">
                {categoryInventory.map((cat) => {
                  const percentage = valuation ? (cat.total_value / valuation.total_cost) * 100 : 0;
                  return (
                    <div key={cat.category_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.category_color }}
                          />
                          <span className="text-neutral-50 font-medium">{cat.category_name}</span>
                          <span className="text-sm text-neutral-400">({cat.products_count} productos)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-50 font-semibold">${cat.total_value.toLocaleString()}</span>
                          {cat.low_stock_count > 0 && (
                            <span className="ml-2 text-xs text-warning">
                              {cat.low_stock_count} en stock bajo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: cat.category_color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {showAdjustModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAdjustModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Ajustar Stock</h2>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-400">Producto</p>
                <p className="text-lg font-semibold text-neutral-50">{selectedProduct.name}</p>
                <p className="text-sm text-neutral-300">Stock actual: <span className="font-semibold">{selectedProduct.stock}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Tipo de movimiento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'entrada' as const, label: 'Entrada', icon: Plus, color: 'success' },
                      { type: 'salida' as const, label: 'Salida', icon: Minus, color: 'error' },
                      { type: 'ajuste' as const, label: 'Ajuste', icon: ArrowUpDown, color: 'blue-400' },
                      { type: 'merma' as const, label: 'Merma', icon: TrendingDown, color: 'orange-400' },
                    ].map(({ type, label, icon: Icon, color }) => (
                      <button
                        key={type}
                        onClick={() => setAdjustment({ ...adjustment, type })}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all text-sm ${
                          adjustment.type === type
                            ? `border-${color} bg-${color}/10 text-${color}`
                            : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        }`}
                        style={adjustment.type === type ? {
                          borderColor: color === 'success' ? '#4ADE80' : color === 'error' ? '#F87171' : color === 'blue-400' ? '#60A5FA' : '#FB923C',
                          backgroundColor: color === 'success' ? 'rgba(74, 222, 128, 0.1)' : color === 'error' ? 'rgba(248, 113, 113, 0.1)' : color === 'blue-400' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                          color: color === 'success' ? '#4ADE80' : color === 'error' ? '#F87171' : color === 'blue-400' ? '#60A5FA' : '#FB923C',
                        } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={adjustment.quantity}
                    onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Reposicion de inventario"
                  />
                </div>

                {adjustment.quantity && (
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-neutral-400 mb-1">Nuevo stock</p>
                    <p className="text-3xl font-bold text-primary-500">
                      {['entrada', 'compra', 'devolucion'].includes(adjustment.type)
                        ? selectedProduct.stock + parseInt(adjustment.quantity || '0')
                        : Math.max(0, selectedProduct.stock - parseInt(adjustment.quantity || '0'))}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAdjustModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdjustStock}
                    disabled={saving || !adjustment.quantity}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Levels Modal */}
      <AnimatePresence>
        {showLevelsModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowLevelsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Configurar Niveles</h2>
                <button onClick={() => setShowLevelsModal(false)} className="p-2 text-neutral-400 hover:text-neutral-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold text-neutral-50">{selectedProduct.name}</p>
                <p className="text-sm text-neutral-400">Stock actual: {selectedProduct.stock}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Stock Minimo (alerta)
                  </label>
                  <input
                    type="number"
                    value={newLevels.min_stock}
                    onChange={(e) => setNewLevels({ ...newLevels, min_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Stock Maximo
                  </label>
                  <input
                    type="number"
                    value={newLevels.max_stock}
                    onChange={(e) => setNewLevels({ ...newLevels, max_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                    min="0"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowLevelsModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateLevels}
                    disabled={saving}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Detalles del Producto</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 text-neutral-400 hover:text-neutral-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-neutral-800 rounded-lg">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${selectedProduct.category_color || '#22D3EE'}20` }}
                  >
                    <Package className="w-8 h-8" style={{ color: selectedProduct.category_color || '#22D3EE' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-50">{selectedProduct.name}</h3>
                    <p className="text-sm text-neutral-400">{selectedProduct.category_name || 'Sin categoria'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Stock Actual</p>
                    <p className="text-2xl font-bold text-neutral-50">{selectedProduct.stock}</p>
                  </div>
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Valor Inventario</p>
                    <p className="text-2xl font-bold text-success">${(selectedProduct.stock * selectedProduct.cost).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Costo Unitario</p>
                    <p className="text-xl font-semibold text-neutral-50">${selectedProduct.cost.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Precio Venta</p>
                    <p className="text-xl font-semibold text-primary-500">${selectedProduct.price.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Rango Stock</p>
                    <p className="text-lg text-neutral-50">{selectedProduct.min_stock} - {selectedProduct.max_stock}</p>
                  </div>
                  <div className="p-4 bg-neutral-800 rounded-lg">
                    <p className="text-sm text-neutral-400">Dias de Stock</p>
                    <p className="text-lg text-neutral-50">{selectedProduct.days_of_stock > 365 ? '+365' : selectedProduct.days_of_stock}</p>
                  </div>
                </div>

                <div className="pt-4">
                  {getStatusBadge(selectedProduct)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
