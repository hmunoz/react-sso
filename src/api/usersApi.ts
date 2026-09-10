import { apiRequest } from './client';

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  group?: string;
}

export const usersApi = {
  getAll: (token?: string) => {
    return apiRequest<KeycloakUser[]>('/api/users', { method: 'GET' }, token);
  },

  create: (data: UserCreatePayload, token?: string) => {
    return apiRequest<{ id: string; username: string }>(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      token
    );
  }
};
