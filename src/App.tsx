import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { POS } from '@/pages/POS';
import { Caja } from '@/pages/Caja';
import { Productos } from '@/pages/Productos';
import { Inventario } from '@/pages/Inventario';
import { Categorias } from '@/pages/Categorias';
import { Proveedores } from '@/pages/Proveedores';
import { Compras } from '@/pages/Compras';
import { Finanzas } from '@/pages/Finanzas';
import { Reportes } from '@/pages/Reportes';
import { Usuarios } from '@/pages/Usuarios';
import { Configuracion } from '@/pages/Configuracion';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#262626',
            color: '#fafafa',
            border: '1px solid #404040',
          },
          success: {
            iconTheme: {
              primary: '#4ADE80',
              secondary: '#0a0a0a',
            },
          },
          error: {
            iconTheme: {
              primary: '#F87171',
              secondary: '#0a0a0a',
            },
          },
        }}
      />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/reportes" element={<Reportes />} />
          {/* Admin-only routes */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
