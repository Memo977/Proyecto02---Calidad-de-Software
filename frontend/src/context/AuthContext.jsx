/**
 * @file context/AuthContext.jsx
 * @description Contexto de autenticación global para la aplicación React.
 * Provee el estado del usuario autenticado y las funciones de login/logout
 * a todos los componentes hijos mediante el React Context API.
 *
 * Al montar el `AuthProvider`, realiza una petición a `/auth/me` para
 * restaurar la sesión automáticamente si existe una cookie de sesión válida.
 *
 * Exportaciones:
 *  - `AuthProvider` — Componente proveedor del contexto (envuelve la app)
 *  - `useAuth`      — Hook personalizado para consumir el contexto
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

/** @type {React.Context<AuthContextValue|null>} Contexto de autenticación */
const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación.
 * Gestiona el estado del usuario, la carga inicial y expone las funciones
 * de autenticación a sus descendientes.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  /** @type {[object|null, Function]} Usuario autenticado o null si no hay sesión */
  const [user, setUser] = useState(null);

  /** @type {[boolean, Function]} true mientras se verifica la sesión al inicio */
  const [loading, setLoading] = useState(true);

  /**
   * Al montar el proveedor, intenta recuperar la sesión actual llamando a
   * GET /api/auth/me. Si la cookie de sesión es válida, el usuario queda
   * hidratado en el estado; si no, se deja como null.
   */
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Inicia sesión con las credenciales proporcionadas.
   * Actualiza el estado del usuario con los datos retornados por el backend.
   *
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<object>} Datos del usuario autenticado
   * @throws {AxiosError} Si las credenciales son inválidas o el usuario está bloqueado
   */
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    setUser(res.data.user);
    return res.data.user;
  };

  /**
   * Cierra la sesión del usuario actual.
   * Llama al endpoint de logout para invalidar el token en el backend
   * y limpia el estado local.
   *
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar errores del backend (ej. sesión ya expirada);
      // de todas formas limpiamos el estado local.
    } finally {
      setUser(null);
    }
  };

  /**
   * Verifica si el usuario actual tiene un permiso específico.
   *
   * @param {string} perm - Nombre del permiso a verificar (p.ej. 'VIEW_USERS')
   * @returns {boolean} true si el usuario posee el permiso
   */
  const hasPermission = (perm) => user?.permissions?.includes(perm) ?? false;

  /**
   * Verifica si el usuario actual tiene un rol específico.
   *
   * @param {string} role - Nombre del rol a verificar (p.ej. 'SuperAdmin')
   * @returns {boolean} true si el usuario tiene ese rol
   */
  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para consumir el contexto de autenticación.
 * Debe usarse dentro de un componente hijo de `AuthProvider`.
 *
 * @returns {{ user: object|null, loading: boolean, login: Function, logout: Function, hasPermission: Function, hasRole: Function }}
 *
 * @example
 * const { user, hasPermission } = useAuth();
 * if (hasPermission('CREATE_USER')) { ... }
 */
export const useAuth = () => useContext(AuthContext);
