import { expect, test } from '@playwright/test';
import { expectPost, skipOnboarding, startRound } from './support/helpers';

test('installable: manifest has the name, theme and icons', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = (await (await page.request.get(href!)).json()) as {
    name: string;
    short_name: string;
    theme_color: string;
    display: string;
    icons: { sizes: string; purpose?: string }[];
  };
  expect(manifest).toMatchObject({
    name: 'ScrollQ',
    short_name: 'ScrollQ',
    theme_color: '#1B1530',
    display: 'standalone',
  });
  expect(manifest.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  );
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
});

test('curated rounds work fully offline after the first visit', async ({ page, context }) => {
  await skipOnboarding(page);
  // Wait for the service worker to install and take control (first visit).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByText("What's your Scroll Budget?")).toBeVisible();

  // Every screen of a round was precached, not just the ones already visited.
  await startRound(page, 'Vertical');
  await page.getByRole('button', { name: 'Skip' }).click();
  await expectPost(page, 2);

  // Live feed is unavailable offline and says so.
  await page.goto('/feed');
  await expect(page.getByText('Needs a connection.')).toBeVisible();
  await context.setOffline(false);
});
