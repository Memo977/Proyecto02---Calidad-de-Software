import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Search, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { Button, Input, Select } from '../components/ui/index.jsx';
import { Badge } from '../components/ui/index.jsx';
import api from '../utils/api';

const EMPTY = { username: '', email: '', password: '', roleId: '' };

function validate(form, isEditing) {
  const errs = {};
  if (!form.username?.trim()) errs.username = 'Requerido';
  else if (!/^[a-zA-Z0-9]{3,50}$/.test(form.username)) errs.username = 'Alfanumérico, 3–50 caracteres';
  if (!form.email?.trim()) errs.email = 'Requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido';
  if (!isEditing && !form.password) errs.password = 'Requerido';
  if (form.password && form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
  if (form.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = 'Debe tener mayúscula, minúscula y número';
  if (!form.roleId) errs.roleId = 'Requerido';
  return errs;
}

const roleBadge = {
  SUPERADMIN: 'violet',
  AUDITOR: 'cyan',
  REGISTRADOR: 'accent',
};

export default function Users() {
  const { user: me, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [apiError, setApiError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.get('/users'), api.get('/roles')])
      .then(([ur, rr]) => { setUsers(ur.data); setRoles(rr.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null); setForm(EMPTY); setErrors({}); setApiError(''); setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: '', roleId: String(u.role.id) });
    setErrors({}); setApiError(''); setModalOpen(true);
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(errs => { const n = { ...errs }; delete n[field]; return n; });
  };

  const handleSave = async () => {
    const errs = validate(form, !!editing);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      const payload = { username: form.username, email: form.email, roleId: form.roleId };
      if (form.password) payload.password = form.password;
      if (editing) await api.put(`/users/${editing.id}`, payload);
      else await api.post('/users', { ...payload, password: form.password });
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar.');
    }
  };

  const canCreate = hasPermission('CREATE_USER');
  const canEdit = hasPermission('EDIT_USER');
  const canDelete = hasPermission('DELETE_USER');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet/15 border border-violet/20 flex items-center justify-center">
            <UsersIcon size={17} className="text-violet-light" />
          </div>
          <div>
            <h1 className="section-title text-xl">Usuarios</h1>
            <p className="text-xs text-tx-muted">{users.length} registros</p>
          </div>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus size={16} /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-base-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
            <input className="input-field pl-9 py-2 text-sm" placeholder="Buscar usuario o email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-200 bg-base-50/50">
                {['Usuario', 'Email', 'Rol', 'Permisos', 'Último login', 'IP', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-left label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-base-200">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-base-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-tx-muted">No hay usuarios.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-light text-[11px] font-mono font-semibold">
                          {u.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-tx-primary">{u.username}</span>
                      {u.id === me?.id && <span className="badge bg-success/10 text-success border-success/20 border text-[10px]">tú</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-tx-secondary">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={roleBadge[u.role.name] || 'default'}>{u.role.name}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-tx-muted font-mono">{u.permissions?.length ?? 0} permisos</span>
                  </td>
                  <td className="px-5 py-3.5 text-tx-secondary text-xs font-mono">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-CR') : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-tx-muted text-xs font-mono">{u.lastLoginIp || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-md text-tx-muted hover:text-accent-light hover:bg-accent/10 transition-all" title="Editar">
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && u.id !== me?.id && (
                        <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-md text-tx-muted hover:text-danger hover:bg-danger/10 transition-all" title="Eliminar">
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <div className="space-y-4">
          {apiError && (
            <div className="flex items-center gap-2 text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm">
              <AlertCircle size={14} /> {apiError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Username *" value={form.username} onChange={handleChange('username')} error={errors.username} placeholder="usuario123" />
            <Input label="Email *" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="email@ejemplo.com" />
          </div>
          <Input label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'} type="password" value={form.password} onChange={handleChange('password')} error={errors.password} placeholder="Mín. 8 chars, mayús, minús, número" />
          <Select label="Rol *" value={form.roleId} onChange={handleChange('roleId')} error={errors.roleId}>
            <option value="">Seleccionar rol…</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-ghost text-sm">Cancelar</button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p className="text-tx-secondary text-sm">¿Eliminar al usuario <strong className="text-tx-primary">{deleteTarget?.username}</strong>?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-ghost text-sm">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger text-sm"><Trash2 size={14} /> Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
