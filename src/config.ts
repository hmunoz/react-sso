import { QueryClient } from '@tanstack/react-query';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const userManager = new UserManager({
  authority: import.meta.env.VITE_AUTHORITY || 'http://localhost:9091/realms/videoclub',
  client_id: import.meta.env.VITE_CLIENT_ID || 'videoclub-frontend',
  redirect_uri: window.location.origin + '/',
  post_logout_redirect_uri: window.location.origin + '/',
  response_type: 'code',
  scope: 'openid profile email videoclub',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  monitorSession: true,
  automaticSilentRenew: true
});

export const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
