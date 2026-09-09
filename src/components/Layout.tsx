import React, { type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { appRoutes } from '../constants';
import { usePermissions } from '../hooks/usePermissions';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { username, clientRoles, groups, hasPermission } = usePermissions();

  const canViewMovies = hasPermission('movie-permission-read');
  const canViewUsers = hasPermission('user-permission-read');

  const navItems = [
    {
      label: '🎬 Películas',
      path: appRoutes.movies,
      visible: canViewMovies
    },
    {
      label: '👥 Gestión Usuarios',
      path: appRoutes.users,
      visible: canViewUsers
    }
  ].filter((item) => item.visible);

  const handleLogout = () => {
    void auth.signoutRedirect();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{
        backgroundColor: '#1a202c',
        color: 'white',
        borderBottom: '1px solid #2d3748',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate(appRoutes.movies)}>
            <span style={{ fontSize: '1.4rem' }}>📼</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>VideoClub SSO</span>
          </div>

          {/* Nav Tabs */}
          {auth.isAuthenticated && (
            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: isActive ? '#3182ce' : 'transparent',
                      color: isActive ? 'white' : '#cbd5e0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {auth.isAuthenticated ? (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#edf2f7' }}>
                    {username}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.15rem' }}>
                    {groups.map((group) => (
                      <span
                        key={group}
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: group === 'administrador' ? '#c53030' : '#2b6cb0',
                          color: 'white',
                          fontWeight: 700
                        }}
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#4a5568',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                  title="Cerrar sesión en Keycloak"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={() => void auth.signinRedirect()}
                style={{
                  padding: '0.4rem 0.9rem',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        {/* Permissions sub-bar for debugging / educational transparency.
            The chips above show group membership (identity); these show the
            fine-grained permissions that actually decide access. */}
        {auth.isAuthenticated && (
          <div style={{
            backgroundColor: '#2d3748',
            padding: '0.35rem 1.25rem',
            fontSize: '0.75rem',
            color: '#a0aec0',
            borderTop: '1px solid #4a5568'
          }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Permisos activos (videoclub-frontend):</span>
              {clientRoles.length > 0 ? (
                clientRoles.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      backgroundColor: '#1a202c',
                      color: '#63b3ed',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span style={{ fontStyle: 'italic' }}>Sin permisos de cliente asignados</span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {children}
      </main>
    </div>
  );
};
