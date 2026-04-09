import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/index.jsx';
import api from '../utils/api';

const EVENT_VARIANT = {
  LOGIN_SUCCESS: 'success',
  LOGOUT: 'accent',
  LOGIN_FAILED: 'danger',
  LOGIN_BLOCKED: 'danger',
  ACCESS_DENIED: 'danger',
  USER_CREATED: 'success',
  USER_UPDATED: 'warning',
  USER_DELETED: 'danger',
  PRODUCT_CREATED: 'success',
  PRODUCT_UPDATED: 'warning',
  PRODUCT_DELETED: 'danger',
  ROLE_CHANGED: 'violet',
  ROLE_PERMISSIONS_CHANGED: 'violet',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.append('event', search);
    api.get(`/audit?${params}`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
            <ClipboardList size={17} className="text-warning" />
          </div>
          <div>
            <h1 className="section-title text-xl">Log de Auditoría</h1>
            <p className="text-xs text-tx-muted">{total} eventos registrados</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="btn-ghost text-sm" title="Actualizar">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Search */}
        <div className="px-5 py-3.5 border-b border-base-200">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" />
            <input
              className="input-field pl-9 py-2 text-sm font-mono"
              placeholder="Filtrar por evento…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-200 bg-base-50/50">
                {['#', 'Evento', 'Usuario', 'Detalles', 'IP', 'Ruta', 'Fecha/Hora'].map(h => (
                  <th key={h} className="px-5 py-3 text-left label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-base-200">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 bg-base-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-tx-muted">Sin eventos en este período.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="px-5 py-3 text-tx-muted font-mono text-xs">{log.id}</td>
                  <td className="px-5 py-3">
                    <Badge variant={EVENT_VARIANT[log.event] || 'default'}>{log.event}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-tx-secondary">{log.user?.username || '—'}</td>
                  <td className="px-5 py-3 text-xs text-tx-secondary max-w-xs truncate">{log.details || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-tx-muted">{log.ipAddress}</td>
                  <td className="px-5 py-3 font-mono text-xs text-tx-muted truncate max-w-[120px]">{log.path || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-tx-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es-CR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-base-200">
            <span className="text-xs text-tx-muted font-mono">
              Pág. {page} de {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-tx-muted hover:text-tx-primary hover:bg-base-200 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded text-tx-muted hover:text-tx-primary hover:bg-base-200 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
