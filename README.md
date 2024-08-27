
# react oidc

## proyecto Base de inspiración
https://github.com/authts/sample-keycloak-react-oidc-context/tree/main/react

## oidc-client-js Documentation
https://www.npmjs.com/package/react-oidc-context#documentation

## herramientas

### nvm (node version manager)
https://monovm.com/blog/install-nvm-on-ubuntu/

### vite
https://vitejs.dev/guide/

### Comandos

#### Crear proyecto
```bash
npm create vite@latest videoclub -- --template react-swc-ts
```

#### Instalar oidc
```bash
npm install oidc-client-ts react-oidc-context --save
```

# Dependencias del Proyecto ReactJS

Este proyecto utiliza varias librerías para mejorar la funcionalidad y la eficiencia de la aplicación. A continuación se detalla la finalidad de cada una:

## Librerías de Estilos

- **@emotion/react** (`^11.13.0`):  
  Permite aplicar estilos CSS en la aplicación React utilizando JavaScript. Ofrece un enfoque flexible para escribir y gestionar estilos directamente en los componentes de React.

- **@emotion/styled** (`^11.13.0`):  
  Complementa a `@emotion/react`, permitiendo crear componentes con estilos personalizados utilizando una sintaxis similar a `styled-components`.

## Manejo de Estado y Datos

- **@tanstack/react-query** (`^5.52.1`):  
  Librería para manejar datos asincrónicos, como solicitudes a APIs. Facilita el fetching, caching, sincronización y actualización de datos en aplicaciones React sin necesidad de Redux o Context API.

## Tipos y Tipado

- **@types/node** (`^22.5.0`):  
  Proporciona definiciones de tipo para Node.js, necesarias para compatibilidad con Node.js en proyectos TypeScript.

## Autenticación y Seguridad

- **oidc-client-ts** (`^3.0.1`):  
  Maneja la autenticación OpenID Connect (OIDC) y OAuth 2.0 en aplicaciones cliente, gestionando tokens de acceso e identidad de manera eficiente.

- **react-oidc-context** (`^3.1.0`):  
  Proporciona un contexto React para gestionar la autenticación OIDC, simplificando la integración de OIDC en la aplicación React.

## React Core

- **react** (`^18.3.1`):  
  Librería principal utilizada para construir interfaces de usuario en React.

- **react-dom** (`^18.3.1`):  
  Se encarga de la manipulación del DOM en navegadores, permitiendo renderizar componentes de React en la web.

## Enrutamiento

- **react-router-dom** (`^6.24.0`):  
  Librería para manejar el enrutamiento en aplicaciones React. Permite definir rutas, navegación y redirecciones en aplicaciones de una sola página (SPA).

## Inmutabilidad

- **scule** (`^1.3.0`):  
  Librería ligera para trabajar con estructuras de datos inmutables en JavaScript. Facilita la gestión de estados inmutables en aplicaciones React, asegurando un estado predecible y no mutado.


# TODO

## Client Scope

https://www.youtube.com/watch?v=5B8tqWFyZWQ

https://medium.com/@andreyka26_/how-to-implement-react-client-for-oauth-server-openiddict-8f8dea6ed9c2
