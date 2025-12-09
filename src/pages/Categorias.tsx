import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  Palette,
  Package,
  Loader2,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  ArrowUpDown,
  ChevronDown,
  Tags,
  Coffee,
  ShoppingBag,
  Utensils,
  Gift,
  Shirt,
  Smartphone,
  Home,
  Book,
  Heart,
  Music,
  Gamepad2,
  Camera,
  Car,
  Plane,
  Flower2,
  Baby,
  Dog,
  Dumbbell,
  Wrench,
  Lightbulb,
  Sparkles,
  Star,
  Zap,
  Crown,
  Gem,
  Glasses,
  Watch,
  Headphones,
  Laptop,
  Tv,
  Pill,
  Scissors,
  Brush,
  Droplet,
  Flame,
  Leaf,
  Apple,
  Wine,
  Beer,
  Sandwich,
  Pizza,
  IceCream,
  Cake,
  Cookie,
  Candy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCategoriesWithStats,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesSummary,
  type CategoryWithStats,
  type CategorySummary,
} from '@/lib/api/categories';

// Available icons for categories
const CATEGORY_ICONS = [
  { name: 'folder', icon: FolderTree, label: 'Carpeta' },
  { name: 'tags', icon: Tags, label: 'Etiquetas' },
  { name: 'package', icon: Package, label: 'Paquete' },
  { name: 'shopping-bag', icon: ShoppingBag, label: 'Bolsa' },
  { name: 'coffee', icon: Coffee, label: 'Cafe' },
  { name: 'utensils', icon: Utensils, label: 'Comida' },
  { name: 'gift', icon: Gift, label: 'Regalo' },
  { name: 'shirt', icon: Shirt, label: 'Ropa' },
  { name: 'smartphone', icon: Smartphone, label: 'Tecnologia' },
  { name: 'home', icon: Home, label: 'Hogar' },
  { name: 'book', icon: Book, label: 'Libros' },
  { name: 'heart', icon: Heart, label: 'Salud' },
  { name: 'music', icon: Music, label: 'Musica' },
  { name: 'gamepad', icon: Gamepad2, label: 'Juegos' },
  { name: 'camera', icon: Camera, label: 'Foto' },
  { name: 'car', icon: Car, label: 'Auto' },
  { name: 'plane', icon: Plane, label: 'Viajes' },
  { name: 'flower', icon: Flower2, label: 'Flores' },
  { name: 'baby', icon: Baby, label: 'Bebe' },
  { name: 'dog', icon: Dog, label: 'Mascotas' },
  { name: 'dumbbell', icon: Dumbbell, label: 'Deporte' },
  { name: 'wrench', icon: Wrench, label: 'Herramientas' },
  { name: 'lightbulb', icon: Lightbulb, label: 'Ideas' },
  { name: 'sparkles', icon: Sparkles, label: 'Limpieza' },
  { name: 'star', icon: Star, label: 'Favoritos' },
  { name: 'zap', icon: Zap, label: 'Electronica' },
  { name: 'crown', icon: Crown, label: 'Premium' },
  { name: 'gem', icon: Gem, label: 'Joyas' },
  { name: 'glasses', icon: Glasses, label: 'Optica' },
  { name: 'watch', icon: Watch, label: 'Relojes' },
  { name: 'headphones', icon: Headphones, label: 'Audio' },
  { name: 'laptop', icon: Laptop, label: 'Computacion' },
  { name: 'tv', icon: Tv, label: 'Televisores' },
  { name: 'pill', icon: Pill, label: 'Farmacia' },
  { name: 'scissors', icon: Scissors, label: 'Belleza' },
  { name: 'brush', icon: Brush, label: 'Arte' },
  { name: 'droplet', icon: Droplet, label: 'Liquidos' },
  { name: 'flame', icon: Flame, label: 'Caliente' },
  { name: 'leaf', icon: Leaf, label: 'Natural' },
  { name: 'apple', icon: Apple, label: 'Frutas' },
  { name: 'wine', icon: Wine, label: 'Vinos' },
  { name: 'beer', icon: Beer, label: 'Cervezas' },
  { name: 'sandwich', icon: Sandwich, label: 'Snacks' },
  { name: 'pizza', icon: Pizza, label: 'Pizzas' },
  { name: 'ice-cream', icon: IceCream, label: 'Helados' },
  { name: 'cake', icon: Cake, label: 'Pasteles' },
  { name: 'cookie', icon: Cookie, label: 'Galletas' },
  { name: 'candy', icon: Candy, label: 'Dulces' },
];

