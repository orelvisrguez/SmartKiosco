import { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore, type Supplier } from '@/stores/useAppStore';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

export function Proveedores() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        ruc: supplier.ruc,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', ruc: '', phone: '', email: '', address: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, { ...formData });
      toast.success('Proveedor actualizado');
    } else {
      addSupplier({
        id: Date.now().toString(),
        ...formData,
        active: true,
      });
      toast.success('Proveedor creado');
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteSupplier(id);
      toast.success('Proveedor eliminado');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Proveedor',
      sortable: true,
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <Building className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <p className="font-medium text-neutral-50">{supplier.name}</p>
            <p className="text-xs text-neutral-400">RUC: {supplier.ruc}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2 text-neutral-300">
          <Phone className="w-4 h-4 text-neutral-400" />
          {supplier.phone}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2 text-neutral-300">
          <Mail className="w-4 h-4 text-neutral-400" />
          {supplier.email}
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Estado',
      render: (supplier: Supplier) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            supplier.active
              ? 'bg-success/20 text-success'
              : 'bg-neutral-700 text-neutral-400'
          }`}
        >
          {supplier.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(supplier)}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(supplier.id)}
            className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

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
            Gestiona tus proveedores • {suppliers.length} registrados
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-300">Total Proveedores</span>
          </div>
          <p className="text-3xl font-bold text-neutral-50">{suppliers.length}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-success" />
            </div>
            <span className="text-neutral-300">Activos</span>
          </div>
          <p className="text-3xl font-bold text-success">
            {suppliers.filter((s) => s.active).length}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-300">Inactivos</span>
          </div>
          <p className="text-3xl font-bold text-warning">
            {suppliers.filter((s) => !s.active).length}
          </p>
        </motion.div>
      </div>

      {/* Table */}
      <DataTable
        data={suppliers}
        columns={columns}
        searchable
        searchKeys={['name', 'ruc', 'email']}
        pageSize={10}
      />

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-lg"
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
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Distribuidora Central"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Teléfono
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
                    Dirección
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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingSupplier ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
