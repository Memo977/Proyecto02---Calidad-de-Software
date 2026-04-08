/**
 * @file components/Layout.jsx
 * @description Componente de layout principal de la aplicación (post-login).
 * Provee la estructura de dos columnas: sidebar de navegación fijo a la izquierda
 * y área de contenido principal a la derecha donde se renderizan las páginas
 * mediante el componente `<Outlet />` de React Router.
 *
 * El sidebar filtra automáticamente los ítems de navegación según los permisos
 * del usuario autenticado — si no tiene el permiso requerido, el ítem no se muestra.
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ClipboardList,
  ShieldCheck, LogOut, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Definición de los ítems del menú de navegación lateral.
 * Cada ítem puede requerir un permiso específico; si `permission` es null,
 * el ítem es visible para todos los usuarios autenticados.
 *
 * @type {{ to: string, label: string, icon: React.ComponentType, permission: string|null, end?: boolean }[]}
 */
const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null, end: true },
  { to: '/products', label: 'Productos', icon: Package, permission: 'VIEW_PRODUCTS' },
  { to: '/users', label: 'Usuarios', icon: Users, permission: 'VIEW_USERS' },
  { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'VIEW_ROLES' },
  { to: '/audit', label: 'Auditoría', icon: ClipboardList, permission: 'VIEW_AUDIT_LOG' },
];

/**
 * Mapa de clases CSS para el badge de rol del usuario según su nombre de rol.
 * Los colores varían por rol para facilitar la identificación visual.
 *
 * @type {Record<string, string>}
 */
const roleBadgeColor = {
  SUPERADMIN:  'bg-violet/20 text-violet-light border-violet/30',
  AUDITOR:     'bg-cyan/10 text-cyan-light border-cyan/20',
  REGISTRADOR: 'bg-accent/10 text-accent-light border-accent/20',
};

/**
 * Layout principal de la aplicación.
 * Renderiza el sidebar con navegación filtrada por permisos y el área de
 * contenido donde las páginas hijas son inyectadas por React Router.
 *
 * @returns {JSX.Element}
 */
export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  /**
   * Ejecuta el logout y redirige al login.
   * Llama al endpoint de cierre de sesión antes de navegar para asegurar
   * que el token sea invalidado en el servidor.
   *
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-base bg-grid-pattern">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-base-50 border-r border-base-200 z-10">
        {/* Logo / nombre de la app */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-base-200">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow-sm">
            <Lock size={15} className="text-white" />
          </div>
          <span className="font-semibold text-tx-primary tracking-tight">SecureApp</span>
        </div>

        {/* Menú de navegación — ítems filtrados por permisos del usuario */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, permission, end }) => {
            const allowed = !permission || hasPermission(permission);
            if (!allowed) return null;  // Ocultar si el usuario no tiene el permiso
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${isActive
                    ? 'bg-accent/15 text-accent-light border border-accent/20 shadow-glow-sm'
                    : 'text-tx-secondary hover:text-tx-primary hover:bg-base-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-accent-light' : 'text-tx-muted group-hover:text-tx-secondary'} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={14} className="text-accent-light opacity-60" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Información del usuario y botón de logout */}
        <div className="p-3 border-t border-base-200">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-base-100">
            {/* Avatar con iniciales del username */}
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-light text-xs font-semibold font-mono">
                {user?.username?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-tx-primary truncate">{user?.username}</p>
              {/* Badge de rol con color según el tipo de rol */}
              <span className={`badge border text-[10px] mt-0.5 ${roleBadgeColor[user?.role] || 'bg-base-200 text-tx-secondary'}`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-tx-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Área de contenido principal ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8 animate-fadeIn">
          {/* Las páginas hijas son renderizadas aquí por React Router */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
