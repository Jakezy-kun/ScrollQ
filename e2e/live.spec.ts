import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { expectNoA11yViolations, expectPost, skipOnboarding, skipToEnd } from './support/helpers';

const LEMMY = 'https://lemmy.world/api/v3/post/list**';

function lemmyPosts(n: number) {
  return {
    posts: Array.from({ length: n }, (_, i) => ({
      post: {
        id: 9000 + i,
        name: `Community garden update number ${i + 1}`,
        body: `Volunteers planted ${i + 3} new beds this week.\n\nAnyone can join on Saturdays.`,
        nsfw: false,
        removed: false,
        deleted: false,
      },
      creator: { name: `gardener_${i}`, bot_account: false, banned: false },
      community: { name: 'gardening', nsfw: false },
    })),
  };
}

async function startLive(page: Page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByText('Timeline', { exact: true }).click();
  await page.getByText('Live feed', { exact: true }).click();
  await page.getByRole('button', { name: 'Start round' }).click();
  await expect(page).toHaveURL(/\/round$/);
}

test('live: rate what was worth it, no trap scoring', async ({ page }) => {
  await page.route(LEMMY, (route) => route.fulfill({ json: lemmyPosts(20) }));
  await skipOnboarding(page);
  await startLive(page);

  await expectPost(page, 1);
  await expect(page.getByText('LIVE', { exact: true })).toBeVisible();
  await expect(page.getByText('Community garden update number 1')).toBeVisible();

  // Read one live post and rate it.
  await page.getByRole('button', { name: /^Read \d+ coins$/ }).click();
  await page
    .getByRole('dialog', { name: /Open this post for/ })
    .getByRole('button', { name: 'Confirm' })
    .click();
  const detail = page.getByRole('dialog').filter({ hasText: 'Was it worth your coins?' });
  await expect(detail).toContainText('Volunteers planted 3 new beds');
  await detail.getByRole('button', { name: 'Yes, worth it' }).click();
  await expect(detail.getByRole('button', { name: 'Yes, worth it' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expectNoA11yViolations(page, 'Live post detail');
  await detail.getByRole('button', { name: 'Back to feed' }).last().click();

  // Flagging is free in Live mode.
  await expectPost(page, 2);
  const coinsBefore = await page
    .getByText(/^\d+ coins left$/)
    .first()
    .textContent();
  await page.getByRole('button', { name: 'Flag as trap' }).click();
  await expectPost(page, 3);
  await expect(page.getByText(/^\d+ coins left$/).first()).toHaveText(coinsBefore!);

  await skipToEnd(page, 3);
  await expect(page.getByRole('heading', { name: 'Live round complete' })).toBeVisible();
  await expect(page.getByText('Worth-it reads')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your feed' })).toContainText('Worth it');
  await expect(page.getByText(/Live SQ =/)).toBeVisible();
  await expectNoA11yViolations(page, 'Live summary');
});

test('live: falls back to curated posts with a notice when the feed is blocked', async ({
  page,
}) => {
  await page.route(LEMMY, (route) => route.abort('blockedbyclient'));
  await skipOnboarding(page);
  await startLive(page);
  await expect(page.getByText("Couldn't load the live feed")).toBeVisible();
  await expect(page.getByText('LIVE', { exact: true })).toBeHidden();
  await expectPost(page, 1);
});
