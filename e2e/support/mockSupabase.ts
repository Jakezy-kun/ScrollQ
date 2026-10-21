import type { Page, Route } from '@playwright/test';

export const MOCK_SUPABASE_URL = 'https://e2e-mock.supabase.co';

type Row = Record<string, unknown>;

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** A JWT-shaped token; the mock never verifies it. */
function fakeJwt(sub: string, email: string): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub, email, exp, role: 'authenticated', aud: 'authenticated' })}.e2e-signature`;
}

/**
 * An in-memory stand-in for the Supabase Auth and REST endpoints ScrollQ uses.
 * Sign-up needs email confirmation (returns a user, no session), like a real project.
 */
export async function mockSupabase(page: Page) {
  const users = new Map<
    string,
    { id: string; email: string; password: string; display_name: string }
  >();
  const profiles = new Map<string, Row>();
  const rounds = new Map<string, Row>();
  let currentUserId: string | null = null;

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });

  const userJson = (u: { id: string; email: string; display_name: string }) => ({
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { display_name: u.display_name },
    app_metadata: { provider: 'email' },
    identities: [{ id: u.id, provider: 'email' }],
    created_at: new Date().toISOString(),
  });

  await page.route(`${MOCK_SUPABASE_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        },
      });
    }

    // ---- Auth ----
    if (url.pathname === '/auth/v1/signup' && method === 'POST') {
      const body = req.postDataJSON() as {
        email: string;
        password: string;
        data?: { display_name?: string };
      };
      const id = crypto.randomUUID();
      const user = {
        id,
        email: body.email,
        password: body.password,
        display_name: body.data?.display_name ?? 'Player',
      };
      users.set(body.email, user);
      profiles.set(id, {
        id,
        display_name: user.display_name,
        avatar: null,
        created_at: new Date().toISOString(),
      });
      return json(route, 200, userJson(user)); // no session: confirmation email sent
    }
    if (url.pathname === '/auth/v1/token' && method === 'POST') {
      const body = req.postDataJSON() as { email?: string; password?: string };
      const user = body.email ? users.get(body.email) : undefined;
      if (!user || user.password !== body.password) {
        return json(route, 400, {
          code: 'invalid_credentials',
          error_code: 'invalid_credentials',
          msg: 'Invalid login credentials',
        });
      }
      currentUserId = user.id;
      return json(route, 200, {
        access_token: fakeJwt(user.id, user.email),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: `refresh-${user.id}`,
        user: userJson(user),
      });
    }
    if (url.pathname === '/auth/v1/user' && method === 'GET') {
      const user = [...users.values()].find((u) => u.id === currentUserId);
      return user ? json(route, 200, userJson(user)) : json(route, 401, { msg: 'Not signed in' });
    }
    if (url.pathname === '/auth/v1/logout') {
      currentUserId = null;
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }

    // ---- REST ----
    const eq = (key: string) => url.searchParams.get(key)?.replace(/^eq\./, '');
    if (url.pathname === '/rest/v1/profiles') {
      const id = eq('id');
      if (method === 'GET')
        return json(route, 200, id && profiles.has(id) ? [profiles.get(id)] : []);
      if (method === 'PATCH' && id) {
        profiles.set(id, { ...profiles.get(id), ...(req.postDataJSON() as Row) });
        return json(route, 200, []);
      }
    }
    if (url.pathname === '/rest/v1/rounds') {
      if (method === 'POST') {
        const body = req.postDataJSON() as Row | Row[];
        for (const row of Array.isArray(body) ? body : [body]) {
          rounds.set(String(row.id), { ...row, user_id: currentUserId });
        }
        return json(route, 201, []);
      }
      if (method === 'GET') {
        const id = eq('id');
        const mine = [...rounds.values()].filter(
          (r) => r.user_id === currentUserId && (!id || r.id === id),
        );
        mine.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        return json(route, 200, mine);
      }
      if (method === 'PATCH') {
        const id = eq('id');
        if (id && rounds.has(id))
          rounds.set(id, { ...rounds.get(id), ...(req.postDataJSON() as Row) });
        return json(route, 200, []);
      }
    }

    return json(route, 404, { message: `e2e mock: no handler for ${method} ${url.pathname}` });
  });

  return { users, profiles, rounds };
}
