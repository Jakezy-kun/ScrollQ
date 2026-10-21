import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequireAuth } from '@/app/RequireAuth';
import { ROUTES } from '@/app/routes';
import type { AuthApi } from '@/lib/auth/authContext';
import { fail, OK } from '@/lib/auth/errors';
import { renderRoute } from '@/tests/renderRoute';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import type { LoginState } from './LogInPage';
import { LogInPage } from './LogInPage';
import { passwordStrength } from './schemas';
import { SignUpPage } from './SignUpPage';

describe('Sign up', () => {
  async function fill(user: ReturnType<typeof userEvent.setup>, values: Record<string, string>) {
    for (const [label, value] of Object.entries(values)) {
      const field = screen.getByLabelText(label, { selector: 'input' });
      await user.clear(field);
      if (value) await user.type(field, value);
    }
  }

  it('validates every field inline and blocks submit until fixed', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn<AuthApi['signUp']>();
    renderRoute(ROUTES.signup, <SignUpPage />, { auth: { signUp } });

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Use at least 2 characters.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText("Please confirm you've read the Privacy notice.")).toBeInTheDocument();
    expect(screen.getByLabelText('Display name', { selector: 'input' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await fill(user, {
      'Display name': 'Sky',
      Email: 'not-an-email',
      Password: 'abcdefgh',
      'Confirm password': 'abcdefgx',
    });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Mix letters and numbers.')).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('creates the account and goes to "Check your email" without putting the email in the URL', async () => {
    const user = userEvent.setup();
    const signUp = vi
      .fn<AuthApi['signUp']>()
      .mockResolvedValue({ ok: true, needsConfirmation: true });
    const { router } = renderRoute(ROUTES.signup, <SignUpPage />, {
      auth: { signUp },
      others: [ROUTES.checkEmail],
    });

    await fill(user, {
      'Display name': 'Skyler',
      Email: 'sky@example.com',
      Password: 'scroll2win',
      'Confirm password': 'scroll2win',
    });
    await user.click(screen.getByLabelText(/I've read the/));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(`Page ${ROUTES.checkEmail}`)).toBeInTheDocument();
    expect(signUp).toHaveBeenCalledWith({
      email: 'sky@example.com',
      password: 'scroll2win',
      displayName: 'Skyler',
    });
    expect(router.state.location.search).toBe('');
    expect(router.state.location.state).toEqual({ email: 'sky@example.com' });
  });

  it('shows a password strength hint and a show/hide toggle', async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.signup, <SignUpPage />);
    const password = screen.getByLabelText('Password', { selector: 'input' });
    expect(password).toHaveAttribute('type', 'password');

    await user.type(password, 'Scroll2Win!longer');
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]!);
    expect(password).toHaveAttribute('type', 'text');
  });

  it('rates passwords roughly', () => {
    expect(passwordStrength('abc').label).toBe('Weak');
    expect(passwordStrength('abcdefg1').label).toBe('Okay');
    expect(passwordStrength('Abcdefg1!xyz').label).toBe('Strong');
  });
});

describe('Log in', () => {
  it('requires email and password', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn<AuthApi['signIn']>();
    renderRoute(ROUTES.login, <LogInPage />, { auth: { signIn } });

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a generic error that never says which part was wrong', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn<AuthApi['signIn']>().mockResolvedValue(fail('invalid_credentials'));
    renderRoute(ROUTES.login, <LogInPage />, { auth: { signIn } });

    await user.type(screen.getByLabelText('Email'), 'sky@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'nope');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
  });

  it('asks unconfirmed players to confirm their email', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn<AuthApi['signIn']>().mockResolvedValue(fail('email_not_confirmed'));
    renderRoute(ROUTES.login, <LogInPage />, { auth: { signIn } });

    await user.type(screen.getByLabelText('Email'), 'sky@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'scroll2win');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please confirm your email first');
  });

  it('returns players to the page they were sent from', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn<AuthApi['signIn']>().mockResolvedValue(OK);
    const state: LoginState = {
      from: { pathname: ROUTES.profile, search: '', hash: '' },
      reason: 'protected',
    };
    renderRoute(ROUTES.login, <LogInPage />, {
      auth: { signIn },
      state,
      others: [ROUTES.profile],
    });

    expect(screen.getByText('Log in to see that page.')).toHaveAttribute('role', 'status');
    await user.type(screen.getByLabelText('Email'), 'sky@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'scroll2win');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText(`Page ${ROUTES.profile}`)).toBeInTheDocument();
  });

  it('explains an expired session', () => {
    renderRoute(ROUTES.login, <LogInPage />, { auth: { sessionExpired: true } });
    expect(screen.getByText(/Your session expired/)).toBeInTheDocument();
  });

  it('explains when accounts are turned off', () => {
    renderRoute(ROUTES.login, <LogInPage />, { auth: { accountsEnabled: false } });
    expect(screen.getByText(/Accounts are turned off/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
});

describe('Forgot password', () => {
  it('shows the same message whether or not the email has an account', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn<AuthApi['resetPassword']>().mockResolvedValue(fail('unknown'));
    renderRoute(ROUTES.forgotPassword, <ForgotPasswordPage />, { auth: { resetPassword } });

    await user.type(screen.getByLabelText('Email'), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(
      await screen.findByText(/If that email has an account, we sent a reset link/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send again in \d+s/ })).toBeDisabled();
  });
});

describe('Protected routes', () => {
  it('redirects guests to Log in and remembers where they were going', async () => {
    const { router } = renderRoute(
      ROUTES.profile,
      <RequireAuth>
        <p>Secret profile</p>
      </RequireAuth>,
      { others: [ROUTES.login] },
    );
    expect(await screen.findByText(`Page ${ROUTES.login}`)).toBeInTheDocument();
    expect(screen.queryByText('Secret profile')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(router.state.location.state).toMatchObject({
        from: { pathname: ROUTES.profile },
        reason: 'protected',
      }),
    );
  });

  it('marks the redirect as an expired session when it was one', async () => {
    const { router } = renderRoute(
      ROUTES.account,
      <RequireAuth>
        <p>Account</p>
      </RequireAuth>,
      { others: [ROUTES.login], auth: { sessionExpired: true } },
    );
    await screen.findByText(`Page ${ROUTES.login}`);
    expect(router.state.location.state).toMatchObject({ reason: 'expired' });
  });

  it('shows the page to signed-in players', () => {
    renderRoute(
      ROUTES.profile,
      <RequireAuth>
        <p>Secret profile</p>
      </RequireAuth>,
      { auth: { status: 'signedIn', user: { id: 'u1', email: 'sky@example.com' } } },
    );
    expect(screen.getByText('Secret profile')).toBeInTheDocument();
  });

  it('sends everyone to Start when accounts are turned off', async () => {
    renderRoute(
      ROUTES.profile,
      <RequireAuth>
        <p>Secret profile</p>
      </RequireAuth>,
      { auth: { accountsEnabled: false }, others: [ROUTES.start] },
    );
    expect(await screen.findByText(`Page ${ROUTES.start}`)).toBeInTheDocument();
  });
});
