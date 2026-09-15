import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moviesApi, GENRE_LABELS, type Movie } from '../../api/moviesApi';
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

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x600/1a202c/718096?text=Sin+Imagen';

export const MovieDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = usePermissions();

  const movieId = Number(id);

  const { data: movie, isLoading, error } = useQuery<Movie, ApiError>({
    queryKey: ['movie', movieId],
    queryFn: () => moviesApi.getById(movieId, accessToken),
    enabled: !!accessToken && !isNaN(movieId),
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center', color: '#718096' }}>
        Cargando detalle de la película...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <button onClick={() => navigate('/movies')} style={backButtonStyle}>
          ← Volver al catálogo
        </button>
        <div style={errorBoxStyle}>
          <strong>Error ({error.problem.status}):</strong> {error.problem.detail || error.problem.title}
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const genreColor = movie.genre ? (GENRE_COLORS[movie.genre] ?? { bg: '#e2e8f0', text: '#4a5568' }) : null;
  const genreLabel = movie.genre ? (GENRE_LABELS[movie.genre] ?? movie.genre) : null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Back button */}
      <button onClick={() => navigate('/movies')} style={backButtonStyle}>
        ← Volver al catálogo
      </button>

      {/* Card */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginTop: '1.25rem',
      }}>
        {/* Poster */}
        <div style={{ flexShrink: 0, width: '220px', minHeight: '330px', backgroundColor: '#1a202c' }}>
          <img
            src={movie.imageUrl || PLACEHOLDER_IMAGE}
            alt={`Portada de ${movie.title}`}
            style={{ width: '220px', height: '330px', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '2rem 2rem 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* ID badge */}
          <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontFamily: 'monospace' }}>
            #{movie.id}
          </span>

          {/* Title */}
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1a202c', lineHeight: 1.2 }}>
            {movie.title}
          </h1>

          {/* Genre badge */}
          {genreLabel && genreColor && (
            <div>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: genreColor.bg,
                color: genreColor.text,
              }}>
                {genreLabel}
              </span>
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#718096' }}>Precio de alquiler:</span>
            {movie.price != null ? (
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748' }}>
                ${movie.price.toFixed(2)}
              </span>
            ) : (
              <span style={{ fontSize: '0.9rem', color: '#a0aec0', fontStyle: 'italic' }}>
                No especificado
              </span>
            )}
          </div>

          {/* Image URL (info only) */}
          {movie.imageUrl && (
            <div style={{ marginTop: 'auto' }}>
              <a
                href={movie.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8rem', color: '#3182ce', textDecoration: 'none' }}
              >
                Ver imagen en tamaño completo ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const backButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 1rem',
  backgroundColor: 'transparent',
  border: '1px solid #cbd5e0',
  borderRadius: '6px',
  color: '#4a5568',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontWeight: 500,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#fff5f5',
  border: '1px solid #feb2b2',
  borderRadius: '6px',
  color: '#c53030',
};
