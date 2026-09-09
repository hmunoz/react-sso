import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';

export interface TokenPayload {
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  groups?: string[];
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };
}

function parseJwt(token?: string): TokenPayload | null {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function usePermissions() {
  const auth = useAuth();

  const tokenData = useMemo(() => {
    return parseJwt(auth.user?.access_token) || (auth.user?.profile as TokenPayload) || null;
  }, [auth.user?.access_token, auth.user?.profile]);

  const clientRoles = useMemo(() => {
    const clientId = import.meta.env.VITE_CLIENT_ID || 'videoclub-frontend';
    return tokenData?.resource_access?.[clientId]?.roles || [];
  }, [tokenData]);

  const groups = useMemo(() => {
    return tokenData?.groups || [];
  }, [tokenData]);

  /** Authorization: what the user is allowed to do. Always decide access with this. */
  const hasPermission = (permission: string) => {
    return clientRoles.includes(permission);
  };

  /** Identity: which part of the organization the user belongs to. Never use it to grant access. */
  const hasGroup = (group: string) => {
    return groups.includes(group);
  };

  const username = tokenData?.preferred_username || auth.user?.profile?.preferred_username || 'Usuario';
  const fullName = tokenData?.name || auth.user?.profile?.name || username;
  const email = tokenData?.email || auth.user?.profile?.email || '';
  const isAdmin = hasGroup('administrador');

  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    accessToken: auth.user?.access_token,
    username,
    fullName,
    email,
    clientRoles,
    groups,
    hasPermission,
    hasGroup,
    isAdmin
  };
}
