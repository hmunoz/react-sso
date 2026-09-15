import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, GENRE_LABELS, type Movie, type Genre, type CreateMovieInput } from '../../api/moviesApi';
import { usePermissions } from '../../hooks/usePermissions';
import { ApiError } from '../../api/client';

const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  ACTION:          { bg: '#fff3cd', text: '#856404' },
  COMEDY:          { bg: '#d1ecf1', text: '#0c5460' },
  DRAMA:           { bg: '#e8d5f5', text: '#6f2fa0' },
  HORROR:          { bg: '#f8d7da', text: '#721c24' },
  SCIENCE_FICTION: { bg: '#cce5ff', text: '#004085' },
  ROMANCE:         { bg: '#fce4ec', text: '#880e4f' },
  THRILLER:        { bg: '#d4edda', text: '#155724' },
  ANIMATION:       { bg: '#fff3e0', text: '#e65100' },
  DOCUMENTARY:     { bg: '#e0e0e0', text: '#212121' },
  FANTASY:         { bg: '#e1d5f5', text: '#4527a0' },
};

const GENRE_OPTIONS = Object.entries(GENRE_LABELS) as [Genre, string][];

const PLACEHOLDER_IMAGE = 'https://placehold.co/60x90/1a202c/718096?text=?';

export const MoviesView: React.FC = () => {
  const { accessToken, hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle]       = useState('');
  const [genre, setGenre]       = useState<Genre | ''>('');
  const [price, setPrice]       = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = hasPermission('movie-permission-create');
  const canDelete = hasPermission('movie-permission-delete');

  const { data: movies, isLoading, error } = useQuery<Movie[], ApiError>({
    queryKey: ['movies'],
    queryFn: () => moviesApi.getAll(accessToken),
    enabled: !!accessToken
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateMovieInput) => moviesApi.create(input, accessToken),
    onSuccess: () => {
      setTitle('');
      setGenre('');
      setPrice('');
      setImageUrl('');
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
    const input: CreateMovieInput = {
      title: title.trim(),
      genre: genre || undefined,
      price: price ? parseFloat(price) : undefined,
      imageUrl: imageUrl.trim() || undefined,
    };
    createMutation.mutate(input);
  };

  const colCount = canDelete ? 6 : 5;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' }}>
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
            Nueva Película{' '}
            <span style={{ fontWeight: 400, color: '#718096', fontSize: '0.85rem' }}>
              (requiere <code>movie-permission-create</code>)
            </span>
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Título *</label>
                <input
                  type="text"
                  placeholder="Ej: Matrix, El Padrino..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              {/* Genre */}
              <div>
                <label style={labelStyle}>Género</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Genre | '')}
                  style={inputStyle}
                >
                  <option value="">— Sin género —</option>
                  {GENRE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Price */}
              <div>
                <label style={labelStyle}>Precio de alquiler ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 150.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={inputStyle}
                />
              </div>
              {/* Image URL */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>URL de imagen de portada</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {formError && (
              <div style={{ color: '#e53e3e', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: '0.5rem 1.5rem',
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
                <th style={thStyle}></th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Género</th>
                <th style={thStyle}>Precio</th>
                {canDelete && <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td colSpan={colCount} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                    No hay películas registradas en el videoclub.
                  </td>
                </tr>
              ) : (
                movies.map((movie) => {
                  const gc = movie.genre ? (GENRE_COLORS[movie.genre] ?? { bg: '#e2e8f0', text: '#4a5568' }) : null;
                  const gl = movie.genre ? (GENRE_LABELS[movie.genre] ?? movie.genre) : null;
                  return (
                    <tr key={movie.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      {/* Thumbnail */}
                      <td style={{ padding: '0.5rem 0.75rem', width: '56px' }}>
                        <img
                          src={movie.imageUrl || PLACEHOLDER_IMAGE}
                          alt={movie.title}
                          style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                        />
                      </td>
                      {/* ID */}
                      <td style={{ padding: '0.75rem', color: '#718096', fontSize: '0.9rem', width: '70px' }}>
                        #{movie.id}
                      </td>
                      {/* Title — clickable */}
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => navigate(`/movies/${movie.id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#2b6cb0',
                            fontSize: '0.95rem',
                            textDecoration: 'underline',
                            textAlign: 'left',
                          }}
                        >
                          {movie.title}
                        </button>
                      </td>
                      {/* Genre badge */}
                      <td style={{ padding: '0.75rem' }}>
                        {gc && gl ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            backgroundColor: gc.bg,
                            color: gc.text,
                          }}>
                            {gl}
                          </span>
                        ) : (
                          <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      {/* Price */}
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: '#2d3748' }}>
                        {movie.price != null
                          ? `$${movie.price.toFixed(2)}`
                          : <span style={{ color: '#a0aec0' }}>—</span>}
                      </td>
                      {/* Actions */}
                      {canDelete && (
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.3rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e0',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: '#4a5568',
  fontSize: '0.85rem',
  fontWeight: 600,
};
