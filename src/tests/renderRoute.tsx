import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ToastProvider } from '@/components/Toast';
import type { AuthApi } from '@/lib/auth/authContext';
import { AuthContext, GUEST_AUTH } from '@/lib/auth/authContext';
import { LocalRepository } from '@/lib/repository/LocalRepository';
import { RepositoryContext } from '@/lib/repository/repositoryContext';
import type { DataRepository } from '@/lib/repository/types';

interface Options {
  /** URL to start at (defaults to `path`). */
  at?: string;
  /** Initial router state for the first entry. */
  state?: unknown;
  /** Other paths that just render "Page <path>", to assert navigation. */
  others?: string[];
  /** Repository to use; a fresh LocalRepository by default. */
  repo?: DataRepository;
  /** Auth overrides; by default a guest with accounts enabled. */
  auth?: Partial<AuthApi>;
}

export const TEST_GUEST: AuthApi = { ...GUEST_AUTH, accountsEnabled: true };

/** Render `element` at `path` inside a memory router, toasts, auth and a repository. */
export function renderRoute(path: string, element: ReactElement, options: Options = {}) {
  const { at = path, state, others = [], repo = new LocalRepository(), auth } = options;
  const router = createMemoryRouter(
    [{ path, element }, ...others.map((p) => ({ path: p, element: <p>Page {p}</p> }))],
    { initialEntries: [{ pathname: at, state }] },
  );
  const authValue: AuthApi = { ...TEST_GUEST, ...auth };
  const utils = render(
    <AuthContext.Provider value={authValue}>
      <RepositoryContext.Provider value={repo}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </RepositoryContext.Provider>
    </AuthContext.Provider>,
  );
  return { ...utils, router, repo, auth: authValue };
}
