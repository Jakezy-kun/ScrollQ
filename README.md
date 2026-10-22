# ScrollQ

**ScrollQ ("Scroll Budget")** is a game-based learning app that helps students aged 15–22 spend their attention wisely on social feeds. Each round you get 100 attention coins and a feed that never ends. Every post shows a teaser and a price, and you decide whether to read it, skip it, or flag it as a trap. Opening a post always needs a confirmation, and standing still drains coins, just like mindless scrolling drains attention. At the end you get your SQ score, see which posts were worth it and which were traps (and why), and take a moment to reflect. The learning comes from the rules themselves (scarcity, cost, consequences, the reveal and reflection), not from badges.

It's a mobile-first React app, installable as a PWA, that works fully offline in curated mode. Guests can always play; a free account (Supabase) saves rounds and SQ history to the cloud.

> **Formerly Scroll Budget.** The app's original name was **Scroll Budget**. It kept that name until it was renamed **ScrollQ**.

---

## Quick start

Requires **Node 20.19+** (tested on Node 23).

```bash
npm i
npm run dev          # http://localhost:5173
npm test             # unit + component tests (Vitest)
npm run build        # type-check + production build into dist/
```

Other scripts:

| Script                            | What it does                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `npm run typecheck`               | Strict TypeScript check                                                        |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                              |
| `npm run test:e2e`                | Playwright end-to-end tests (run `npx playwright install chromium` once first) |
| `npm run preview`                 | Serve the production build                                                     |
| `npm run preview:vercel`          | Serve `dist/` with the exact headers and CSP from `vercel.json` (port 4175)    |
| `npm run icons`                   | Regenerate the PWA icons from `public/logo.svg`                                |

In development, `/dev/components` shows a gallery of the shared UI (including the 8 avatars).

### Guest-only mode

Without Supabase env vars, ScrollQ runs in **guest-only mode**: everything works, rounds and reflections are saved on the device, account features are hidden, and the console logs a short note. supabase-js isn't even downloaded.

---

## Supabase setup (accounts + cloud history)

