/**
 * @file components/ui/Modal.jsx
 * @description Componente de diálogo modal reutilizable.
 * Renderiza un overlay con un panel de diálogo centrado que incluye:
 *  - Cierre al presionar la tecla Escape
 *  - Cierre al hacer clic en el backdrop (fuera del panel)
 *  - Cierre con el botón X del encabezado
 *  - Animación de entrada (animate-fadeIn)
 *  - Backdrop con blur para enfocar la atención en el diálogo
 *
 * Si `open` es false, el componente no renderiza nada (null), por lo que
 * es seguro mantenerlo en el árbol sin condiciones adicionales.
 */

import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal de diálogo accesible con soporte de teclado.
 *
 * @param {{
 *   open: boolean,                 - Controla si el modal está visible
 *   onClose: () => void,           - Callback ejecutado al cerrarse el modal
 *   title: string,                 - Título mostrado en el encabezado del modal
 *   children: React.ReactNode,     - Contenido del cuerpo del modal
 *   size?: 'sm'|'md'|'lg'|'xl'    - Ancho máximo del panel (default: 'md')
 * }} props
 * @returns {JSX.Element|null} El modal o null si `open` es false
 *
 * @example
 * <Modal open={showForm} onClose={() => setShowForm(false)} title="Crear producto" size="lg">
 *   <ProductForm onSuccess={() => setShowForm(false)} />
 * </Modal>
 */
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  /**
   * Registra/desregistra el listener de teclado cuando el modal se abre o cierra.
   * Cierra el modal al presionar Escape para mejorar la accesibilidad.
   */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  /** Mapa de tamaños predefinidos para el ancho máximo del panel */
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop semi-transparente con blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel de diálogo */}
      <div className={`relative w-full ${sizes[size]} bg-base-50 border border-base-200 rounded-2xl shadow-card animate-fadeIn`}>
        {/* Encabezado con título y botón de cierre */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h2 className="section-title">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-tx-muted hover:text-tx-primary hover:bg-base-200 transition-all"
          >
            <X size={16} />
          </button>
        </div>
        {/* Contenido del modal */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
