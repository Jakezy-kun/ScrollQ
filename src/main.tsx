import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from '@/app/router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorScreen } from '@/features/error/ErrorScreen';
import '@/styles/index.css';

if (import.meta.env.DEV) {
  // Dev-only debugging handle: window.__scrollq.round.getState() / .setState(...)
  void import('@/hooks/useRound').then(({ useRound }) => {
    (window as unknown as { __scrollq: unknown }).__scrollq = { round: useRound };
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('#root element missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorScreen />}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
