import React from 'react';
import { type Movie } from '../../api/moviesApi';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
}

export const MovieGrid: React.FC<MovieGridProps> = ({ movies }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '0.85rem',
        marginBottom: '0.35rem',
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          paddingBottom: '0.35rem',
          borderBottom: '1px solid #edf2f7',
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          🎬 <span>Películas encontradas</span>
        </span>
        <span
          style={{
            backgroundColor: '#edf2f7',
            color: '#4a5568',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.1rem 0.45rem',
            borderRadius: '12px',
          }}
        >
          {movies.length} {movies.length === 1 ? 'película' : 'películas'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.85rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          paddingTop: '0.2rem',
          scrollbarWidth: 'thin',
        }}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};
