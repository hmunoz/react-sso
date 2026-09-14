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

El proyecto se configura mediante archivos `.env` (desarrollo) y `.env.prod` (producción):

```env
APP_VERSION=1.0.0
STAGE=dev
PORT=5173

# URL del Realm en Keycloak (alcanzable por el navegador)
VITE_AUTHORITY=http://localhost:9091/realms/videoclub

# Identificador del Cliente Público en Keycloak
VITE_CLIENT_ID=videoclub-frontend

# API Gateway (Spring Cloud Gateway - punto de entrada unico del backend)
VITE_API_BASE_URL=http://localhost:9500

# Backend directo (opcional para pruebas sin Gateway)
# VITE_API_BASE_URL=http://localhost:8080
```

### 📋 Detalle de Variables

| Variable | Propósito | Ejemplo Dev | Ejemplo Prod |
| --- | --- | --- | --- |
| `VITE_AUTHORITY` | URL del Realm OIDC en Keycloak. El navegador la utiliza para redirigir al login y validar el discovery (`/.well-known/openid-configuration`). | `http://localhost:9091/realms/videoclub` | `https://auth.midominio.com/realms/videoclub` |
| `VITE_CLIENT_ID` | Identificador del cliente público OIDC configurado en Keycloak con PKCE. | `videoclub-frontend` | `videoclub-frontend` |
| `VITE_API_BASE_URL` | URL base para las peticiones HTTP del frontend. Apunta al **Spring Cloud Gateway** (`:9500`), el cual rutea `/api/movies/**`, `/api/users/**`, `/api/socios/**` y `/api/agent/**`. | `http://localhost:9500` | `https://api.midominio.com` |
| `PORT` | Puerto donde escucha el contenedor o servidor web. | `5173` (Vite) | `8080` (Nginx) |
| `STAGE` | Identificador del entorno de ejecución. | `dev` | `prod` |
| `APP_VERSION` | Etiqueta semántica utilizada para auto-taggear la imagen Docker final en producción (`videoclub-frontend:${APP_VERSION}`). | `1.0.0` | `1.0.0` |

---

## 🧠 Arquitectura de Red: ¿Por qué las URLs de una SPA NO son internas de Docker?

> [!IMPORTANT]
> **CONCEPTO FUNDAMENTAL: ¿Dónde se ejecuta realmente el código de una SPA?**
>
> En un backend (como Spring Boot), el código corre **dentro** del contenedor Docker. Por eso Spring Boot puede comunicarse con PostgreSQL o Keycloak usando nombres de servicio de Docker (`http://postgres_db:5432` o `http://video-keycloak:9091`) a través del DNS interno de Docker.
>
> En una **Single Page Application (React)** ocurre algo totalmente distinto:
>
> 1. El contenedor Docker (sea Vite en dev o Nginx en producción) es **únicamente un servidor de archivos estáticos** (HTML, JS, CSS).
> 2. El navegador web del usuario descarga esos archivos y **ejecuta el código JavaScript en la máquina del cliente (host), FUERA de la red interna de Docker**.
> 3. Cuando `react-oidc-context` o `fetch()` hacen una petición, la consulta sale del **navegador del usuario**, resolviendo DNS con la red del host, **no con la red de Docker**.
>
> Si configuraras `VITE_AUTHORITY=http://video-keycloak:9091` o `VITE_API_BASE_URL=http://videoclub-gateway-1:9500`, el navegador del usuario intentará resolver esos nombres en el DNS del host y fallará con `ERR_NAME_NOT_RESOLVED`.
>
> **Regla de Oro:** Todas las variables `VITE_*` deben apuntar a URLs **públicamente accesibles por el navegador del usuario** (en desarrollo local: `http://localhost:PUERTO_PUBLICADO`).

---

## 📦 Ejecución del Proyecto

### Opción A: Con Docker Compose (Recomendado — Clase 6)

El proyecto cuenta con un esquema multi-stage aislado para desarrollo y producción:

#### 1. Entorno de Desarrollo (con Hot-Reload y Vite HMR)

```bash
# Construye la etapa 'dev' con Node 22, monta el codigo en vivo y levanta Vite en el puerto 5173
docker compose up --build
```

Acceder en [http://localhost:5173](http://localhost:5173). Cualquier cambio en `src/` se reflejará instantáneamente sin reconstruir la imagen.

#### 2. Entorno de Producción (Sellado con Nginx Alpine unprivileged)

```bash
# Construye la etapa 'runtime' con Nginx (74 MB), inyecta variables de build y levanta en el puerto 8080
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Acceder en [http://localhost:8080](http://localhost:8080). Incluye `try_files` en Nginx para soportar refresco en rutas de React Router y `HEALTHCHECK` activo.

#### 3. Verificar estado de los contenedores

```bash
# Ver estado y healthcheck en produccion
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

#### 4. Detener los servicios

```bash
docker compose down                                                        # Detiene dev
docker compose --env-file .env.prod -f docker-compose.prod.yml down        # Detiene prod
```

### Opción B: Ejecución Local Directa con Node.js

Si preferís correr Node directamente en el host:

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:

   ```bash
   npm run dev
   ```

   La aplicación se abrirá en `http://localhost:5173/`.

3. **Compilar para producción manualmente**:

   ```bash
   npm run build
   ```

---

## 🔐 Perfiles de Usuario para Pruebas

| Usuario | Contraseña | Rol / Permisos | Comportamiento Esperado en la SPA |
| --- | --- | --- | --- |
| **`usuarioadmin`** | `usuarioadmin` | `ROLE_ADMIN`<br/>`movie-permission-*`<br/>`user-permission-*` | Acceso total: visualiza pestañas **Películas** y **Gestión Usuarios**. Puede crear películas y aprovisionar usuarios en Keycloak. |
| **`usuariocliente`** | `usuariocliente` | `ROLE_CLIENT`<br/>`movie-permission-read` | Solo visualiza la pestaña **Películas**. La pestaña **Usuarios** no aparece en el menú; si intenta acceder por URL, la guarda bloquea el acceso con HTTP 403. |
| **`Auto-registro (Nuevo)`** | A definir | `ROLE_CLIENT`<br/>`movie-permission-read`<br/>*2FA OTP obligatorio* | Al hacer click en "Registrarse" en Keycloak, se asigna automáticamente al grupo `cliente` y se le exige escanear el código QR con Google Authenticator / FreeOTP antes de entrar. |

---

## 📖 Documentación Arquitectónica Completa

Para una explicación detallada de los flujos OAuth 2.0, diagramas de secuencia Mermaid, configuración de Keycloak y la implementación del backend Spring Boot, consultar la guía didáctica en:
👉 [`../springboot-sso/docs/seguridad-oauth2-openid-connect-keycloak.md`](../springboot-sso/docs/seguridad-oauth2-openid-connect-keycloak.md)