import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sociosApi, type Socio } from '../../api/sociosApi';
import { usePermissions } from '../../hooks/usePermissions';
import { ApiError } from '../../api/client';

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MetricCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{
    flex: '1 1 140px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 700, color, marginTop: '0.25rem' }}>
      {value}
    </div>
  </div>
);

export const SociosView: React.FC = () => {
  const { accessToken, hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canSync = hasPermission('user-permission-create');

  const { data: socios, isLoading, error, isFetching } = useQuery<Socio[], ApiError>({
    queryKey: ['socios'],
    queryFn: () => sociosApi.getAll(accessToken),
    enabled: !!accessToken
  });

  const syncMutation = useMutation<{ sincronizados: number }, ApiError>({
    mutationFn: () => sociosApi.sync(accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['socios'] });
    }
  });

  const total = socios?.length ?? 0;
  const activos = socios?.filter((s) => s.activo).length ?? 0;
  const inactivos = total - activos;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0', color: '#1a202c' }}>Socios del VideoClub</h2>
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
          Réplica local de las identidades de Keycloak, sincronizada por eventos de dominio vía RabbitMQ.
          Requiere <code>socio-permission-read</code>.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <MetricCard label="Total Socios" value={total} color="#2d3748" />
        <MetricCard label="Activos" value={activos} color="#276749" />
        <MetricCard label="Inactivos" value={inactivos} color="#9b2c2c" />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['socios'] })}
          disabled={isFetching}
          style={{
            padding: '0.4rem 0.9rem',
            backgroundColor: '#2b6cb0',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: isFetching ? 0.7 : 1
          }}
        >
          {isFetching ? 'Actualizando...' : '↻ Refrescar'}
        </button>

        {canSync && (
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            style={{
              padding: '0.4rem 0.9rem',
              backgroundColor: '#4a5568',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: syncMutation.isPending ? 0.7 : 1
            }}
            title="Reconcilia la réplica local contra Keycloak y repara los eventos que nunca llegaron"
          >
            {syncMutation.isPending ? 'Reconciliando...' : '⇄ Reconciliar con Keycloak'}
          </button>
        )}

        {syncMutation.isSuccess && (
          <span style={{ fontSize: '0.85rem', color: '#276749' }}>
            {syncMutation.data.sincronizados} socio(s) sincronizado(s).
          </span>
        )}
        {syncMutation.isError && (
          <span style={{ fontSize: '0.85rem', color: '#c53030' }}>
            Error ({syncMutation.error.problem.status}): {syncMutation.error.problem.detail || syncMutation.error.problem.title}
          </span>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
          Consultando socios...
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '6px',
          color: '#c53030',
          marginBottom: '1rem'
        }}>
          <strong>Error ({error.problem.status}):</strong> {error.problem.detail || error.problem.title}
        </div>
      )}

      {socios && socios.length === 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fffaf0',
          border: '1px solid #fbd38d',
          borderRadius: '8px',
          color: '#744210',
          fontSize: '0.9rem'
        }}>
          Todavía no hay socios registrados. La sincronización es reactiva: sólo llegan los
          usuarios creados a partir de ahora.
          {canSync && <> Usá <strong>Reconciliar con Keycloak</strong> para dar de alta los usuarios preexistentes.</>}
        </div>
      )}

      {socios && socios.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Usuario</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Nombre Completo</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Alta</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Baja</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem', width: '90px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {socios.map((socio) => (
                <tr key={socio.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2d3748' }}>
                    {socio.username || '—'}
                    <div style={{ fontSize: '0.7rem', color: '#a0aec0', fontFamily: 'monospace', fontWeight: 400 }}>
                      {socio.keycloakId}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4a5568' }}>
                    {[socio.nombre, socio.apellido].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#718096', fontSize: '0.9rem' }}>
                    {socio.email || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#718096', fontSize: '0.85rem' }}>
                    {formatDate(socio.fechaAlta)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#718096', fontSize: '0.85rem' }}>
                    {formatDate(socio.fechaBaja)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: socio.activo ? '#c6f6d5' : '#fed7d7',
                      color: socio.activo ? '#22543d' : '#9b2c2c'
                    }}>
                      {socio.activo ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
