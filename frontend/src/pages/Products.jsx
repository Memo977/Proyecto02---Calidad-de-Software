import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package, Search, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { Button, Input, Textarea } from '../components/ui/index.jsx';
import api from '../utils/api';

const EMPTY = { code: '', name: '', description: '', quantity: '', price: '' };

function validate(form) {
  const errs = {};
  if (!form.code.trim()) errs.code = 'Requerido';
  else if (!/^[a-zA-Z0-9]+$/.test(form.code)) errs.code = 'Solo alfanumérico';
  else if (form.code.length < 2 || form.code.length > 20) errs.code = '2–20 caracteres';
  if (!form.name.trim()) errs.name = 'Requerido';
  else if (form.name.length < 2) errs.name = 'Mínimo 2 caracteres';
  if (form.description && form.description.length > 500) errs.description = 'Máx 500 caracteres';
  if (form.quantity === '') errs.quantity = 'Requerido';
  else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) errs.quantity = 'Entero ≥ 0';
  if (form.price === '') errs.price = 'Requerido';
  else if (isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Número positivo';
  return errs;
}

export default function Products() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [apiError, setApiError] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products')
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setErrors({}); setApiError(''); setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ code: p.code, name: p.name, description: p.description || '', quantity: String(p.quantity), price: String(p.price) });
    setErrors({}); setApiError(''); setModalOpen(true);
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(errs => { const n = { ...errs }; delete n[field]; return n; });
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post('/products', form);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar.');
    }
  };

  const canWrite = hasPermission('CREATE_PRODUCT');
  const canEdit = hasPermission('EDIT_PRODUCT');
  const canDelete = hasPermission('DELETE_PRODUCT');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
            <Package size={17} className="text-accent-light" />
          </div>
          <div>
            <h1 className="section-title text-xl">Productos</h1>
            <p className="text-xs text-tx-muted">{products.length} registros</p>
          </div>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus size={16} /> Nuevo producto
          </button>
        )}
      </div>

      {/* Search + Table */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-base-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
            <input
              className="input-field pl-9 py-2 text-sm"
              placeholder="Buscar por código o nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-200 bg-base-50/50">
                {['Código', 'Nombre', 'Descripción', 'Cantidad', 'Precio', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-left label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-base-200">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-base-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-tx-muted">
                    {search ? 'Sin resultados para tu búsqueda.' : 'No hay productos registrados.'}
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-accent-light text-xs bg-accent/10 px-2 py-0.5 rounded">{p.code}</span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-tx-primary">{p.name}</td>
                  <td className="px-5 py-3.5 text-tx-secondary max-w-xs truncate">{p.description || '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-tx-primary">{p.quantity}</td>
                  <td className="px-5 py-3.5 font-mono text-success">₡{Number(p.price).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-tx-muted hover:text-accent-light hover:bg-accent/10 transition-all" title="Editar">
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md text-tx-muted hover:text-danger hover:bg-danger/10 transition-all" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <div className="space-y-4">
          {apiError && (
            <div className="flex items-center gap-2 text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm">
              <AlertCircle size={14} /> {apiError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código *" value={form.code} onChange={handleChange('code')} error={errors.code} placeholder="PROD001" />
            <Input label="Nombre *" value={form.name} onChange={handleChange('name')} error={errors.name} placeholder="Nombre del producto" />
          </div>
          <Textarea label="Descripción" value={form.description} onChange={handleChange('description')} error={errors.description} placeholder="Descripción opcional..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cantidad *" type="number" min="0" value={form.quantity} onChange={handleChange('quantity')} error={errors.quantity} placeholder="0" />
            <Input label="Precio *" type="number" min="0" step="0.01" value={form.price} onChange={handleChange('price')} error={errors.price} placeholder="0.00" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-ghost text-sm">Cancelar</button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Crear producto'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p className="text-tx-secondary text-sm">
            ¿Eliminar el producto <strong className="text-tx-primary">{deleteTarget?.name}</strong> ({deleteTarget?.code})?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost text-sm">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger text-sm"><Trash2 size={14} /> Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
