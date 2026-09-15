import { apiRequest } from './client';

export type Genre =
  | 'ACTION'
  | 'COMEDY'
  | 'DRAMA'
  | 'HORROR'
  | 'SCIENCE_FICTION'
  | 'ROMANCE'
  | 'THRILLER'
  | 'ANIMATION'
  | 'DOCUMENTARY'
  | 'FANTASY';

export const GENRE_LABELS: Record<Genre, string> = {
  ACTION: 'Acción',
  COMEDY: 'Comedia',
  DRAMA: 'Drama',
  HORROR: 'Terror',
  SCIENCE_FICTION: 'Ciencia Ficción',
  ROMANCE: 'Romance',
  THRILLER: 'Thriller',
  ANIMATION: 'Animación',
  DOCUMENTARY: 'Documental',
  FANTASY: 'Fantasía',
};

export interface Movie {
  id: number;
  title: string;
  genre?: Genre;
  price?: number;
  imageUrl?: string;
}

export interface CreateMovieInput {
  title: string;
  genre?: Genre;
  price?: number;
  imageUrl?: string;
}

export const moviesApi = {
  getAll: (token?: string) => {
    return apiRequest<Movie[]>('/movies', { method: 'GET' }, token);
  },

  getById: (id: number, token?: string) => {
    return apiRequest<Movie>(`/movies/${id}`, { method: 'GET' }, token);
  },

  create: (input: CreateMovieInput, token?: string) => {
    return apiRequest<number>(
      '/movies',
      {
        method: 'POST',
        body: JSON.stringify(input)
      },
      token
    );
  },

  update: (id: number, input: CreateMovieInput, token?: string) => {
    return apiRequest<number>(
      `/movies/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input)
      },
      token
    );
  },

  delete: (id: number, token?: string) => {
    return apiRequest<void>(`/movies/${id}`, { method: 'DELETE' }, token);
  }
};
