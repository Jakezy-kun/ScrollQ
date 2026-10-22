import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Wordmark } from '@/components/Wordmark';
import { GAME_CONFIG } from '@/engine';
import { LegalPage, LegalSection } from './LegalPage';

export function AboutPage() {
  const { startingCoins, postsPerRound } = GAME_CONFIG;
  return (
    <LegalPage
      title="About ScrollQ"
      intro={
        <>
          <Wordmark className="text-2xl" /> stands for Scroll Budget: how well you spend your
          attention when the feed never ends.
        </>
      }
    >
      <LegalSection title="What you'll learn">
        <ul>
          <li>Your attention is limited. Treat it like a budget, not a bottomless feed.</li>
          <li>
            How to spot posts built to grab you: clickbait, rage bait, fake news, time-wasters and
            engagement bait.
          </li>
          <li>To pause and check the cost before you open something.</li>
          <li>That zoning out still costs you, even when you're not choosing anything.</li>
          <li>To look back, notice what worked, and set one small limit for yourself.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How it works">
        <p>
          Each round gives you {startingCoins} coins and {postsPerRound} posts. Opening a post costs
          coins, standing still drains them, and traps cost extra. At the end you get your SQ, see
          which posts were worth it, and reflect. The learning comes from the rules, not from
          badges.
        </p>
      </LegalSection>

      <LegalSection title="Our name">
        <p>
          ScrollQ was originally called Scroll Budget. That was its name until it was renamed
          ScrollQ.
        </p>
      </LegalSection>

      <LegalSection title="Credits">
        <ul>
          <li>Made by the ScrollQ student team as a learning project.</li>
          <li>
            All posts are fictional and every handle is made up. Any resemblance to real accounts is
            accidental.
          </li>
          <li>Fonts: Bricolage Grotesque and Plus Jakarta Sans (SIL Open Font License).</li>
          <li>Icons: Lucide (ISC License).</li>
          <li>
            Background videos:{' '}
            <a
              href="https://pixabay.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Pixabay
            </a>{' '}
            (Pixabay Content License).
          </li>
        </ul>
      </LegalSection>

      <p className="text-sm text-muted">
        Version {__APP_VERSION__} ·{' '}
        <Link to={ROUTES.privacy} className="underline underline-offset-4">
          Privacy notice
        </Link>
      </p>
    </LegalPage>
  );
}
