import { apiRequest } from './client';

export interface Movie {
  id: number;
  title: string;
}

export const moviesApi = {
  getAll: (token?: string) => {
    return apiRequest<Movie[]>('/movies', { method: 'GET' }, token);
  },

  create: (title: string, token?: string) => {
    return apiRequest<number>(
      '/movies',
      {
        method: 'POST',
        body: JSON.stringify({ title })
      },
      token
    );
  },

  delete: (id: number, token?: string) => {
    return apiRequest<void>(`/movies/${id}`, { method: 'DELETE' }, token);
  }
};
