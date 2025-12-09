import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProductCount,
  type DBCategory,
} from '@/lib/api/categories';

const COLORS = [
  '#22D3EE', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA',
  '#FB923C', '#EC4899', '#14B8A6', '#8B5CF6', '#06B6D4',
];

export function Categorias() {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<DBCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', color: COLORS[0], icon: 'folder' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);

      // Get product counts for each category
      const counts: Record<string, number> = {};
      for (const cat of categoriesData) {
        counts[cat.id] = await getCategoryProductCount(cat.id);
      }
      setProductCounts(counts);
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

  const handleOpenModal = (category?: DBCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, color: category.color, icon: category.icon });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', color: COLORS[0], icon: 'folder' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
        });
        toast.success('Categoría actualizada');
      } else {
        await createCategory({
          name: formData.name,
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

    const productCount = productCounts[categoryToDelete.id] || 0;
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
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Categorías</h1>
          <p className="text-neutral-400 mt-1">
            Organiza tus productos por categorías • {categories.length} categorías
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
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <FolderTree className="w-16 h-16 text-neutral-600" />
              <p className="mt-4 text-neutral-400 text-lg">No hay categorías registradas</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors"
              >
                Crear primera categoría
              </button>
            </div>
          ) : (
            categories.map((category, index) => {
              const productCount = productCounts[category.id] || 0;
              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, borderColor: category.color }}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <FolderTree className="w-7 h-7" style={{ color: category.color }} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(category);
                        }}
                        className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToDelete(category);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-neutral-50 mb-2">{category.name}</h3>

                  <div className="flex items-center gap-2 text-neutral-400">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">{productCount} productos</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-neutral-500 uppercase">{category.color}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
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
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Bebidas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color
                    </div>
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-full aspect-square rounded-lg transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-neutral-900 ring-white scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    <FolderTree className="w-6 h-6" style={{ color: formData.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Vista previa</p>
                    <p className="font-semibold text-neutral-50">{formData.name || 'Categoría'}</p>
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
                    disabled={submitting}
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
                  <h2 className="text-xl font-bold text-neutral-50">Eliminar Categoría</h2>
                  <p className="text-neutral-400">{categoryToDelete.name}</p>
                </div>
              </div>

              {(productCounts[categoryToDelete.id] || 0) > 0 ? (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                  <p className="text-warning">
                    Esta categoría tiene {productCounts[categoryToDelete.id]} productos asociados.
                    Primero mueve o elimina los productos antes de eliminar la categoría.
                  </p>
                </div>
              ) : (
                <p className="text-neutral-300 mb-6">
                  ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting || (productCounts[categoryToDelete.id] || 0) > 0}
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
