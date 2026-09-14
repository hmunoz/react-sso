import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRE_LABELS, type Movie, type Genre } from '../../api/moviesApi';
import { appRoutes } from '../../constants';

export const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
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

const DEFAULT_POSTER = 'https://placehold.co/300x450/1a202c/cbd5e0?text=Sin+P%C3%B3ster';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState<string>(movie.imageUrl || DEFAULT_POSTER);
  const [isHovered, setIsHovered] = useState(false);

  const genreColor = movie.genre ? GENRE_COLORS[movie.genre] : undefined;
  const genreLabel = movie.genre ? (GENRE_LABELS[movie.genre as Genre] || movie.genre) : null;

  const handleDetailClick = () => {
    navigate(appRoutes.movieDetail.replace(':id', String(movie.id)));
  };

  const formattedPrice = movie.price !== undefined && movie.price !== null
    ? (typeof movie.price === 'number' ? `$${movie.price.toFixed(2)}` : `$${movie.price}`)
    : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '210px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: isHovered
          ? '0 8px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)'
          : '0 2px 5px rgba(0,0,0,0.05)',
        transform: isHovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Poster Image */}
      <div style={{ position: 'relative', width: '100%', height: '145px', backgroundColor: '#1a202c', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={movie.title}
          onError={() => setImgSrc(DEFAULT_POSTER)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {genreLabel && genreColor && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: genreColor.bg,
              color: genreColor.text,
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            {genreLabel}
          </span>
        )}
        <span
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(26, 32, 44, 0.85)',
            color: '#edf2f7',
            fontSize: '0.65rem',
            padding: '0.1rem 0.35rem',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          #{movie.id}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4
          title={movie.title}
          style={{
            margin: '0 0 0.4rem 0',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#2d3748',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {movie.title}
        </h4>

        {formattedPrice && (
          <div style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#718096' }}>Alquiler: </span>
            <strong style={{ color: '#2b6cb0', fontSize: '0.88rem' }}>{formattedPrice}</strong>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleDetailClick}
            style={{
              width: '100%',
              padding: '0.35rem 0.6rem',
              backgroundColor: isHovered ? '#2b6cb0' : '#3182ce',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'background-color 0.2s',
            }}
          >
            <span>Ver ficha</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
