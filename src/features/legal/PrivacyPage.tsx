import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { LegalPage, LegalSection } from './LegalPage';

const UPDATED = 'October 2026';

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      intro="The short version: we keep as little as possible, only you can see your data, and you can delete it any time."
    >
      <LegalSection title="Who we are">
        <p>
          ScrollQ is a student project: a game about spending attention wisely on social feeds. It
          has no ads and no tracking, and we never sell or share your data.
        </p>
      </LegalSection>

      <LegalSection title="If you play as a guest">
        <p>
          Everything stays in this browser on this device: your settings, optional nickname, rounds
          and reflections. Nothing is sent to us. Clearing your history, or your browser data,
          removes it.
        </p>
      </LegalSection>

      <LegalSection title="If you create an account, we store">
        <ul>
          <li>your email address, to log you in and send password resets</li>
          <li>a nickname you choose (not your real name)</li>
          <li>which built-in avatar you picked</li>
          <li>your round results: SQ, coins, and which posts you read, skipped or flagged</li>
          <li>your reflections, if you write any</li>
        </ul>
        <p>
          It's stored with Supabase, a database service, so you can see your history on any device.
        </p>
      </LegalSection>

      <LegalSection title="What we never collect">
        <p>
          No real names, photos, birthdays, location, contacts or school details. If you sign in
          with Google, we don't copy your name from it.
        </p>
      </LegalSection>

      <LegalSection title="Who can see it">
        <p>
          Only you. Your reflections are private and nobody grades them. The database only lets each
          account read its own rows. The student team running ScrollQ can access the database to
          keep it working, but doesn't look through players' data.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul>
          <li>
            Clear your rounds any time from{' '}
            <Link to={ROUTES.history} className="underline underline-offset-4">
              History
            </Link>
            .
          </li>
          <li>Download everything we have about you from Account → Download my data.</li>
          <li>
            Delete your account from Account → Delete account. Your profile, rounds and reflections
            are deleted right away and can't be recovered.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Live feed">
        <p>
          If you choose the optional Live feed, ScrollQ loads public posts from a Lemmy server. Like
          any website, that server can see your device's IP address. Curated mode never contacts it.
        </p>
      </LegalSection>

      <LegalSection title="Under 18?">
        <p>
          Many players are 15 to 17, which is why we collect so little. It's a good idea to let a
          parent or guardian know you're using ScrollQ.
        </p>
      </LegalSection>

      <p className="text-sm text-muted">Last updated {UPDATED}.</p>
    </LegalPage>
  );
}
