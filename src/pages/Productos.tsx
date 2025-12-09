import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Barcode,
  DollarSign,
  Layers,
  AlertTriangle,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Check,
  Eye,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  CheckSquare,
  Square,
  Loader2,
  BarChart3,
  ArrowUpDown,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateStatus,
  updateStock,
  getProductStats,
  type ProductWithCategory,
  type DBCategory,
} from '@/lib/api/products';

type FilterType = 'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock';
type SortField = 'name' | 'price' | 'stock' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface ProductFormData {
  name: string;
  barcode: string;
  category_id: string;
  price: string;
  cost: string;
  stock: string;
  min_stock: string;
  image_url: string;
  active: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  barcode: '',
  category_id: '',
  price: '',
  cost: '',
  stock: '0',
  min_stock: '5',
  image_url: '',
  active: true,
};

export function Productos() {
  // Data states
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalCost: 0,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Selection & editing
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductWithCategory | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Stock adjustment
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: '', operation: 'add' as 'add' | 'subtract' | 'set' });

  // Form data
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, statsData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        getProductStats(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    // Status filter
    switch (filterType) {
      case 'active':
        result = result.filter((p) => p.active);
        break;
      case 'inactive':
        result = result.filter((p) => !p.active);
        break;
      case 'low-stock':
        result = result.filter((p) => p.stock > 0 && p.stock <= p.min_stock);
        break;
      case 'out-of-stock':
        result = result.filter((p) => p.stock === 0);
        break;
    }

    // Category filter
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory);
    }

    // Price range filter
    if (priceRange.min) {
      result = result.filter((p) => p.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter((p) => p.price <= parseFloat(priceRange.max));
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, searchQuery, filterType, filterCategory, priceRange, sortField, sortOrder]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Calculate margin
  const calculateMargin = (price: number, cost: number) => {
    if (cost === 0) return 100;
    return ((price - cost) / cost) * 100;
  };

  // Handle modal open
  const handleOpenModal = (product?: ProductWithCategory) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        image_url: product.image_url || '',
        active: product.active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        ...initialFormData,
        category_id: categories[0]?.id || '',
      });
    }
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        name: formData.name,
        barcode: formData.barcode || undefined,
        category_id: formData.category_id || undefined,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 5,
        image_url: formData.image_url || undefined,
        active: formData.active,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Producto actualizado correctamente');
      } else {
        await createProduct(productData);
        toast.success('Producto creado correctamente');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!productToDelete) return;

    setSubmitting(true);
    try {
      await deleteProduct(productToDelete);
      toast.success('Producto eliminado');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      await bulkDeleteProducts(Array.from(selectedIds));
      toast.success(`${selectedIds.size} productos eliminados`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Error al eliminar productos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkStatusChange = async (active: boolean) => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      await bulkUpdateStatus(Array.from(selectedIds), active);
      toast.success(`${selectedIds.size} productos ${active ? 'activados' : 'desactivados'}`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!viewingProduct || !stockAdjustment.quantity) return;

    setSubmitting(true);
    try {
      await updateStock(viewingProduct.id, parseInt(stockAdjustment.quantity), stockAdjustment.operation);
      toast.success('Stock actualizado');
      setShowStockModal(false);
      setStockAdjustment({ quantity: '', operation: 'add' });
      loadData();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Código de Barras', 'Categoría', 'Precio', 'Costo', 'Stock', 'Stock Mínimo', 'Estado'];
    const rows = filteredProducts.map((p) => [
      p.name,
      p.barcode || '',
      p.category_name || '',
      p.price.toFixed(2),
      p.cost.toFixed(2),
      p.stock,
      p.min_stock,
      p.active ? 'Activo' : 'Inactivo',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo CSV exportado');
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterCategory('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterType !== 'all' || filterCategory || priceRange.min || priceRange.max;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando productos...</p>
        </div>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Productos</h1>
          <p className="text-neutral-400 mt-1">
            Gestión completa del catálogo de productos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: '#22D3EE' },
          { label: 'Activos', value: stats.active, icon: Check, color: '#4ADE80' },
          { label: 'Stock Bajo', value: stats.lowStock, icon: AlertTriangle, color: '#FBBF24' },
          { label: 'Sin Stock', value: stats.outOfStock, icon: XCircle, color: '#F87171' },
          { label: 'Valor Total', value: `$${stats.totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#A78BFA' },
          { label: 'Margen Total', value: `$${(stats.totalValue - stats.totalCost).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: '#34D399' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs">{stat.label}</p>
                <p className="text-lg font-bold text-neutral-50">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o código de barras..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'low-stock', label: 'Stock Bajo' },
              { key: 'out-of-stock', label: 'Sin Stock' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setFilterType(filter.key as FilterType);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filterType === filter.key
                    ? 'bg-primary-500 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-50'
                }`}
              >
                {filter.label}
              </button>
            ))}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-50"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Categoría
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Precio Mínimo
                  </label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, min: e.target.value });
                      setCurrentPage(1);
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Precio Máximo
                  </label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, max: e.target.value });
                      setCurrentPage(1);
                    }}
                    placeholder="999.99"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Ordenar por
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value="created_at">Fecha</option>
                      <option value="name">Nombre</option>
                      <option value="price">Precio</option>
                      <option value="stock">Stock</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 flex items-center justify-between"
          >
            <p className="text-primary-500 font-medium">
              {selectedIds.size} producto{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange(true)}
                disabled={submitting}
                className="px-3 py-1.5 bg-success/20 text-success text-sm font-medium rounded-lg hover:bg-success/30 transition-colors disabled:opacity-50"
              >
                Activar
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                disabled={submitting}
                className="px-3 py-1.5 bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                Desactivar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={submitting}
                className="px-3 py-1.5 bg-error/20 text-error text-sm font-medium rounded-lg hover:bg-error/30 transition-colors disabled:opacity-50"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-neutral-400 hover:text-neutral-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="p-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 text-neutral-400 hover:text-neutral-50"
                  >
                    {selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-primary-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Producto
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Precio / Costo
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Margen
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="p-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="p-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Package className="w-12 h-12 text-neutral-600 mx-auto" />
                    <p className="mt-4 text-neutral-400">
                      {hasActiveFilters
                        ? 'No se encontraron productos con los filtros aplicados'
                        : 'No hay productos registrados'}
                    </p>
                    {!hasActiveFilters && (
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
                      >
                        Crear primer producto
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const margin = calculateMargin(product.price, product.cost);
                  const isLowStock = product.stock > 0 && product.stock <= product.min_stock;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => toggleSelection(product.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-50"
                        >
                          {selectedIds.has(product.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center bg-neutral-800"
                            style={{ backgroundColor: product.category_color ? `${product.category_color}15` : undefined }}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package
                                className="w-6 h-6"
                                style={{ color: product.category_color || '#6B7280' }}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-50">{product.name}</p>
                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                              <Barcode className="w-3 h-3" />
                              {product.barcode || 'Sin código'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {product.category_name ? (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${product.category_color}20`,
                              color: product.category_color,
                            }}
                          >
                            {product.category_name}
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-sm">Sin categoría</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary-500">${product.price.toFixed(2)}</p>
                        <p className="text-xs text-neutral-500">Costo: ${product.cost.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-medium ${
                              margin >= 30
                                ? 'text-success'
                                : margin >= 15
                                ? 'text-warning'
                                : 'text-error'
                            }`}
                          >
                            {margin.toFixed(1)}%
                          </div>
                          <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                margin >= 30
                                  ? 'bg-success'
                                  : margin >= 15
                                  ? 'bg-warning'
                                  : 'bg-error'
                              }`}
                              style={{ width: `${Math.min(margin, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              isOutOfStock
                                ? 'text-error'
                                : isLowStock
                                ? 'text-warning'
                                : 'text-neutral-50'
                            }`}
                          >
                            {product.stock}
                          </span>
                          {(isLowStock || isOutOfStock) && (
                            <AlertTriangle
                              className={`w-4 h-4 ${isOutOfStock ? 'text-error' : 'text-warning'}`}
                            />
                          )}
                          <span className="text-xs text-neutral-500">/ {product.min_stock} min</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.active
                              ? 'bg-success/20 text-success'
                              : 'bg-neutral-700 text-neutral-400'
                          }`}
                        >
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setViewingProduct(product);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(product.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-800">
            <p className="text-sm text-neutral-400">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} de {filteredProducts.length} productos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (currentPage > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-neutral-950 font-semibold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

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
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-50">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Información Básica
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="Ej: Coca Cola 500ml"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Código de Barras
                      </label>
                      <div className="relative">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                          placeholder="7891234567890"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Categoría
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      >
                        <option value="">Sin categoría</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      URL de Imagen
                    </label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Precios
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Precio de Venta *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Costo de Compra
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.price && formData.cost && (
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Ganancia:</span>
                        <span className="text-success font-semibold">
                          ${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-neutral-400">Margen:</span>
                        <span className={`font-semibold ${
                          calculateMargin(parseFloat(formData.price), parseFloat(formData.cost)) >= 30
                            ? 'text-success'
                            : calculateMargin(parseFloat(formData.price), parseFloat(formData.cost)) >= 15
                            ? 'text-warning'
                            : 'text-error'
                        }`}>
                          {calculateMargin(parseFloat(formData.price), parseFloat(formData.cost)).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                    Inventario
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Stock Actual
                      </label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Stock Mínimo
                      </label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="number"
                          min="0"
                          value={formData.min_stock}
                          onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-50">Estado del Producto</p>
                    <p className="text-sm text-neutral-400">
                      {formData.active ? 'Visible en el punto de venta' : 'Oculto del punto de venta'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.active ? 'bg-primary-500' : 'bg-neutral-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.active ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && viewingProduct && (
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
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: viewingProduct.category_color ? `${viewingProduct.category_color}15` : '#262626' }}
                    >
                      {viewingProduct.image_url ? (
                        <img
                          src={viewingProduct.image_url}
                          alt={viewingProduct.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Package
                          className="w-8 h-8"
                          style={{ color: viewingProduct.category_color || '#6B7280' }}
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-50">{viewingProduct.name}</h2>
                      <p className="text-sm text-neutral-400 flex items-center gap-1">
                        <Barcode className="w-4 h-4" />
                        {viewingProduct.barcode || 'Sin código'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-neutral-400 hover:text-neutral-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-400 mb-1">Precio de Venta</p>
                    <p className="text-2xl font-bold text-primary-500">${viewingProduct.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-400 mb-1">Costo</p>
                    <p className="text-2xl font-bold text-neutral-50">${viewingProduct.cost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Margen de Ganancia</span>
                    <span className={`text-lg font-bold ${
                      calculateMargin(viewingProduct.price, viewingProduct.cost) >= 30
                        ? 'text-success'
                        : calculateMargin(viewingProduct.price, viewingProduct.cost) >= 15
                        ? 'text-warning'
                        : 'text-error'
                    }`}>
                      {calculateMargin(viewingProduct.price, viewingProduct.cost).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        calculateMargin(viewingProduct.price, viewingProduct.cost) >= 30
                          ? 'bg-success'
                          : calculateMargin(viewingProduct.price, viewingProduct.cost) >= 15
                          ? 'bg-warning'
                          : 'bg-error'
                      }`}
                      style={{ width: `${Math.min(calculateMargin(viewingProduct.price, viewingProduct.cost), 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-400 mt-2">
                    Ganancia por unidad: <span className="text-success font-semibold">${(viewingProduct.price - viewingProduct.cost).toFixed(2)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-400 mb-1">Stock Actual</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${
                        viewingProduct.stock === 0
                          ? 'text-error'
                          : viewingProduct.stock <= viewingProduct.min_stock
                          ? 'text-warning'
                          : 'text-neutral-50'
                      }`}>
                        {viewingProduct.stock}
                      </p>
                      {viewingProduct.stock <= viewingProduct.min_stock && (
                        <AlertTriangle className={`w-5 h-5 ${viewingProduct.stock === 0 ? 'text-error' : 'text-warning'}`} />
                      )}
                    </div>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-400 mb-1">Stock Mínimo</p>
                    <p className="text-2xl font-bold text-neutral-50">{viewingProduct.min_stock}</p>
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-xs text-neutral-400 mb-2">Valor en Inventario</p>
                  <p className="text-2xl font-bold text-primary-500">
                    ${(viewingProduct.price * viewingProduct.stock).toFixed(2)}
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Costo total: ${(viewingProduct.cost * viewingProduct.stock).toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowStockModal(true);
                    }}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers className="w-5 h-5" />
                    Ajustar Stock
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenModal(viewingProduct);
                    }}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {showStockModal && viewingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowStockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-6"
            >
              <h2 className="text-xl font-bold text-neutral-50 mb-4">Ajustar Stock</h2>
              <p className="text-neutral-400 mb-6">
                {viewingProduct.name} • Stock actual: <span className="text-neutral-50 font-semibold">{viewingProduct.stock}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Operación
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'add', label: 'Agregar', icon: Plus },
                      { key: 'subtract', label: 'Restar', icon: X },
                      { key: 'set', label: 'Establecer', icon: Layers },
                    ].map((op) => (
                      <button
                        key={op.key}
                        onClick={() => setStockAdjustment({ ...stockAdjustment, operation: op.key as any })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          stockAdjustment.operation === op.key
                            ? 'bg-primary-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        <op.icon className="w-4 h-4" />
                        {op.label}
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
                    min="0"
                    value={stockAdjustment.quantity}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 text-center text-xl"
                    placeholder="0"
                  />
                </div>

                {stockAdjustment.quantity && (
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-sm text-neutral-400">Nuevo stock:</p>
                    <p className="text-2xl font-bold text-primary-500">
                      {stockAdjustment.operation === 'set'
                        ? parseInt(stockAdjustment.quantity)
                        : stockAdjustment.operation === 'add'
                        ? viewingProduct.stock + parseInt(stockAdjustment.quantity)
                        : Math.max(0, viewingProduct.stock - parseInt(stockAdjustment.quantity))}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowStockModal(false);
                      setStockAdjustment({ quantity: '', operation: 'add' });
                    }}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleStockUpdate}
                    disabled={!stockAdjustment.quantity || submitting}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Actualizar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-error/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-50">Eliminar Producto</h2>
                  <p className="text-neutral-400">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-neutral-300 mb-6">
                ¿Estás seguro de que deseas eliminar este producto? Se eliminará permanentemente del sistema.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 py-3 bg-error text-white font-semibold rounded-lg hover:bg-error/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
