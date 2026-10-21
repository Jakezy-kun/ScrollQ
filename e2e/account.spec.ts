import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, readCurrentPost, skipToEnd, startRound } from './support/helpers';
import { mockSupabase } from './support/mockSupabase';

const EMAIL = 'e2e.player@example.test';
const PASSWORD = 'scroll2win';

test('account: sign up → log in → play a round → see it on Profile → log out', async ({ page }) => {
  const backend = await mockSupabase(page);

  // First visit: choose "Create account" from onboarding.
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();

  // Sign up (validation first).
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your email.')).toBeVisible();
  await page.getByLabel('Display name').fill('Skyler');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByLabel(/I've read the/).check();
  await expectNoA11yViolations(page, 'Sign up (filled)');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Check your email (address not in the URL).
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByText(EMAIL)).toBeVisible();
  expect(page.url()).not.toContain('example.test');
  expect(backend.profiles.size).toBe(1);

  // Log in: wrong password first, then the right one.
  await page.getByRole('button', { name: 'Back to log in' }).click();
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password1');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Wrong email or password.');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Signed in: the profile button replaces "Log in".
  await expect(page.getByRole('link', { name: 'Your profile' })).toBeVisible();
  await expect(page.getByText('Hi, Skyler!')).toBeVisible();

  // Play a round; it saves to the account.
  await startRound(page, 'Timeline');
  await readCurrentPost(page);
  await skipToEnd(page, 2);
  await expect.poll(() => backend.rounds.size).toBe(1);
  await expect(page.getByText('Save your rounds and track your SQ')).toBeHidden();

  // See it on Profile.
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Skyler' })).toBeVisible();
  const played = page.getByText('Rounds played').locator('..');
  await expect(played).toContainText('1');
  await expect(page.getByRole('slider', { name: /SQ over your last 1 rounds/ })).toBeVisible();
  await expectNoA11yViolations(page, 'Profile');

  // Log out (with confirmation) and land on Start as a guest.
  await page.getByRole('link', { name: 'Account settings' }).click();
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(EMAIL);
  await expectNoA11yViolations(page, 'Account');
  await page.getByRole('button', { name: 'Log out' }).click();
  const sheet = page.getByRole('dialog', { name: 'Log out of ScrollQ?' });
  await sheet.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

  // Profile is protected again.
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Log in to see that page.')).toBeVisible();
});
