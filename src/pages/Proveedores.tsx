import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Package,
  History,
  Star,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  getSupplierStats,
  getSupplierPurchases,
  getTopSuppliers,
  type DBSupplier,
  type SupplierStats,
  type SupplierPurchase,
} from '@/lib/api/suppliers';

type TabType = 'suppliers' | 'purchases' | 'top';

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

export function Proveedores() {
  const [activeTab, setActiveTab] = useState<TabType>('suppliers');
  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalPurchases: 0,
    totalAmount: 0,
    avgPurchaseAmount: 0,
    topSupplier: null,
    purchasesThisMonth: 0,
  });
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<Array<{
    id: string;
    name: string;
    total_purchases: number;
    total_amount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<DBSupplier | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<DBSupplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
    contact_name: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, statsData, purchasesData, topData] = await Promise.all([
        fetchSuppliers(),
        getSupplierStats(),
        getSupplierPurchases(undefined, 100),
        getTopSuppliers(10),
      ]);
      setSuppliers(suppliersData);
      setStats(statsData);
      setPurchases(purchasesData);
      setTopSuppliers(topData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (statusFilter === 'active') {
      result = result.filter((s) => s.active);
    } else if (statusFilter === 'inactive') {
      result = result.filter((s) => !s.active);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.ruc?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.phone?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [suppliers, statusFilter, searchTerm]);

  const handleOpenModal = (supplier?: DBSupplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        ruc: supplier.ruc || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        contact_name: supplier.contact_name || '',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        ruc: '',
        phone: '',
        email: '',
        address: '',
        contact_name: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleViewDetails = async (supplier: DBSupplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
    try {
      const purchases = await getSupplierPurchases(supplier.id, 20);
      setSupplierPurchases(purchases);
    } catch (error) {
      console.error('Error loading supplier purchases:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success('Proveedor actualizado');
      } else {
        await createSupplier(formData);
        toast.success('Proveedor creado');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Error al guardar proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Desactivar este proveedor?')) {
      try {
        await deleteSupplier(id);
        toast.success('Proveedor desactivado');
        loadData();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Error al desactivar proveedor');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSupplierStatus(id);
      toast.success('Estado actualizado');
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nombre', 'RUC', 'Telefono', 'Email', 'Direccion', 'Estado', 'Total Compras', 'Monto Total'];
    const rows = filteredSuppliers.map((s) => [
      s.name,
      s.ruc || '',
      s.phone || '',
      s.email || '',
      s.address || '',
      s.active ? 'Activo' : 'Inactivo',
      s.total_purchases.toString(),
      s.total_amount.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exportado correctamente');
  };

  const tabs = [
    { id: 'suppliers' as TabType, label: 'Proveedores', icon: Truck },
    { id: 'purchases' as TabType, label: 'Historial de Compras', icon: History },
    { id: 'top' as TabType, label: 'Top Proveedores', icon: Award },
  ];

  const supplierColumns = [
    {
      key: 'name',
      label: 'Proveedor',
      sortable: true,
      render: (supplier: DBSupplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <Building className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <p className="font-medium text-neutral-50">{supplier.name}</p>
            <p className="text-xs text-neutral-400">RUC: {supplier.ruc || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contacto',
      render: (supplier: DBSupplier) => (
        <div className="space-y-1">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-neutral-300 text-sm">
              <Phone className="w-3.5 h-3.5 text-neutral-500" />
              {supplier.phone}
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-neutral-300 text-sm">
              <Mail className="w-3.5 h-3.5 text-neutral-500" />
              {supplier.email}
            </div>
          )}
          {!supplier.phone && !supplier.email && (
            <span className="text-neutral-500 text-sm">Sin contacto</span>
          )}
        </div>
      ),
    },
    {
      key: 'purchases',
      label: 'Compras',
      sortable: true,
      render: (supplier: DBSupplier) => (
        <div className="text-center">
          <p className="font-semibold text-neutral-50">{supplier.total_purchases}</p>
          <p className="text-xs text-neutral-400">ordenes</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total Comprado',
      sortable: true,
      render: (supplier: DBSupplier) => (
        <div>
          <p className="font-semibold text-success">{formatCurrency(supplier.total_amount)}</p>
          {supplier.last_purchase && (
            <p className="text-xs text-neutral-400">
              Ultima: {formatDate(supplier.last_purchase)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Estado',
      render: (supplier: DBSupplier) => (
        <button
          onClick={() => handleToggleStatus(supplier.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            supplier.active
              ? 'bg-success/20 text-success hover:bg-success/30'
              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
          }`}
        >
          {supplier.active ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {supplier.active ? 'Activo' : 'Inactivo'}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (supplier: DBSupplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetails(supplier)}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenModal(supplier)}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(supplier.id)}
            className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
            title="Desactivar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const purchaseColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (purchase: SupplierPurchase) => (
        <span className="font-mono text-xs text-neutral-400">
          #{purchase.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'supplier',
      label: 'Proveedor',
      sortable: true,
      render: (purchase: SupplierPurchase) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary-500" />
          </div>
          <span className="font-medium text-neutral-50">{purchase.supplier_name}</span>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (purchase: SupplierPurchase) => (
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
      render: (purchase: SupplierPurchase) => (
        <span className="font-semibold text-success">{formatCurrency(purchase.total)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (purchase: SupplierPurchase) => {
        const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
          completed: { color: 'success', icon: CheckCircle, label: 'Completada' },
          pending: { color: 'warning', icon: Clock, label: 'Pendiente' },
          cancelled: { color: 'error', icon: XCircle, label: 'Cancelada' },
        };
        const config = statusConfig[purchase.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-${config.color}/20 text-${config.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      render: (purchase: SupplierPurchase) => (
        <div className="flex items-center gap-1.5 text-neutral-300 text-sm">
          <Calendar className="w-4 h-4 text-neutral-500" />
          {formatDateTime(purchase.created_at)}
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
          <h1 className="text-3xl font-bold text-neutral-50">Proveedores</h1>
          <p className="text-neutral-300 mt-1">
            Gestion de proveedores y compras
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
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proveedor
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
              <Truck className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-400 text-sm">Total Proveedores</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">{stats.total}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-success text-sm">{stats.active} activos</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400 text-sm">{stats.inactive} inactivos</span>
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
            <ShoppingBag className="w-4 h-4" />
            {stats.totalPurchases} ordenes totales
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-400 text-sm">Promedio por Compra</span>
          </div>
          <p className="text-2xl font-bold text-warning">{formatCurrency(stats.avgPurchaseAmount)}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-neutral-400">
            <Calendar className="w-4 h-4" />
            {stats.purchasesThisMonth} este mes
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-info" />
            </div>
            <span className="text-neutral-400 text-sm">Top Proveedor</span>
          </div>
          <p className="text-lg font-bold text-neutral-50 truncate">
            {stats.topSupplier || 'N/A'}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-info">
            <Star className="w-4 h-4" />
            Mayor volumen de compras
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
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'suppliers' && (
          <motion.div
            key="suppliers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, RUC, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              <button
                onClick={loadData}
                className="p-2.5 bg-neutral-800 text-neutral-400 hover:text-primary-500 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <DataTable
              data={filteredSuppliers}
              columns={supplierColumns}
              pageSize={10}
            />
          </motion.div>
        )}

        {activeTab === 'purchases' && (
          <motion.div
            key="purchases"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-neutral-50">Historial de Compras</h3>
                <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 text-xs rounded-full">
                  {purchases.length} registros
                </span>
              </div>

              {purchases.length > 0 ? (
                <DataTable
                  data={purchases}
                  columns={purchaseColumns}
                  searchable
                  searchKeys={['supplier_name']}
                  pageSize={15}
                />
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">No hay compras registradas</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'top' && (
          <motion.div
            key="top"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-neutral-50">Top 10 Proveedores por Volumen de Compras</h3>
              </div>

              {topSuppliers.length > 0 ? (
                <div className="space-y-3">
                  {topSuppliers.map((supplier, index) => {
                    const maxAmount = topSuppliers[0]?.total_amount || 1;
                    const percentage = (supplier.total_amount / maxAmount) * 100;
                    const isTop3 = index < 3;

                    return (
                      <motion.div
                        key={supplier.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg ${
                          isTop3 ? 'bg-neutral-800/80' : 'bg-neutral-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : index === 1
                                ? 'bg-neutral-400/20 text-neutral-300'
                                : index === 2
                                ? 'bg-amber-600/20 text-amber-500'
                                : 'bg-neutral-700 text-neutral-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-neutral-50 truncate">
                                  {supplier.name}
                                </p>
                                {isTop3 && (
                                  <Star
                                    className={`w-4 h-4 ${
                                      index === 0
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-neutral-400'
                                    }`}
                                  />
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-success">
                                  {formatCurrency(supplier.total_amount)}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {supplier.total_purchases} compras
                                </p>
                              </div>
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
                  <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">No hay datos suficientes</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
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
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
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
                    Nombre / Razon Social *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Distribuidora Central"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      RUC / NIT
                    </label>
                    <input
                      type="text"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="20123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="Nombre del contacto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Telefono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        placeholder="+51 999 888 777"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Direccion
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 resize-none"
                      rows={2}
                      placeholder="Av. Industrial 123, Lima"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Notas
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 resize-none"
                      rows={2}
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>

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
                    {saving ? 'Guardando...' : editingSupplier ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSupplier && (
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
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <Building className="w-7 h-7 text-primary-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-50">
                        {selectedSupplier.name}
                      </h2>
                      <p className="text-neutral-400">RUC: {selectedSupplier.ruc || 'N/A'}</p>
                    </div>
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
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <ShoppingBag className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-neutral-50">
                      {selectedSupplier.total_purchases}
                    </p>
                    <p className="text-xs text-neutral-400">Ordenes</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(selectedSupplier.total_amount)}
                    </p>
                    <p className="text-xs text-neutral-400">Total Comprado</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-warning mx-auto mb-2" />
                    <p className="text-sm font-bold text-neutral-50">
                      {selectedSupplier.last_purchase
                        ? formatDate(selectedSupplier.last_purchase)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-neutral-400">Ultima Compra</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-neutral-800/50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-neutral-50 mb-3">Informacion de Contacto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      {selectedSupplier.phone || 'No registrado'}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Mail className="w-4 h-4 text-neutral-500" />
                      {selectedSupplier.email || 'No registrado'}
                    </div>
                    <div className="flex items-start gap-2 text-neutral-300 col-span-2">
                      <MapPin className="w-4 h-4 text-neutral-500 mt-0.5" />
                      {selectedSupplier.address || 'No registrada'}
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-neutral-50">Historial de Compras</h3>
                  </div>

                  {supplierPurchases.length > 0 ? (
                    <div className="space-y-2">
                      {supplierPurchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-neutral-50">
                              Orden #{purchase.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {formatDateTime(purchase.created_at)} • {purchase.items_count} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-success">
                              {formatCurrency(purchase.total)}
                            </p>
                            <span
                              className={`text-xs ${
                                purchase.status === 'completed'
                                  ? 'text-success'
                                  : purchase.status === 'pending'
                                  ? 'text-warning'
                                  : 'text-error'
                              }`}
                            >
                              {purchase.status === 'completed'
                                ? 'Completada'
                                : purchase.status === 'pending'
                                ? 'Pendiente'
                                : 'Cancelada'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-800/30 rounded-lg">
                      <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                      <p className="text-neutral-400">Sin historial de compras</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenModal(selectedSupplier);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Proveedor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
