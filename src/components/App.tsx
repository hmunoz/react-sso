import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { appRoutes } from '../constants';
import { PermissionGuard } from './auth/PermissionGuard';
import { MoviesView } from './routes/MoviesView';
import { MovieDetailView } from './routes/MovieDetailView';
import { SociosView } from './routes/SociosView';
import { UsersView } from './routes/UsersView';
import { AgentChatView } from './routes/AgentChatView';
import { Playground } from './routes/Playground/Playground';
import { NotFound } from './routes/NotFound';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path={appRoutes.home} element={<Navigate to={appRoutes.movies} replace />} />
      <Route
        path={appRoutes.movies}
        element={
          <PermissionGuard permission="movie-permission-read">
            <MoviesView />
          </PermissionGuard>
        }
      />
      <Route
        path={appRoutes.movieDetail}
        element={
          <PermissionGuard permission="movie-permission-read">
            <MovieDetailView />
          </PermissionGuard>
        }
      />
      <Route
        path={appRoutes.users}
        element={
          <PermissionGuard permission="user-permission-read">
            <UsersView />
          </PermissionGuard>
        }
      />
      <Route
        path={appRoutes.socios}
        element={
          <PermissionGuard permission="socio-permission-read">
            <SociosView />
          </PermissionGuard>
        }
      />
      <Route path={appRoutes.agent} element={<AgentChatView />} />
      <Route path={appRoutes.playground} element={<Playground />} />
      <Route path={appRoutes.notFound} element={<NotFound />} />
    </Routes>
  );
};
