/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Categories from './pages/Categories';
import Topics from './pages/Topics';
import LearningLog from './pages/LearningLog';
import TodayRevisions from './pages/TodayRevisions';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/activities" element={<LearningLog />} />
            <Route path="/revisions" element={<TodayRevisions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
