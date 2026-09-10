import React, { type ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback,
  children
}) => {
  const { hasPermission } = usePermissions();

  const permissionGranted = permission ? hasPermission(permission) : true;

  if (!permissionGranted) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{
        padding: '2rem',
        marginTop: '1.5rem',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
        border: '1px solid #feb2b2',
        color: '#9b2c2c'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600 }}>
          Acceso Restringido (HTTP 403 Forbidden)
        </h3>
        <p style={{ margin: 0, color: '#4a5568', fontSize: '0.95rem' }}>
          No contás con las autorizaciones necesarias para visualizar este módulo.
          {permission && (
            <> Se requiere el permiso: <code style={{ backgroundColor: '#fed7d7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{permission}</code>.</>
          )}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
