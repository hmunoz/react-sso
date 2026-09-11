# VideoClub Frontend — React 19 con OIDC & Keycloak

Aplicación web de una sola página (Single Page Application - SPA) desarrollada con **React 19**, **TypeScript** y **Vite**, diseñada para demostrar la integración de seguridad moderna con **OAuth 2.0 y OpenID Connect** contra **Keycloak** y un backend **Spring Boot Resource Server**.

---

## 🚀 Características Principales

- **React 19 + TypeScript + Vite**: Construcción ultrarrápida y componentes funcionales modernos.
- **Autenticación OIDC con PKCE**: Implementación del *Authorization Code Flow con PKCE (S256)* mediante `react-oidc-context` y `oidc-client-ts` sin exponer secretos en el cliente.
- **Control de Acceso Basado en Permisos (RBAC de grano fino)**:
  - Hook personalizado `usePermissions()` para inspeccionar roles de realm (`ROLE_ADMIN`, `ROLE_CLIENT`) y roles de cliente (`movie-permission-*`, `user-permission-*`).
  - Componente `PermissionGuard` para proteger rutas completas con mensajes 403 amigables.
  - Barra de navegación adaptativa que oculta o muestra pestañas según las autorizaciones del token.
  - Barra inferior de depuración didáctica con los permisos activos del token en tiempo real.
- **Gestión de Datos Asincrónica con `@tanstack/react-query`**:
  - Catálogo de Películas (`/movies`): listado, creación y eliminación.
  - Módulo de Administración de Usuarios (`/users`): consulta de usuarios y aprovisionamiento directo en Keycloak.
  - Inyección automática del Bearer Token en cada solicitud HTTP.
  - Soporte de errores estándar **RFC 7807 (`ProblemDetail`)** emitidos por Spring Boot (`invalidFields`, 409 Conflict, etc.).

---

## 🛠️ Tecnologías y Dependencias

| Librería | Versión | Propósito |
| --- | --- | --- |
| **react** | `^19.0.0` | Núcleo de la interfaz de usuario |
| **react-dom** | `^19.0.0` | Renderizado web en el DOM |
| **react-oidc-context** | `^3.3.1` | Contexto y hooks de React para autenticación OIDC |
| **oidc-client-ts** | `^3.5.0` | Motor subyacente para gestión de tokens, PKCE y sesión |
| **react-router-dom** | `^6.24.0` | Enrutamiento del lado del cliente y guardas de navegación |
| **@tanstack/react-query** | `^5.52.1` | Caché, mutaciones y sincronización de datos con la API |
| **vite** | `^5.4.1` | Servidor de desarrollo y empaquetador con SWC |

---

## ⚙️ Configuración de Entorno

Crear o revisar el archivo `.env` en la raíz del proyecto:

```env
# URL del Realm en Keycloak
VITE_AUTHORITY=http://localhost:9091/realms/videoclub

# Identificador del Cliente Público en Keycloak
VITE_CLIENT_ID=videoclub-frontend

# URL base del Backend Spring Boot
VITE_API_BASE_URL=http://localhost:8080
```

---

## 📦 Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:5173/`.

3. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 🔐 Perfiles de Usuario para Pruebas

| Usuario | Contraseña | Rol / Permisos | Comportamiento Esperado en la SPA |
| --- | --- | --- | --- |
| **`usuarioadmin`** | `usuarioadmin` | `ROLE_ADMIN`<br/>`movie-permission-*`<br/>`user-permission-*` | Acceso total: visualiza pestañas **Películas** y **Gestión Usuarios**. Puede crear películas y aprovisionar usuarios en Keycloak. |
| **`usuariocliente`** | `usuariocliente` | `ROLE_CLIENT`<br/>`movie-permission-read` | Solo visualiza la pestaña **Películas**. La pestaña **Usuarios** no aparece en el menú; si intenta acceder por URL, la guarda bloquea el acceso con HTTP 403. |
| **Auto-registro (Nuevo)** | A definir | `ROLE_CLIENT`<br/>`movie-permission-read`<br/>*2FA OTP obligatorio* | Al hacer click en "Registrarse" en Keycloak, se asigna automáticamente al grupo `cliente` y se le exige escanear el código QR con Google Authenticator / FreeOTP antes de entrar. |

---

## 📖 Documentación Arquitectónica Completa

Para una explicación detallada de los flujos OAuth 2.0, diagramas de secuencia Mermaid, configuración de Keycloak y la implementación del backend Spring Boot, consultar la guía didáctica en:
👉 [`../springboot-sso/docs/seguridad-oauth2-openid-connect-keycloak.md`](../springboot-sso/docs/seguridad-oauth2-openid-connect-keycloak.md)