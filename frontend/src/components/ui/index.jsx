/**
 * @file components/ui/index.jsx
 * @description Biblioteca de componentes UI reutilizables de la aplicación.
 * Todos los componentes usan las clases del sistema de diseño definido en
 * `index.css` (Tailwind + tokens personalizados) para garantizar consistencia
 * visual en toda la app.
 *
 * Componentes exportados:
 *  - `Badge`    — Etiqueta de estado con variantes de color
 *  - `Button`   — Botón con variantes, tamaños y estado de carga
 *  - `Input`    — Campo de texto con label y mensaje de error
 *  - `Select`   — Selector desplegable con label y mensaje de error
 *  - `Textarea` — Área de texto multilínea con label y mensaje de error
 */

/**
 * Etiqueta de estado visual con variantes de color predefinidas.
 * Útil para mostrar roles, estados o categorías de forma destacada.
 *
 * @param {{ variant?: 'default'|'accent'|'success'|'warning'|'danger'|'violet'|'cyan', children: React.ReactNode }} props
 * @returns {JSX.Element}
 *
 * @example
 * <Badge variant="success">Activo</Badge>
 * <Badge variant="danger">Sin stock</Badge>
 */
export function Badge({ variant = 'default', children }) {
  const variants = {
    default: 'bg-base-200 text-tx-secondary border-base-300',
    accent: 'bg-accent/15 text-accent-light border-accent/25',
    success: 'bg-success/15 text-success border-success/25',
    warning: 'bg-warning/15 text-warning border-warning/25',
    danger: 'bg-danger/15 text-danger border-danger/25',
    violet: 'bg-violet/15 text-violet-light border-violet/25',
    cyan: 'bg-cyan/10 text-cyan-light border-cyan/20',
  };
  return (
    <span className={`badge border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

/**
 * Botón con múltiples variantes de estilo, tamaños y estado de carga.
 * Cuando `loading` es true, muestra un spinner y deshabilita el botón
 * para prevenir envíos duplicados.
 *
 * @param {{
 *   variant?: 'primary'|'ghost'|'danger'|'outline',
 *   size?: 'sm'|'md'|'lg',
 *   loading?: boolean,
 *   children: React.ReactNode,
 *   className?: string,
 *   [key: string]: any
 * }} props
 * @returns {JSX.Element}
 *
 * @example
 * <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
 *   Guardar
 * </Button>
 */
export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    outline: 'bg-transparent border border-base-200 hover:border-accent/50 text-tx-secondary hover:text-tx-primary px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm', lg: 'text-base px-5 py-3' };
  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Cargando...
        </>
      ) : children}
    </button>
  );
}

/**
 * Campo de texto con label opcional y mensaje de error integrado.
 * Los estilos de error se aplican automáticamente cuando se provee `error`.
 *
 * @param {{ label?: string, error?: string, [key: string]: any }} props
 * @returns {JSX.Element}
 *
 * @example
 * <Input label="Nombre de usuario" error={errors.username?.message} {...register('username')} />
 */
export function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <input className={`input-field ${error ? 'border-danger focus:border-danger focus:ring-danger/30' : ''}`} {...props} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/**
 * Selector desplegable con label opcional y mensaje de error integrado.
 *
 * @param {{ label?: string, error?: string, children: React.ReactNode, [key: string]: any }} props
 * @returns {JSX.Element}
 *
 * @example
 * <Select label="Rol" error={errors.roleId?.message} {...register('roleId')}>
 *   <option value="">Selecciona un rol</option>
 *   {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
 * </Select>
 */
export function Select({ label, error, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <select
        className={`input-field appearance-none ${error ? 'border-danger' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/**
 * Área de texto multilínea con label opcional y mensaje de error integrado.
 * Por defecto muestra 3 filas. No permite redimensionamiento manual.
 *
 * @param {{ label?: string, error?: string, [key: string]: any }} props
 * @returns {JSX.Element}
 *
 * @example
 * <Textarea label="Descripción" error={errors.description?.message} {...register('description')} />
 */
export function Textarea({ label, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea
        className={`input-field resize-none ${error ? 'border-danger' : ''}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
