import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type KeycloakUser, type UserCreatePayload } from '../../api/usersApi';
import { usePermissions } from '../../hooks/usePermissions';
import { ApiError } from '../../api/client';

export const UsersView: React.FC = () => {
  const { accessToken, hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canCreateUser = hasPermission('user-permission-create');

  const [formData, setFormData] = useState<UserCreatePayload>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    group: '/videoclub-default/cliente'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: users, isLoading, error } = useQuery<KeycloakUser[], ApiError>({
    queryKey: ['keycloak-users'],
    queryFn: () => usersApi.getAll(accessToken),
    enabled: !!accessToken
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => usersApi.create(payload, accessToken),
    onSuccess: (res) => {
      setFormSuccess(`¡Usuario "${res.username}" aprovisionado con éxito en Keycloak!`);
      setFormError(null);
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        group: '/videoclub-default/cliente'
      });
      void queryClient.invalidateQueries({ queryKey: ['keycloak-users'] });
    },
    onError: (err: ApiError) => {
      setFormSuccess(null);
      if (err.problem.invalidFields) {
        const details = Object.entries(err.problem.invalidFields)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(' | ');
        setFormError(details);
      } else {
        setFormError(err.problem.detail || err.problem.title || 'Error al crear usuario en Keycloak');
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!formData.username || !formData.email || !formData.password) {
      setFormError('Usuario, email y contraseña son obligatorios.');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0', color: '#1a202c' }}>Administración de Usuarios (IAM)</h2>
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
          Gestión de identidades sincronizadas con Keycloak vía Declarative HTTP Interfaces (Spring Boot 4).
          Requiere <code>user-permission-read</code>.
        </p>
      </div>

      {canCreateUser && (
        <div style={{
          backgroundColor: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#2d3748' }}>
            Aprovisionar Nuevo Usuario en Keycloak (requiere <code>user-permission-create</code>)
          </h3>

          {formSuccess && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '6px',
              color: '#276749',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {formSuccess}
            </div>
          )}

          {formError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: '6px',
              color: '#c53030',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <strong>Error ({createMutation.error?.problem?.status || 400}):</strong> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>Usuario *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ej: juanperez"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ej: juan@unrn.edu.ar"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>Nombre</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Juan"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>Apellido</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Perez"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', marginBottom: '0.25rem' }}>Contraseña *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#2b6cb0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: createMutation.isPending ? 0.7 : 1
              }}
            >
              {createMutation.isPending ? 'Creando en Keycloak...' : 'Registrar Usuario'}
            </button>
          </form>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
          Consultando usuarios en Keycloak...
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

      {users && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Usuario</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Nombre Completo</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem', width: '90px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#2d3748' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4a5568' }}>
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#718096', fontSize: '0.9rem' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: u.enabled ? '#c6f6d5' : '#fed7d7',
                      color: u.enabled ? '#22543d' : '#9b2c2c'
                    }}>
                      {u.enabled ? 'Activo' : 'Inactivo'}
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
