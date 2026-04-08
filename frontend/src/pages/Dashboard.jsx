import { useState, useEffect } from 'react';
import { Package, Users, ClipboardList, ShieldCheck, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4 hover:border-base-300 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="label mb-0.5">{label}</p>
        {loading
          ? <div className="h-7 w-16 bg-base-200 rounded animate-pulse" />
          : <p className="text-2xl font-semibold text-tx-primary font-mono">{value ?? '—'}</p>
        }
      </div>
    </div>
  );
}

const roleColor = {
  SUPERADMIN: 'bg-violet/20 text-violet-light border border-violet/30',
  AUDITOR: 'bg-cyan/10 text-cyan-light border border-cyan/20',
  REGISTRADOR: 'bg-accent/10 text-accent-light border border-accent/20',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: null, users: null, logs: null, roles: null });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches = [];

    if (user?.permissions?.includes('VIEW_PRODUCTS')) {
      fetches.push(api.get('/products').then(r => setStats(s => ({ ...s, products: r.data.length }))).catch(() => {}));
    }
    if (user?.permissions?.includes('VIEW_USERS')) {
      fetches.push(api.get('/users').then(r => setStats(s => ({ ...s, users: r.data.length }))).catch(() => {}));
    }
    if (user?.permissions?.includes('VIEW_AUDIT_LOG')) {
      fetches.push(
        api.get('/audit?limit=5').then(r => {
          setStats(s => ({ ...s, logs: r.data.total }));
          setRecentLogs(r.data.logs);
        }).catch(() => {})
      );
    }
    if (user?.permissions?.includes('VIEW_ROLES')) {
      fetches.push(api.get('/roles').then(r => setStats(s => ({ ...s, roles: r.data.length }))).catch(() => {}));
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user]);

  const eventColor = (event) => {
    if (event.includes('FAIL') || event.includes('DENIED') || event.includes('DELET')) return 'text-danger';
    if (event.includes('SUCCESS') || event.includes('CREAT')) return 'text-success';
    if (event.includes('UPDATE') || event.includes('CHANGE')) return 'text-warning';
    return 'text-tx-secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-tx-primary tracking-tight">
            Bienvenido, <span className="text-accent-light">{user?.username}</span>
          </h1>
          <p className="text-tx-secondary text-sm mt-0.5">Panel de control · Sistema Seguro</p>
        </div>
        <span className={`badge border ${roleColor[user?.role] || 'bg-base-200 text-tx-secondary'} text-xs`}>
          {user?.role}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {user?.permissions?.includes('VIEW_PRODUCTS') && (
          <StatCard icon={Package} label="Productos" value={stats.products} color="bg-accent/15 text-accent-light" loading={loading} />
        )}
        {user?.permissions?.includes('VIEW_USERS') && (
          <StatCard icon={Users} label="Usuarios" value={stats.users} color="bg-violet/15 text-violet-light" loading={loading} />
        )}
        {user?.permissions?.includes('VIEW_ROLES') && (
          <StatCard icon={ShieldCheck} label="Roles" value={stats.roles} color="bg-cyan/10 text-cyan-light" loading={loading} />
        )}
        {user?.permissions?.includes('VIEW_AUDIT_LOG') && (
          <StatCard icon={ClipboardList} label="Eventos de auditoría" value={stats.logs} color="bg-warning/10 text-warning" loading={loading} />
        )}
      </div>

      {/* Permissions & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Your permissions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-accent-light" />
            <h2 className="section-title">Tus permisos</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.permissions?.map(p => (
              <span key={p} className="badge border border-base-300 bg-base-100 text-tx-secondary text-[11px]">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Recent audit events (if allowed) */}
        {user?.permissions?.includes('VIEW_AUDIT_LOG') && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-accent-light" />
              <h2 className="section-title">Actividad reciente</h2>
            </div>
            {recentLogs.length === 0
              ? <p className="text-tx-muted text-sm">Sin eventos recientes.</p>
              : (
                <div className="space-y-2">
                  {recentLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-base-200 last:border-0">
                      <span className={`font-mono text-xs font-medium mt-0.5 ${eventColor(log.event)}`}>
                        {log.event}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-tx-secondary truncate">{log.details || '—'}</p>
                        <p className="text-[11px] text-tx-muted mt-0.5 font-mono">
                          {log.ipAddress} · {new Date(log.createdAt).toLocaleString('es-CR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
