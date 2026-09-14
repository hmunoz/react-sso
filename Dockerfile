# Multi-Stage Build para React (Vite) + Nginx
#
# Tres etapas con responsabilidades distintas:
#  - dev     : solo dependencias de Node (npm ci). A proposito no copia el codigo
#              fuente ni define CMD: el codigo y el comando se inyectan desde
#              docker-compose.yml (bind mount + command: npm run dev).
#  - build   : hereda de dev y compila el bundle estatico con `npm run build`. Con
#              `FROM dev AS build` se reutiliza la capa de dependencias en cache.
#  - runtime : imagen productiva con Nginx unprivileged (Alpine), usuario no-root
#              (UID 101), soporte para SPA routing y HEALTHCHECK activo.

# ---- Etapa dev (docker-compose, hot-reload) ----
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Etapa build ----
# Hereda de dev: la capa de dependencias de node_modules ya descargada se reutiliza.
# En una SPA, las variables VITE_* se resuelven en tiempo de compilacion (build-time).
FROM dev AS build

ARG VITE_API_BASE_URL
ARG VITE_AUTHORITY
ARG VITE_CLIENT_ID

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTHORITY=$VITE_AUTHORITY \
    VITE_CLIENT_ID=$VITE_CLIENT_ID

COPY . .
RUN npm run build

# ---- Etapa runtime (Nginx no-root) ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

LABEL org.opencontainers.image.title="videoclub-frontend" \
      org.opencontainers.image.description="VideoClub Frontend SPA con React 19 y Nginx" \
      org.opencontainers.image.authors="VideoClub UNRN"

# Plantilla de configuracion Nginx con soporte para History API (SPA) y ${PORT} dinamico.
# El script oficial /docker-entrypoint.d/20-envsubst-on-templates.sh de Nginx
# expande las variables en /etc/nginx/conf.d/default.conf al arrancar.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copiamos unicamente los artefactos estaticos compilados (HTML/JS/CSS)
COPY --from=build /app/dist /usr/share/nginx/html

# Puerto por defecto (8080 para usuario unprivileged sin permisos root).
# Compose puede pisarlo en runtime via environment: PORT.
ENV PORT=8080
EXPOSE ${PORT}

# HEALTHCHECK en forma shell: valida que Nginx este sirviendo peticiones HTTP.
# A diferencia de Java/Spring, Nginx arranca en milisegundos (start-period corto).
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
    CMD curl -f http://localhost:${PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
