import { expect, test } from '@playwright/test';
import {
  expectNoA11yViolations,
  expectPost,
  readCurrentPost,
  skipOnboarding,
  skipToEnd,
  startRound,
} from './support/helpers';

test('guest: Start → pick feed → read (confirm) → skip → flag → finish → summary → reflect', async ({
  page,
}) => {
  await skipOnboarding(page);
  await expectNoA11yViolations(page, 'Start');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pick your feed' })).toBeVisible();
  await expectNoA11yViolations(page, 'Pick your feed');
  await page.goBack();

  await startRound(page, 'Gallery');
  await expectNoA11yViolations(page, 'Round');

  // Read: nothing is taken until Confirm.
  const coins = page.getByText(/^\d+ coins left$/).first();
  await expect(coins).toHaveText('100 coins left');
  await page.getByRole('button', { name: /^Read \d+ coins$/ }).click();
  await expect(page.getByRole('dialog', { name: /Open this post for/ })).toBeVisible();
  await expectNoA11yViolations(page, 'Read confirmation sheet');
  await expect(coins).toHaveText('100 coins left');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await readCurrentPost(page);
  await expectPost(page, 2);
  await expect(coins).not.toHaveText('100 coins left');

  // Skip and Flag.
  await page.getByRole('button', { name: 'Skip' }).click();
  await expectPost(page, 3);
  await page.getByRole('button', { name: 'Flag as trap' }).click();
  await expectPost(page, 4);

  // Finish the round.
  await skipToEnd(page, 4);
  await expect(page.getByRole('heading', { name: /Round complete|round over/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /^SQ \d+ out of 100$/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'The reveal' }).getByRole('listitem')).toHaveCount(
    12,
  );
  await expectNoA11yViolations(page, 'Summary');

  // Reflect, then the round shows up as Best SQ.
  await page.getByRole('button', { name: 'Reflect on this round' }).click();
  await expect(page.getByRole('heading', { name: 'Take a moment' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Which trap almost got you?' })
    .fill('The quiz that wanted my comments');
  await page
    .getByRole('textbox', { name: "One limit you'll try this week." })
    .fill('No phone after 10 PM');
  await expectNoA11yViolations(page, 'Reflect');
  await page.getByRole('button', { name: 'Back to Start' }).click();

  await expect(page.getByRole('link', { name: /Best SQ \d+/ })).toBeVisible();
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: '1 round' })).toBeVisible();
  await expectNoA11yViolations(page, 'History');
});

test('every other screen passes an accessibility scan', async ({ page }) => {
  await skipOnboarding(page);
  for (const [path, label] of [
    ['/how-to-play', 'How to Play'],
    ['/settings', 'Settings'],
    ['/login', 'Log in'],
    ['/signup', 'Sign up'],
    ['/forgot-password', 'Forgot password'],
    ['/privacy', 'Privacy notice'],
    ['/about', 'About'],
    ['/nope', '404'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('main').first()).toBeVisible();
    await expectNoA11yViolations(page, label);
  }
});
