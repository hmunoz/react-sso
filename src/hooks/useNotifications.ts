import { useEffect, useState, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function useNotifications() {
  const auth = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
    return 'denied';
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((title: string, message: string, variant: NotificationItem['variant'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNotification: NotificationItem = {
      id,
      title,
      message,
      variant,
      timestamp: Date.now()
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);

    // Trigger native desktop/system notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Could not display native notification:', err);
      }
    }

    // Auto-dismiss in-app toast after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 6000);
  }, []);

  useEffect(() => {
    const token = auth.user?.access_token;
    if (!auth.isAuthenticated || !token) {
      setIsConnected(false);
      return;
    }

    const streamUrl = `${API_BASE_URL}/api/notifications/stream?access_token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('open', () => {
      setIsConnected(true);
    });

    eventSource.addEventListener('CONNECTED', (e: MessageEvent) => {
      setIsConnected(true);
      console.log('SSE Stream Connected:', e.data);
    });

    eventSource.addEventListener('AUTH_EVENT', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const type = payload.type;
        const details = payload.details || {};
        const targetUsername = details.username || payload.userId || 'Usuario';

        switch (type) {
          case 'REGISTER':
            addNotification(
              '👤 Nuevo Usuario Registrado',
              `El usuario "${targetUsername}" (${details.email || ''}) completó su auto-registro.`,
              'info'
            );
            break;
          case 'VERIFY_EMAIL':
            addNotification(
              '✅ Email Verificado',
              `"${targetUsername}" confirmó exitosamente su dirección de correo.`,
              'success'
            );
            break;
          case 'SEND_VERIFY_EMAIL':
            addNotification(
              '📧 Correo Enviado',
              `Se envió el enlace de verificación a ${details.email || targetUsername}.`,
              'info'
            );
            break;
          case 'LOGIN':
            addNotification(
              '🔐 Sesión Iniciada',
              `Inicio de sesión de "${targetUsername}" desde ${payload.ipAddress || 'web'}.`,
              'info'
            );
            break;
          case 'UPDATE_PASSWORD':
            addNotification(
              '🔑 Contraseña Actualizada',
              `El usuario "${targetUsername}" cambió su contraseña de acceso.`,
              'warning'
            );
            break;
          case 'UPDATE_TOTP':
            addNotification(
              '🛡️ Doble Factor (OTP) Activo',
              `"${targetUsername}" vinculó su aplicación de autenticación OTP.`,
              'success'
            );
            break;
          default:
            addNotification(
              `🔔 Evento de Autenticación: ${type}`,
              `Usuario: ${targetUsername}`,
              'info'
            );
        }
      } catch (err) {
        console.error('Error parsing SSE AUTH_EVENT:', err);
      }
    });

    eventSource.addEventListener('ADMIN_EVENT', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const op = payload.operationType;
        const rep = payload.representation || {};
        const username = rep.username || payload.resourcePath || 'usuario';

        if (op === 'CREATE') {
          addNotification(
            '⚙️ Usuario Creado por Admin',
            `Se dio de alta al usuario "${username}" en el sistema.`,
            'info'
          );
        } else if (op === 'DELETE') {
          addNotification(
            '🗑️ Usuario Eliminado',
            `Se dio de baja la cuenta de usuario "${username}".`,
            'warning'
          );
        }
      } catch (err) {
        console.error('Error parsing SSE ADMIN_EVENT:', err);
      }
    });

    eventSource.addEventListener('error', (err) => {
      console.warn('SSE connection error:', err);
      setIsConnected(false);
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [auth.isAuthenticated, auth.user?.access_token, addNotification]);

  return {
    notifications,
    isConnected,
    permission,
    requestPermission,
    removeNotification
  };
}
