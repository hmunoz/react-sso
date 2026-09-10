import { apiRequest } from './client';

export interface Socio {
  id: number;
  keycloakId: string;
  email?: string;
  username?: string;
  nombre?: string;
  apellido?: string;
  activo: boolean;
  fechaAlta: string;
  fechaBaja?: string | null;
}

export interface SyncResult {
  sincronizados: number;
}

export const sociosApi = {
  getAll: (token?: string) => {
    return apiRequest<Socio[]>('/api/socios', { method: 'GET' }, token);
  },

  getById: (id: number, token?: string) => {
    return apiRequest<Socio>(`/api/socios/${id}`, { method: 'GET' }, token);
  },

  sync: (token?: string) => {
    return apiRequest<SyncResult>('/api/socios/sync', { method: 'POST' }, token);
  }
};
