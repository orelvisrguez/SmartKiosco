import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Package,
  X,
  Check,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Boxes,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';
import {
  fetchPurchases,
  createPurchase,
  updatePurchaseStatus,
  receivePurchase,
  deletePurchase,
  getPurchaseStats,
  getPurchaseById,
  getPurchasesBySupplier,
  getPurchasesByMonth,
  getMostPurchasedProducts,
  type PurchaseWithDetails,
  type PurchaseStats,
  type PurchasesBySupplier,
  type PurchasesByMonth,
  type DBPurchaseItem,
} from '@/lib/api/purchases';
import { fetchSuppliers, type DBSupplier } from '@/lib/api/suppliers';
import { fetchProducts, type DBProduct } from '@/lib/api/products';

type TabType = 'orders' | 'analytics' | 'products';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function Compras() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [stats, setStats] = useState<PurchaseStats>({
    total: 0, pending: 0, received: 0, cancelled: 0,
    totalAmount: 0, receivedAmount: 0, pendingAmount: 0,
    avgOrderValue: 0, thisMonthOrders: 0, thisMonthAmount: 0,
    lastMonthOrders: 0, lastMonthAmount: 0, growthPercent: 0,
  });
  const [purchasesBySupplier, setPurchasesBySupplier] = useState<PurchasesBySupplier[]>([]);
  const [purchasesByMonth, setPurchasesByMonth] = useState<PurchasesByMonth[]>([]);
  const [mostPurchased, setMostPurchased] = useState<Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_amount: number;
    orders_count: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithDetails | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; cost: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received' | 'cancelled'>('all');
  const [supplierFilter, setSupplierFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesData, suppliersData, productsData, statsData, bySupplier, byMonth, topProducts] = await Promise.all([
        fetchPurchases(),
        fetchSuppliers(),
        fetchProducts(),
        getPurchaseStats(),
        getPurchasesBySupplier(),
        getPurchasesByMonth(),
        getMostPurchasedProducts(10),
      ]);
      setPurchases(purchasesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setStats(statsData);
      setPurchasesBySupplier(bySupplier);
      setPurchasesByMonth(byMonth);
      setMostPurchased(topProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPurchases = useMemo(() => {
    let result = [...purchases];

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (supplierFilter) {
      result = result.filter(p => p.supplier_id === supplierFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.id.toLowerCase().includes(search) ||
        p.supplier_name?.toLowerCase().includes(search) ||
        p.notes?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [purchases, statusFilter, supplierFilter, searchTerm]);

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { productId: '', quantity: 1, cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].cost = product.cost;
      }
    }

    setPurchaseItems(updated);
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((acc, item) => acc + item.quantity * item.cost, 0);
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      toast.error('Selecciona un proveedor y agrega productos');
      return;
    }

    const validItems = purchaseItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto valido');
      return;
    }

    setSaving(true);
    try {
      await createPurchase({
        supplier_id: selectedSupplier,
        items: validItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          cost: item.cost,
        })),
        notes: notes || undefined,
      });
      toast.success('Orden de compra creada');
      setShowModal(false);
      setSelectedSupplier('');
      setPurchaseItems([]);
      setNotes('');
      loadData();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error al crear orden de compra');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = async (purchase: PurchaseWithDetails) => {
    try {
      const details = await getPurchaseById(purchase.id);
      if (details) {
        setSelectedPurchase(details);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error loading purchase details:', error);
      toast.error('Error al cargar detalles');
    }
  };

  const handleReceivePurchase = async (purchase: PurchaseWithDetails) => {
    if (confirm('¿Confirmar recepcion de esta orden? El stock sera actualizado.')) {
      try {
        await receivePurchase(purchase.id);
        toast.success('Compra recibida y stock actualizado');
        setShowDetailModal(false);
        loadData();
      } catch (error) {
        console.error('Error receiving purchase:', error);
        toast.error('Error al recibir compra');
      }
    }
  };

  const handleCancelPurchase = async (purchaseId: string) => {
    if (confirm('¿Cancelar esta orden de compra?')) {
      try {
        await updatePurchaseStatus(purchaseId, 'cancelled');
        toast.success('Orden cancelada');
        setShowDetailModal(false);
        loadData();
      } catch (error) {
        console.error('Error cancelling purchase:', error);
        toast.error('Error al cancelar orden');
      }
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (confirm('¿Eliminar esta orden permanentemente?')) {
      try {
        await deletePurchase(purchaseId);
        toast.success('Orden eliminada');
        setShowDetailModal(false);
        loadData();
      } catch (error: any) {
        console.error('Error deleting purchase:', error);
        toast.error(error.message || 'Error al eliminar orden');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Proveedor', 'Items', 'Total', 'Estado', 'Fecha'];
    const rows = filteredPurchases.map(p => [
      p.id.slice(0, 8),
      p.supplier_name || '',
      p.items_count.toString(),
      p.total.toFixed(2),
      p.status,
      formatDate(p.created_at),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compras_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exportado correctamente');
  };

  const tabs = [
    { id: 'orders' as TabType, label: 'Ordenes de Compra', icon: ShoppingBag },
    { id: 'analytics' as TabType, label: 'Estadisticas', icon: BarChart3 },
    { id: 'products' as TabType, label: 'Productos Comprados', icon: Boxes },
  ];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
      pending: { label: 'Pendiente', color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.2)', icon: Clock },
      received: { label: 'Recibido', color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.2)', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: '#F87171', bgColor: 'rgba(248, 113, 113, 0.2)', icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  const purchaseColumns = [
    {
      key: 'id',
      label: 'Orden',
      render: (purchase: PurchaseWithDetails) => (
        <span className="font-mono text-sm text-primary-500">#{purchase.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'supplier',
      label: 'Proveedor',
      sortable: true,
      render: (purchase: PurchaseWithDetails) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <p className="font-medium text-neutral-50">{purchase.supplier_name || 'Desconocido'}</p>
            {purchase.supplier_ruc && (
              <p className="text-xs text-neutral-500">RUC: {purchase.supplier_ruc}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (purchase: PurchaseWithDetails) => (
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Package className="w-4 h-4 text-neutral-500" />
          {purchase.items_count} productos
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (purchase: PurchaseWithDetails) => (
        <span className="font-semibold text-success">{formatCurrency(purchase.total)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      render: (purchase: PurchaseWithDetails) => (
        <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
          <Calendar className="w-4 h-4" />
          {formatDate(purchase.created_at)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (purchase: PurchaseWithDetails) => {
        const config = getStatusConfig(purchase.status);
        const Icon = config.icon;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (purchase: PurchaseWithDetails) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetails(purchase)}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          {purchase.status === 'pending' && (
            <>
              <button
                onClick={() => handleReceivePurchase(purchase)}
                className="p-2 text-neutral-400 hover:text-success hover:bg-neutral-800 rounded-lg transition-colors"
                title="Recibir"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancelPurchase(purchase.id)}
                className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
                title="Cancelar"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
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
          <h1 className="text-3xl font-bold text-neutral-50">Compras</h1>
          <p className="text-neutral-300 mt-1">
            Gestion de ordenes de compra a proveedores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-400 text-sm">Total Ordenes</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">{stats.total}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-warning">{stats.pending} pendientes</span>
            <span className="text-neutral-600">|</span>
            <span className="text-success">{stats.received} recibidas</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <span className="text-neutral-400 text-sm">Total Comprado</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalAmount)}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-neutral-400">
            <ShoppingCart className="w-4 h-4" />
            Promedio: {formatCurrency(stats.avgOrderValue)}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-400 text-sm">Pendiente Recibir</span>
          </div>
          <p className="text-2xl font-bold text-warning">{formatCurrency(stats.pendingAmount)}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-neutral-400">
            <AlertCircle className="w-4 h-4" />
            {stats.pending} ordenes por recibir
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <span className="text-neutral-400 text-sm">Este Mes</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">{formatCurrency(stats.thisMonthAmount)}</p>
          <div className="flex items-center gap-1 mt-2 text-sm">
            {stats.growthPercent >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-success">+{stats.growthPercent}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-error" />
                <span className="text-error">{stats.growthPercent}%</span>
              </>
            )}
            <span className="text-neutral-500 ml-1">vs mes anterior</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-700">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-500'
                  : 'text-neutral-400 hover:text-neutral-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabPurchases"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
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
                  placeholder="Buscar orden o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="received">Recibidas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos los proveedores</option>
                {suppliers.filter(s => s.active).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <button
                onClick={loadData}
                className="p-2 bg-neutral-800 text-neutral-400 hover:text-primary-500 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <DataTable
              data={filteredPurchases}
              columns={purchaseColumns}
              pageSize={10}
            />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Monthly Purchases */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-neutral-50">Compras por Mes</h3>
              </div>

              {purchasesByMonth.length > 0 ? (
                <div className="space-y-3">
                  {purchasesByMonth.slice(-6).map((month, index) => {
                    const maxAmount = Math.max(...purchasesByMonth.map(m => m.total_amount)) || 1;
                    const percentage = (month.total_amount / maxAmount) * 100;

                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-400">
                            {new Date(month.month + '-01').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                          </span>
                          <div className="text-right">
                            <span className="font-semibold text-neutral-50">{formatCurrency(month.total_amount)}</span>
                            <span className="text-neutral-500 ml-2">({month.orders_count} ordenes)</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Sin datos disponibles</p>
                </div>
              )}
            </div>

            {/* Purchases by Supplier */}
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-neutral-50">Compras por Proveedor</h3>
              </div>

              {purchasesBySupplier.length > 0 ? (
                <div className="space-y-3">
                  {purchasesBySupplier.slice(0, 6).map((supplier, index) => {
                    const maxAmount = purchasesBySupplier[0]?.total_amount || 1;
                    const percentage = (supplier.total_amount / maxAmount) * 100;

                    return (
                      <motion.div
                        key={supplier.supplier_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-neutral-50 truncate">{supplier.supplier_name}</span>
                          <span className="font-semibold text-success">{formatCurrency(supplier.total_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                          <span>{supplier.orders_count} ordenes</span>
                          <span>Promedio: {formatCurrency(supplier.avg_order_value)}</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                            className="h-1.5 rounded-full bg-success"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Sin datos disponibles</p>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <ShoppingBag className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-50">{stats.thisMonthOrders}</p>
                <p className="text-sm text-neutral-400">Ordenes este mes</p>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.receivedAmount)}</p>
                <p className="text-sm text-neutral-400">Total recibido</p>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <Truck className="w-8 h-8 text-info mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-50">{purchasesBySupplier.length}</p>
                <p className="text-sm text-neutral-400">Proveedores activos</p>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <Package className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-50">{mostPurchased.length}</p>
                <p className="text-sm text-neutral-400">Productos comprados</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Boxes className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-neutral-50">Productos Mas Comprados</h3>
                <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 text-xs rounded-full">
                  Top 10
                </span>
              </div>

              {mostPurchased.length > 0 ? (
                <div className="space-y-3">
                  {mostPurchased.map((product, index) => {
                    const maxQuantity = mostPurchased[0]?.total_quantity || 1;
                    const percentage = (product.total_quantity / maxQuantity) * 100;

                    return (
                      <motion.div
                        key={product.product_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-neutral-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index < 3 ? 'bg-primary-500/20 text-primary-500' : 'bg-neutral-700 text-neutral-400'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-neutral-50 truncate">{product.product_name}</p>
                              <p className="font-bold text-success">{formatCurrency(product.total_amount)}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                              <span>{product.total_quantity} unidades compradas</span>
                              <span>{product.orders_count} ordenes</span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                className={`h-2 rounded-full ${
                                  index === 0
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                    : index < 3
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-700'
                                    : 'bg-primary-500/50'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">No hay productos comprados</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Nueva Orden de Compra</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Proveedor *
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.filter(s => s.active).map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.ruc ? `(${supplier.ruc})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">Productos</label>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center bg-neutral-800 p-3 rounded-lg">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                        >
                          <option value="">Seleccionar producto</option>
                          {products.filter(p => p.active).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 text-center focus:outline-none focus:border-primary-500"
                          placeholder="Cant"
                          min="1"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.cost}
                          onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 text-center focus:outline-none focus:border-primary-500"
                          placeholder="Costo"
                        />
                        <span className="text-neutral-400 text-sm w-24 text-right">
                          {formatCurrency(item.quantity * item.cost)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-neutral-400 hover:text-error transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {purchaseItems.length === 0 && (
                      <div className="text-center py-8 text-neutral-400 bg-neutral-800/50 rounded-lg">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Agrega productos a la orden</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 resize-none"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>

                {purchaseItems.length > 0 && (
                  <div className="bg-neutral-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <span className="text-neutral-400">Total de la orden</span>
                      <p className="text-xs text-neutral-500">{purchaseItems.filter(i => i.productId).length} productos</p>
                    </div>
                    <span className="text-2xl font-bold text-primary-500">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creando...' : 'Crear Orden'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-neutral-50">
                        Orden #{selectedPurchase.id.slice(0, 8)}
                      </h2>
                      {(() => {
                        const config = getStatusConfig(selectedPurchase.status);
                        const Icon = config.icon;
                        return (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: config.bgColor, color: config.color }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-neutral-400 mt-1">
                      Creada el {formatDateTime(selectedPurchase.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Supplier Info */}
                <div className="bg-neutral-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-50">{selectedPurchase.supplier_name}</p>
                      {selectedPurchase.supplier_ruc && (
                        <p className="text-sm text-neutral-400">RUC: {selectedPurchase.supplier_ruc}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-neutral-50 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    Productos ({selectedPurchase.items_count})
                  </h3>

                  <div className="space-y-2">
                    {selectedPurchase.items.map((item: DBPurchaseItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-neutral-50">{item.product_name}</p>
                          <p className="text-sm text-neutral-400">
                            {item.quantity} x {formatCurrency(item.cost)}
                          </p>
                        </div>
                        <p className="font-semibold text-success">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-neutral-800 rounded-lg p-4 flex justify-between items-center mb-6">
                  <span className="text-neutral-300 font-medium">Total de la orden</span>
                  <span className="text-2xl font-bold text-primary-500">
                    {formatCurrency(selectedPurchase.total)}
                  </span>
                </div>

                {/* Notes */}
                {selectedPurchase.notes && (
                  <div className="bg-neutral-800/30 rounded-lg p-4">
                    <p className="text-sm text-neutral-400 mb-1">Notas:</p>
                    <p className="text-neutral-300">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-700 flex justify-between">
                <div>
                  {selectedPurchase.status === 'pending' && (
                    <button
                      onClick={() => handleDeletePurchase(selectedPurchase.id)}
                      className="flex items-center gap-2 px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  {selectedPurchase.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleCancelPurchase(selectedPurchase.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar Orden
                      </button>
                      <button
                        onClick={() => handleReceivePurchase(selectedPurchase)}
                        className="flex items-center gap-2 px-4 py-2 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Recibir Orden
                      </button>
                    </>
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
