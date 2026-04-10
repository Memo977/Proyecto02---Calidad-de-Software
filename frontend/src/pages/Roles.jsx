import { useState, useEffect } from 'react';
import { ShieldCheck, Check, Save, Users } from 'lucide-react';
import { Badge } from '../components/ui/index.jsx';
import { Button } from '../components/ui/index.jsx';
import api from '../utils/api';

const roleBadge = { SUPERADMIN: 'violet', AUDITOR: 'cyan', REGISTRADOR: 'accent' };

const PERMISSION_GROUPS = {
  'Usuarios': ['VIEW_USERS', 'CREATE_USER', 'EDIT_USER', 'DELETE_USER'],
  'Productos': ['VIEW_PRODUCTS', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT'],
  'Roles': ['VIEW_ROLES', 'MANAGE_ROLES'],
  'Auditoría': ['VIEW_AUDIT_LOG'],
  'Reportes': ['VIEW_REPORTS'],
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pendingPerms, setPendingPerms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/roles'), api.get('/roles/permissions')])
      .then(([rr, pr]) => {
        setRoles(rr.data);
        setAllPermissions(pr.data);
        if (rr.data.length > 0) {
          setSelected(rr.data[0]);
          setPendingPerms(rr.data[0].permissions.map(rp => rp.permissionId || rp.permission?.id));
        }
      });
  }, []);

  const selectRole = (role) => {
    setSelected(role);
    setPendingPerms(role.permissions.map(rp => rp.permissionId || rp.permission?.id));
    setSaved(false);
  };

  const togglePerm = (permId) => {
    setPendingPerms(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/roles/${selected.id}/permissions`, { permissionIds: pendingPerms });
      const rr = await api.get('/roles');
      setRoles(rr.data);
      const updated = rr.data.find(r => r.id === selected.id);
      setSelected(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar permisos.');
    } finally {
      setSaving(false);
    }
  };

  const getPermId = (name) => allPermissions.find(p => p.name === name)?.id;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center">
          <ShieldCheck size={17} className="text-cyan-light" />
        </div>
        <div>
          <h1 className="section-title text-xl">Roles y Permisos</h1>
          <p className="text-xs text-tx-muted">{roles.length} roles configurados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role list */}
        <div className="space-y-2">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-150
                ${selected?.id === role.id
                  ? 'bg-accent/10 border-accent/30 shadow-glow-sm'
                  : 'bg-base-50 border-base-200 hover:border-base-300'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant={roleBadge[role.name] || 'default'}>{role.name}</Badge>
                <div className="flex items-center gap-1 text-tx-muted text-xs font-mono">
                  <Users size={12} />
                  {role._count?.users ?? 0}
                </div>
              </div>
              <p className="text-xs text-tx-muted">
                {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        {selected && (
          <div className="lg:col-span-2 card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Permisos — {selected.name}</h2>
                <p className="text-xs text-tx-muted mt-0.5">{pendingPerms.length} permisos asignados</p>
              </div>
              <Button onClick={handleSave} loading={saving} size="sm" variant={saved ? 'outline' : 'primary'}>
                {saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                <div key={group}>
                  <p className="label mb-2">{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(permName => {
                      const permId = getPermId(permName);
                      const checked = permId && pendingPerms.includes(permId);
                      return (
                        <button
                          key={permName}
                          onClick={() => permId && togglePerm(permId)}
                          disabled={!permId}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs font-mono transition-all duration-150
                            ${checked
                              ? 'bg-accent/10 border-accent/30 text-accent-light'
                              : 'bg-base-100 border-base-200 text-tx-secondary hover:border-base-300 hover:text-tx-primary'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                            ${checked ? 'bg-accent border-accent' : 'border-base-300'}`}>
                            {checked && <Check size={10} className="text-white" />}
                          </div>
                          {permName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