const COLORS = [
  '#22D3EE', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA',
  '#FB923C', '#EC4899', '#14B8A6', '#8B5CF6', '#06B6D4',
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6',
  '#6366F1', '#D946EF', '#F43F5E', '#84CC16', '#0EA5E9',
];

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'products' | 'revenue' | 'recent';

const getIconComponent = (iconName: string) => {
  const found = CATEGORY_ICONS.find(i => i.name === iconName);
  return found ? found.icon : FolderTree;
};

export function Categorias() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [summary, setSummary] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithStats | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithStats | null>(null);
  const [formData, setFormData] = useState({ name: '', color: COLORS[0], icon: 'folder' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesData, summaryData] = await Promise.all([
        fetchCategoriesWithStats(),
        getCategoriesSummary(),
      ]);
      setCategories(categoriesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = categories.filter(cat =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case 'products':
        result = [...result].sort((a, b) => Number(b.product_count) - Number(a.product_count));
        break;
      case 'revenue':
        result = [...result].sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue));
        break;
      case 'recent':
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [categories, search, sortBy]);

  const handleOpenModal = (category?: CategoryWithStats) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, color: category.color, icon: category.icon || 'folder' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], icon: 'folder' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
        });
        toast.success('Categoría actualizada');
      } else {
        await createCategory({
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
        });
        toast.success('Categoría creada');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    const productCount = Number(categoryToDelete.product_count) || 0;
    if (productCount > 0) {
      toast.error(`No se puede eliminar: hay ${productCount} productos en esta categoría`);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      return;
    }

    setSubmitting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success('Categoría eliminada');
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error al eliminar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const sortOptions = [
    { value: 'name', label: 'Nombre A-Z' },
    { value: 'products', label: 'Más productos' },
    { value: 'revenue', label: 'Mayor ingreso' },
    { value: 'recent', label: 'Más reciente' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-50">Categorías</h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-1">
            Organiza tus productos por categorías
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Categoría</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-primary-500/20 rounded-lg">
                <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">Categorías</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-50">{summary.totalCategories}</p>
              </div>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-success/20 rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">Productos</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-50">{summary.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">Ingresos</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-50">{formatCurrency(summary.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">Prom/Cat</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-50">{summary.avgProductsPerCategory.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-300 hover:text-neutral-50 hover:border-neutral-600 transition-colors w-full sm:w-auto justify-between sm:justify-start"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm">{sortOptions.find(o => o.value === sortBy)?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortOption);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value
                        ? 'bg-primary-500/20 text-primary-500'
                        : 'text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Mode - Hidden on mobile */}
        <div className="hidden sm:flex bg-neutral-900 border border-neutral-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={loadData}
          className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Categories Grid/List */}
      {filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {search ? (
            <>
              <Search className="w-16 h-16 text-neutral-600 mb-4" />
              <p className="text-lg text-neutral-400">No se encontraron categorías</p>
              <p className="text-sm text-neutral-500">Intenta con otro término de búsqueda</p>
            </>
          ) : (
            <>
              <FolderTree className="w-16 h-16 text-neutral-600 mb-4" />
              <p className="text-lg text-neutral-400">No hay categorías registradas</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
              >
                Crear primera categoría
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category, index) => {
              const IconComponent = getIconComponent(category.icon);
              const productCount = Number(category.product_count) || 0;
              const revenue = Number(category.total_revenue) || 0;
              const lowStock = Number(category.low_stock_count) || 0;

              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 group hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: category.color }} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCategoryToDelete(category);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-50 mb-3 truncate">{category.name}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Package className="w-4 h-4" />
                        <span>{productCount} productos</span>
                      </div>
                      {lowStock > 0 && (
                        <div className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs">{lowStock}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400 text-sm">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{Number(category.total_sales) || 0} ventas</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-success" />
                      <span className="text-success font-medium">{formatCurrency(revenue)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-neutral-500 uppercase font-mono">{category.color}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase">Categoría</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-neutral-400 uppercase hidden sm:table-cell">Productos</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-neutral-400 uppercase hidden md:table-cell">Ventas</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase">Ingresos</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <tr key={category.id} className="border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-50 truncate">{category.name}</p>
                            <p className="text-xs text-neutral-500 sm:hidden">{category.product_count} productos</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-300 hidden sm:table-cell">
                        {category.product_count}
                        {Number(category.low_stock_count) > 0 && (
                          <span className="ml-2 text-warning text-xs">({category.low_stock_count} bajo)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-300 hidden md:table-cell">{category.total_sales}</td>
                      <td className="py-3 px-4 text-right text-success font-medium">{formatCurrency(Number(category.total_revenue) || 0)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(category)}
                            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Bebidas"
                    autoFocus
                  />
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Icono
                  </label>
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 hover:border-neutral-600 transition-colors"
                  >
                    {(() => {
                      const IconComp = getIconComponent(formData.icon);
                      return <IconComp className="w-5 h-5" style={{ color: formData.color }} />;
                    })()}
                    <span className="flex-1 text-left">
                      {CATEGORY_ICONS.find(i => i.name === formData.icon)?.label || 'Seleccionar icono'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showIconPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                      >
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                          {CATEGORY_ICONS.map((iconItem) => (
                            <button
                              key={iconItem.name}
                              onClick={() => {
                                setFormData({ ...formData, icon: iconItem.name });
                                setShowIconPicker(false);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                formData.icon === iconItem.name
                                  ? 'bg-primary-500/20 ring-2 ring-primary-500'
                                  : 'hover:bg-neutral-700'
                              }`}
                              title={iconItem.label}
                            >
                              <iconItem.icon className="w-5 h-5 mx-auto" style={{ color: formData.color }} />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color
                    </div>
                  </label>
                  <div className="grid grid-cols-10 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`aspect-square rounded-lg transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-neutral-900 ring-white scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-neutral-800 rounded-lg p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-all"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    {(() => {
                      const IconComp = getIconComponent(formData.icon);
                      return <IconComp className="w-6 h-6" style={{ color: formData.color }} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Vista previa</p>
                    <p className="font-semibold text-neutral-50">{formData.name || 'Categoría'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !formData.name.trim()}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingCategory ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && categoryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-4 sm:p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-error/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Eliminar Categoría</h2>
                  <p className="text-sm sm:text-base text-neutral-400">{categoryToDelete.name}</p>
                </div>
              </div>

              {(Number(categoryToDelete.product_count) || 0) > 0 ? (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                  <p className="text-warning text-sm sm:text-base">
                    Esta categoría tiene {categoryToDelete.product_count} productos asociados.
                    Primero mueve o elimina los productos antes de eliminar la categoría.
                  </p>
                </div>
              ) : (
                <p className="text-neutral-300 mb-6 text-sm sm:text-base">
                  ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 py-2.5 sm:py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting || (Number(categoryToDelete.product_count) || 0) > 0}
                  className="flex-1 py-2.5 sm:py-3 bg-error text-white font-semibold rounded-lg hover:bg-error/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close sort menu */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </motion.div>
  );
}
