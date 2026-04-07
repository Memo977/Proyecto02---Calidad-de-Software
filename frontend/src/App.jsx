/**
 * @file App.jsx
 * @description Componente raíz de la aplicación React.
 * Configura el enrutamiento de la SPA con React Router y aplica protección
 * de rutas basada en autenticación y permisos mediante el componente `ProtectedRoute`.
 *
 * Estructura de rutas:
 *  - /login          → Página de inicio de sesión (pública)
 *  - /               → Dashboard (requiere sesión)
 *  - /products       → Gestión de productos (requiere VIEW_PRODUCTS)
 *  - /users          → Gestión de usuarios (requiere VIEW_USERS)
 *  - /audit          → Log de auditoría (requiere VIEW_AUDIT_LOG)
 *  - /roles          → Gestión de roles (requiere VIEW_ROLES)
 *  - *               → Redirige a /
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Roles from './pages/Roles';
import Layout from './components/Layout';

/**
 * Guardia de ruta que protege el acceso a componentes que requieren autenticación
 * y/o un permiso específico.
 *
 * Comportamiento:
 * - Muestra un spinner mientras se verifica la sesión inicial.
 * - Redirige a `/login` si el usuario no está autenticado.
 * - Redirige a `/` si el usuario no tiene el permiso requerido.
 * - Renderiza el componente hijo si pasa todas las comprobaciones.
 *
 * @param {{ children: React.ReactNode, permission?: string }} props
 *   - children   — Componente a proteger
 *   - permission — Permiso requerido (opcional); si se omite, solo verifica autenticación
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-tx-secondary text-sm font-mono">cargando...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/" replace />;
  return children;
};

/**
 * Componente raíz de la aplicación.
 * Envuelve toda la app con el `AuthProvider` y configura las rutas principales.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas — Layout provee la navegación compartida */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={
              <ProtectedRoute permission="VIEW_PRODUCTS"><Products /></ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute permission="VIEW_USERS"><Users /></ProtectedRoute>
            } />
            <Route path="audit" element={
              <ProtectedRoute permission="VIEW_AUDIT_LOG"><AuditLog /></ProtectedRoute>
            } />
            <Route path="roles" element={
              <ProtectedRoute permission="VIEW_ROLES"><Roles /></ProtectedRoute>
            } />
          </Route>

          {/* Catch-all: redirige rutas desconocidas al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
