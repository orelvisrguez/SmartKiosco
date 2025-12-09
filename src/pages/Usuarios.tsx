import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAppStore, type User } from '@/stores/useAppStore';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

const roles = [
  { id: 'admin', label: 'Administrador', color: '#F87171', description: 'Acceso total al sistema' },
  { id: 'manager', label: 'Gerente', color: '#FBBF24', description: 'Gestión de inventario y reportes' },
  { id: 'cashier', label: 'Cajero', color: '#4ADE80', description: 'Solo punto de venta' },
];

export function Usuarios() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier' as User['role'],
    password: '',
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'cashier', password: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error('Completa los campos requeridos');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      toast.success('Usuario actualizado');
    } else {
      if (!formData.password) {
        toast.error('La contraseña es requerida');
        return;
      }
      addUser({
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: true,
      });
      toast.success('Usuario creado');
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      deleteUser(id);
      toast.success('Usuario eliminado');
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes desactivar tu propio usuario');
      return;
    }
    updateUser(user.id, { active: !user.active });
    toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado');
  };

  const columns = [
    {
      key: 'name',
      label: 'Usuario',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-neutral-950 font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-neutral-50">{user.name}</p>
            <p className="text-xs text-neutral-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (user: User) => {
        const role = roles.find((r) => r.id === user.role);
        return (
          <span
            className="px-3 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: `${role?.color}20`,
              color: role?.color,
            }}
          >
            {role?.label}
          </span>
        );
      },
    },
    {
      key: 'active',
      label: 'Estado',
      render: (user: User) => (
        <button
          onClick={() => handleToggleActive(user)}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            user.active
              ? 'bg-success/20 text-success hover:bg-success/30'
              : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
          }`}
        >
          {user.active ? (
            <>
              <UserCheck className="w-3 h-3" />
              Activo
            </>
          ) : (
            <>
              <UserX className="w-3 h-3" />
              Inactivo
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(user)}
            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
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
          <h1 className="text-3xl font-bold text-neutral-50">Usuarios</h1>
          <p className="text-neutral-300 mt-1">
            Gestión de usuarios y permisos • {users.length} usuarios
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const count = users.filter((u) => u.role === role.id).length;
          return (
            <motion.div
              key={role.id}
              whileHover={{ y: -4 }}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <Shield className="w-6 h-6" style={{ color: role.color }} />
                </div>
                <div>
                  <p className="font-semibold text-neutral-50">{role.label}</p>
                  <p className="text-sm text-neutral-400">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: role.color }}>
                  {count}
                </span>
                <span className="text-sm text-neutral-400">usuarios</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table */}
      <DataTable
        data={users}
        columns={columns}
        searchable
        searchKeys={['name', 'email']}
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
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="email@kiosko.com"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Rol *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.id as User['role'] })}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.role === role.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <Shield
                          className={`w-5 h-5 mx-auto mb-1 ${
                            formData.role === role.id ? 'text-primary-500' : 'text-neutral-400'
                          }`}
                          style={{ color: formData.role === role.id ? role.color : undefined }}
                        />
                        <p
                          className={`text-xs font-medium ${
                            formData.role === role.id ? 'text-neutral-50' : 'text-neutral-400'
                          }`}
                        >
                          {role.label}
                        </p>
                      </button>
                    ))}
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
                    {editingUser ? 'Guardar' : 'Crear'}
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
