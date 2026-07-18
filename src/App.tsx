/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Categories from './pages/Categories';
import Topics from './pages/Topics';
import LearningLog from './pages/LearningLog';
import TodayRevisions from './pages/TodayRevisions';
import RevisionSession from './pages/RevisionSession';
import Sessions from './pages/Sessions';
import AuthPage from './pages/AuthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute><AuthPage /></GuestRoute>} path="/login" />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/activities" element={<LearningLog />} />
            <Route path="/revisions" element={<TodayRevisions />} />
            <Route path="/revisions/session" element={<RevisionSession />} />
            <Route path="/sessions/:sessionId" element={<Sessions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