1. Create a free project at [supabase.com](https://supabase.com).
2. **Run the migrations.** Open **SQL Editor**, then paste and run each file in [`supabase/migrations`](supabase/migrations) in order: [`20261022000000_init.sql`](supabase/migrations/20261022000000_init.sql), then [`20261022000001_grant_authenticated.sql`](supabase/migrations/20261022000001_grant_authenticated.sql), then [`20261022000002_forum_feed_style.sql`](supabase/migrations/20261022000002_forum_feed_style.sql). (With the Supabase CLI: `supabase link`, then `supabase db push`.) Together they create:
   - `profiles` (nickname + built-in avatar id) and `rounds` (results, ledger, decisions, reflection),
   - **Row Level Security** on both: players can only select/insert/update/delete their own rows; signed-out visitors get nothing,
   - explicit table grants for signed-in players, so it works whether or not "Automatically expose new tables" was ticked when the project was created,
   - a trigger that creates the profile on sign-up (using only the nickname typed, never a provider's real name),
   - `delete_my_account()`, a `security definer` function that deletes only the calling user; their profile and rounds cascade.
3. **Authentication → Providers → Email:** keep Email on and turn on **Confirm email**.
4. **Authentication → URL Configuration:**
   - **Site URL:** your Vercel URL (e.g. `https://scrollq.vercel.app`), or `http://localhost:5173` while developing.
   - **Redirect URLs:** add `http://localhost:5173/**` and `https://<your-vercel-domain>/**`. Email confirmation links return to `/`, password reset links to `/reset-password`.
5. **Project Settings → API:** copy the **Project URL** and the **`anon` public key** into `.env.local` (copy [`.env.example`](.env.example)). Use the bare URL, `https://<project>.supabase.co`, without `/rest/v1/` on the end. Never put the service-role key in the frontend.
6. **Optional: Google sign-in.** Enable the Google provider under **Authentication → Providers** (it needs a Google Cloud OAuth client whose redirect URI is the one Supabase shows), then set `VITE_ENABLE_GOOGLE=true`.
7. Restart `npm run dev`.

---

## Deploy to Vercel

1. Push the repo to GitHub and **Import** it in Vercel. The framework preset is **Vite** (build `npm run build`, output `dist`).
2. **Settings → Environment Variables:** add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and, optionally, `VITE_ENABLE_GOOGLE=true` and `PIXABAY_API_KEY` (for Production and Preview). Leave them out for a guest-only deploy without videos.
3. Deploy, then add the Vercel domain to Supabase's Site URL / Redirect URLs (step 4 above).

[`vercel.json`](vercel.json) does three things:

- **SPA rewrite:** every path except `/api/*` serves `index.html`, so deep links like `/history` work.
- **Security headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, a tight `Permissions-Policy`, and a **Content Security Policy** that allows only this origin, Supabase (`*.supabase.co`), the Live feed (`lemmy.world`), Google Fonts and Pixabay's video CDN (`cdn.pixabay.com`, video and poster images only).
- **Caching:** hashed `/assets/*` are immutable; `index.html`, the service worker and the manifest are always revalidated.

If you use a **custom Supabase domain** or a different Lemmy instance, add it to `connect-src` in the CSP. The font loader in `index.html` is allowed by a hash in the CSP; if you change that `onload` value, update the hash. Check the result locally with `npm run build && npm run preview:vercel`.

---

## Tuning the game: [`src/engine/config.ts`](src/engine/config.ts)

Every game number lives in one file; the engine, selectors and UI all read from it.

| Setting                                                   | Default         | Meaning                                                                             |
| --------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `startingCoins`                                           | 100             | Coins per round                                                                     |
| `postsPerRound`                                           | 12              | Posts drawn per round                                                               |
| `trapShare`                                               | 0.5             | Share of traps in a curated round                                                   |
| `costRange`                                               | 3–8             | Allowed post costs                                                                  |
| `idle.delayMs` / `idle.drainEveryMs` / `idle.drainAmount` | 5000 / 2000 / 1 | Idle drain: grace period, then 1 coin every 2 s                                     |
| `penalties.trapRead` / `penalties.wrongFlag`              | 5 / 3           | Extra cost for reading a trap / flagging a valuable post                            |
| `sq.goodCallWeight` / `sq.coinsWeight`                    | 0.8 / 0.2       | Curated SQ = round(0.8 × good-calls % + 0.2 × coins-left %)                         |
| `liveSq.worthWeight` / `liveSq.coinsWeight`               | 0.6 / 0.4       | Live SQ = round(0.6 × share of reading coins rated "worth it" + 0.4 × coins-left %) |
| `labels`                                                  | 85 / 60 / 0     | Mindful Scroller / Getting There / Autopilot, with their messages                   |
| `outOfCoinsMomentMs`                                      | 1600            | How long "You're out of attention" shows                                            |

The engine tests pin the rules (confirm-before-deduct, penalties, idle timing, round end, SQ and labels), so run `npm test` after changing behavior.

## Adding posts: [`src/content/posts.json`](src/content/posts.json)

Each post looks like this:

```json
{
  "id": "v16",
  "author": "@madeup.handle",
  "title": "Short teaser shown on the card",
  "body": "Full text, shown only after paying.\n\nBlank lines make paragraphs.",
  "cost": 5,
  "skinMedia": { "color": "#22385E", "glyph": "📚" },
  "community": "studytips",
  "isTrap": false,
  "trapType": null,
  "why": "One line for the reveal: why it was worth it, or what kind of trap it was."
}
```

- `trapType` is `null` for valuable posts, or one of `clickbait`, `rage_bait`, `fake_news`, `time_waster`, `engagement_bait`.
- `cost` must be within `costRange`; `skinMedia.color` is a `#RRGGBB` used for the card art.
- `community` is optional: a made-up lowercase topic name the Forum style shows as `c/studytips`. Without it the post shows under `c/general`.
- Keep it school-safe: no real people, brands or political parties, only made-up handles.
- Keep the pool roughly half traps and half valuable. Rounds draw a balanced mix.
- A Zod schema validates the file at load and in `npm test`.

## Live feed (optional)

"Live feed" on _Pick your feed_ loads public posts from a Lemmy instance's v3 API ([`src/content/LemmyProvider.ts`](src/content/LemmyProvider.ts), settings in `LIVE_FEED`):

- NSFW posts and communities, removed posts and bot accounts are dropped, plus a best-effort word filter for school safety. Images and links are never loaded; HTML and Markdown are stripped and bodies truncated. Cost scales with text length.
- Live posts have no trusted trap labels, so trap detection isn't scored. After reading, players answer **"Was it worth your coins?"** and the Live SQ is based on budget use and those answers.
- If the request fails, takes longer than 4 s, is blocked, or returns too few safe posts, the round uses the curated pool and says so. Live is disabled offline.

## Background videos (optional)

In the **Vertical** and **Gallery** feeds, curated posts play a short, muted stock clip from the free [Pixabay API](https://pixabay.com/api/docs/), found with each post's `videoQuery` words.

1. Log in at [pixabay.com/api/docs](https://pixabay.com/api/docs/); your key is shown under **key (required)**.
2. Add `PIXABAY_API_KEY=...` to `.env.local` (no `VITE_` prefix) and restart `npm run dev`. On Vercel, add it under **Settings → Environment Variables**.

How it works: the app calls `/api/videos?q=...` ([`api/videos.ts`](api/videos.ts) on Vercel, a Vite middleware in dev), which searches Pixabay with `safesearch=true`, prefers portrait clips, returns the smallest file and is cached for 24 hours as Pixabay requires. The key never reaches the browser. Without a key, offline, with data saver, or if a clip fails, posts keep their gradient art; reduced motion shows a still frame. Live-feed posts never get videos. Every clip shows a "Video: Pixabay" credit.

---

## Architecture

```
src/
  engine/      pure game logic, no React: types, config, reducer, selectors, idle math, deck
  content/     posts.json + Zod schema, PostProvider, CuratedProvider, LemmyProvider
  lib/         auth (AuthProvider), supabase client (loaded on demand), repository
               (Local + Supabase), sync queue, round records, prefs, storage, feedback
  features/    one folder per screen (onboarding, start, howto, feed-select, round, summary,
               reflect, history, settings, auth, account, legal, not-found, error)
  components/  shared UI: Button, CoinCounter, IdleMeter, BottomSheet, Toast, post skins,
               ScoreRing, SqChart, form fields, avatars
  hooks/       useRound (store), useIdleDrain, useRounds, useProfile, useModal, …
  app/         router (lazy routes), app shell, RequireAuth, PWA update prompt
supabase/      SQL migration
e2e/           Playwright tests (+ mocked Supabase backend)
```

- **Engine:** a pure reducer with explicit actions (`START_ROUND`, `REQUEST_READ`, `CONFIRM_READ`, `CANCEL_READ`, `CLOSE_POST`, `SKIP`, `FLAG`, `IDLE_TICK`, `END_ROUND`, plus `POST_SHOWN`, `ACTIVITY`, `SET_IDLE_PAUSED` and `RATE_POST`). Every action carries a timestamp, so idle drain is timestamp-based and stays accurate when the browser throttles timers. Every coin change goes into a **ledger** with a reason (`read`, `trap_penalty`, `wrong_flag`, `idle`), and the summary is calculated from it. UI components only read selectors.
- **State:** `useRound` (Zustand) wraps the reducer and keeps the in-progress round in `sessionStorage`, so a reload or an expired session never loses it. When a round ends, a `RoundRecord` snapshot is taken for saving.
- **Data:** every screen saves and loads through one `DataRepository`: `LocalRepository` (localStorage) for guests, `SupabaseRepository` for signed-in players. Writes made offline wait in a per-user **sync queue** and upload when the connection returns. After signing in, guests are offered to move their device rounds into the account.
- **Auth:** `AuthProvider` exposes `user`, `status` (`loading | guest | signedIn`), `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`. Errors are generic ("Wrong email or password"). Profile and Account sit behind `RequireAuth`, which returns players to where they were after logging in.
- **PWA:** `vite-plugin-pwa` precaches the whole app (every screen and the curated posts) and caches Google Fonts, so curated rounds work offline after the first visit. Supabase and the Live feed are never cached. A new version is offered with a "Reload" prompt, never during a round.

## Quality

- **Tests:** `npm test` runs the engine, content, repository/sync and component tests. `npm run test:e2e` runs Playwright on a phone-sized Chromium:
  - guest: Start → pick feed → read (confirm) → skip → flag → finish → summary → reflect,
  - account: sign up → log in → play a round → see it on Profile → log out (against a mocked Supabase API, so no real project is needed),
  - Live feed with ratings, and the curated fallback,
  - PWA: manifest, and a curated round played fully offline on the production build,
  - an axe accessibility scan (WCAG 2.1 A/AA) of every screen.
- **Accessibility:** keyboard support throughout; the bottom sheet and post view are real modals (focus trap, Esc, scroll lock, focus return). The coin counter announces meaningful changes politely (not idle ticks). Post bodies aren't in the DOM until paid for. Reduced motion is respected, both the device setting and an in-app switch.
- **Lighthouse (mobile):** 94–98 Performance and 100 Accessibility, Best Practices and SEO on the production build with the Vercel headers (`npm run build && npm run preview:vercel`). Lighthouse 12+ no longer has a PWA category; installability is covered by the manifest test.

## Privacy

ScrollQ collects only an email, a nickname and a built-in avatar choice, plus round results and private reflections. There are no real names, photos, birthdays or locations, and no ads or tracking. Players can download their data or delete their account at any time. See the in-app [Privacy notice](src/features/legal/PrivacyPage.tsx).
