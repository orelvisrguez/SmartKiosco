import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
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
      <Routes>
        <Route element={<MainLayout />}>
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
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
