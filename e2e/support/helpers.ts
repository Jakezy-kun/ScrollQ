import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Fail the test on any WCAG 2.1 A/AA violation axe can detect on the current page. */
export async function expectNoA11yViolations(page: Page, label: string) {
  // Let enter animations (≤250 ms) finish, so contrast isn't measured mid-fade.
  await page.waitForTimeout(400);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // The floating "−4" after a coin change is a decorative, fading animation.
    .exclude('[data-testid="coin-delta"]')
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
        .map((n) => `${n.target.join(' ')} :: ${n.html.slice(0, 120)} :: ${n.failureSummary ?? ''}`)
        .join('\n    ')}`,
  );
  expect(summary, `Accessibility violations on ${label}`).toEqual([]);
}

/** Wait for the round's progress bar to show "Post n of 12". */
export async function expectPost(page: Page, n: number) {
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toHaveAttribute(
    'aria-valuetext',
    `Post ${n} of 12`,
  );
}

/** Skip onboarding as a first-time visitor would. */
export async function skipOnboarding(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText("What's your Scroll Quotient?")).toBeVisible();
}

/** Start a curated round in the given feed style from the Start screen. */
export async function startRound(page: Page, style: 'Vertical' | 'Gallery' | 'Timeline' | 'Forum') {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByText(style, { exact: true }).click();
  await page.getByRole('button', { name: 'Start round' }).click();
  await expect(page).toHaveURL(/\/round$/);
  await expectPost(page, 1);
}

/** Read the current post: Read → Confirm → Back to feed. */
export async function readCurrentPost(page: Page) {
  await page.getByRole('button', { name: /^Read \d+ coins$/ }).click();
  const sheet = page.getByRole('dialog', { name: /Open this post for/ });
  await expect(sheet).toContainText('No coins are taken until you confirm.');
  await sheet.getByRole('button', { name: 'Confirm' }).click();
  const detail = page
    .getByRole('dialog')
    .filter({ hasText: 'Idle drain is paused while you read.' });
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: 'Back to feed' }).last().click();
  await expect(detail).toBeHidden();
}

/** Skip every remaining post until the summary appears. */
export async function skipToEnd(page: Page, from: number) {
  for (let n = from; n <= 12; n++) {
    await expectPost(page, n);
    await page.getByRole('button', { name: 'Skip' }).click();
  }
  await expect(page).toHaveURL(/\/summary$/);
}
