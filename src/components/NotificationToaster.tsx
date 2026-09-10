import React from 'react';
import type { NotificationItem } from '../hooks/useNotifications';

interface NotificationToasterProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  isConnected: boolean;
}

export const NotificationToaster: React.FC<NotificationToasterProps> = ({
  notifications,
  onDismiss,
  isConnected
}) => {
  if (notifications.length === 0 && !isConnected) {
    return null;
  }

  const getBorderColor = (variant: NotificationItem['variant']) => {
    switch (variant) {
      case 'success':
        return '#38a169';
      case 'warning':
        return '#dd6b20';
      case 'error':
        return '#e53e3e';
      default:
        return '#3182ce';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {notifications.map((item) => (
        <div
          key={item.id}
          style={{
            pointerEvents: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderLeft: `5px solid ${getBorderColor(item.variant)}`,
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'slideIn 0.25s ease-out'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a202c', marginBottom: '0.25rem' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#4a5568', lineHeight: 1.4 }}>
              {item.message}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '0.35rem' }}>
              hace instantes
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a0aec0',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0.2rem'
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
