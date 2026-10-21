import { toAuthError } from './errors';

describe('toAuthError', () => {
  it('never says which part of a login was wrong', () => {
    const result = toAuthError({
      code: 'invalid_credentials',
      message: 'Invalid login credentials',
    });
    expect(result).toEqual({
      ok: false,
      kind: 'invalid_credentials',
      message: 'Wrong email or password.',
    });
  });

  it.each([
    [{ code: 'email_not_confirmed' }, 'email_not_confirmed'],
    [{ status: 429, message: 'Too many requests' }, 'rate_limited'],
    [{ code: 'over_email_send_rate_limit' }, 'rate_limited'],
    [{ code: 'weak_password' }, 'weak_password'],
    [{ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }, 'network'],
    [new TypeError('Failed to fetch'), 'network'],
    [{ message: 'Database error saving new user' }, 'unknown'],
    [undefined, 'unknown'],
  ])('maps %o to %s', (error, kind) => {
    expect(toAuthError(error)).toMatchObject({ ok: false, kind });
  });
});
