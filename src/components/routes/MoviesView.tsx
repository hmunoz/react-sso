import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, type Movie } from '../../api/moviesApi';
import { usePermissions } from '../../hooks/usePermissions';
import { ApiError } from '../../api/client';

export const MoviesView: React.FC = () => {
  const { accessToken, hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = hasPermission('movie-permission-create');
  const canDelete = hasPermission('movie-permission-delete');

  const { data: movies, isLoading, error } = useQuery<Movie[], ApiError>({
    queryKey: ['movies'],
    queryFn: () => moviesApi.getAll(accessToken),
    enabled: !!accessToken
  });

  const createMutation = useMutation({
    mutationFn: (movieTitle: string) => moviesApi.create(movieTitle, accessToken),
    onSuccess: () => {
      setTitle('');
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
    onError: (err: ApiError) => {
      if (err.problem.invalidFields) {
        const details = Object.entries(err.problem.invalidFields)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        setFormError(details);
      } else {
        setFormError(err.problem.detail || err.problem.title || 'Error al crear película');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => moviesApi.delete(id, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movies'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('El título no puede estar vacío');
      return;
    }
    createMutation.mutate(title);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', color: '#1a202c' }}>Catálogo de Películas</h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
            Recurso protegido por <code>movie-permission-read</code>
          </p>
        </div>
      </div>

      {canCreate && (
        <div style={{
          backgroundColor: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#2d3748' }}>
            Nueva Película (requiere <code>movie-permission-create</code>)
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Título de la película (ej: Matrix, El Padrino...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '0.95rem'
                }}
              />
              {formError && (
                <div style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                  {formError}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: createMutation.isPending ? 0.7 : 1
              }}
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear Película'}
            </button>
          </form>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
          Cargando películas...
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

      {movies && (
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
                <th style={{ padding: '0.75rem 1rem', width: '80px', color: '#4a5568', fontSize: '0.85rem' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a5568', fontSize: '0.85rem' }}>Título</th>
                {canDelete && (
                  <th style={{ padding: '0.75rem 1rem', width: '120px', textAlign: 'right', color: '#4a5568', fontSize: '0.85rem' }}>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 3 : 2} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                    No hay películas registradas en el videoclub.
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr key={movie.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#718096', fontSize: '0.9rem' }}>#{movie.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#2d3748' }}>{movie.title}</td>
                    {canDelete && (
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => deleteMutation.mutate(movie.id)}
                          disabled={deleteMutation.isPending}
                          style={{
                            padding: '0.25rem 0.6rem',
                            backgroundColor: '#fff5f5',
                            color: '#e53e3e',
                            border: '1px solid #fed7d7',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
