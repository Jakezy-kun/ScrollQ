import { ChartLine, CircleHelp, House, LogIn, Play, Settings, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AvatarArt } from '@/components/avatar/AvatarArt';
import { Wordmark } from '@/components/Wordmark';
import { selectProgress } from '@/engine';
import { useProfile } from '@/hooks/useProfile';
import { useRound } from '@/hooks/useRound';
import { useAuth } from '@/lib/auth/authContext';
import { cn } from '@/lib/cn';
import { ROUTES } from './routes';

/**
 * Left sidebar on laptops and PCs (lg and up), like the desktop sites of social apps.
 * Phones never see it: they navigate from the Start screen and Back buttons.
 */
export function DesktopNav() {
  const auth = useAuth();
  const { profile } = useProfile();
  const round = useRound((s) => s.round);
  const inProgress = round.status === 'playing';
  const progress = selectProgress(round);
  // No "Resume" card while the round is already on screen.
  const onRound = useLocation().pathname === ROUTES.round;

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/5 bg-deep px-4 py-6 lg:flex xl:w-72"
    >
      <Link
        to={ROUTES.start}
        className="mb-8 self-start rounded-card px-3 py-1"
        aria-label="ScrollQ home"
      >
        <Wordmark className="text-3xl" />
      </Link>

      {inProgress && !onRound && (
        <Link
          to={ROUTES.round}
          className="mb-4 flex items-center gap-3 rounded-card-lg bg-violet/20 p-3 ring-1 ring-violet/60 transition-colors duration-fast hover:bg-violet/30"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet text-fg">
            <Play className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-fg">Resume round</span>
            <span className="block text-sm text-muted">
              Post {progress.current} of {progress.total}
            </span>
          </span>
        </Link>
      )}

      <ul className="space-y-1">
        <Item to={ROUTES.start} icon={<House />} end>
          Home
        </Item>
        <Item to={ROUTES.feedSelect} icon={<Play />}>
          {inProgress ? 'New round' : 'Play'}
        </Item>
        <Item to={ROUTES.history} icon={<ChartLine />}>
          History
        </Item>
        <Item to={ROUTES.howTo} icon={<CircleHelp />}>
          How to Play
        </Item>
        <Item to={ROUTES.settings} icon={<Settings />}>
          Settings
        </Item>
      </ul>

      <div className="mt-auto space-y-1">
        {auth.status === 'signedIn' ? (
          <NavLink
            to={ROUTES.profile}
            className={({ isActive }) =>
              cn(
                'flex min-h-tap items-center gap-3 rounded-card px-3 py-2 transition-colors duration-fast',
                isActive ? 'bg-surface text-fg' : 'text-muted hover:bg-white/5 hover:text-fg',
              )
            }
          >
            <AvatarArt id={profile?.avatar} fallbackName={profile?.displayName ?? ''} size={32} />
            <span className="min-w-0 flex-1 truncate font-semibold">
              {profile?.displayName || 'Your profile'}
            </span>
          </NavLink>
        ) : (
          auth.accountsEnabled &&
          auth.status === 'guest' && (
            <ul className="space-y-1">
              <Item to={ROUTES.login} icon={<LogIn />}>
                Log in
              </Item>
              <Item to={ROUTES.signup} icon={<UserPlus />}>
                Create account
              </Item>
            </ul>
          )
        )}
        <p className="flex gap-3 px-3 pt-3 text-xs text-muted">
          <Link to={ROUTES.about} className="hover:text-fg hover:underline">
            About
          </Link>
          <Link to={ROUTES.privacy} className="hover:text-fg hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </nav>
  );
}

function Item({
  to,
  icon,
  end = false,
  children,
}: {
  to: string;
  icon: ReactNode;
  end?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex min-h-tap items-center gap-3 rounded-card px-3 py-2 text-[15px] font-semibold transition-colors duration-fast [&_svg]:h-5 [&_svg]:w-5',
            isActive ? 'bg-surface text-fg' : 'text-muted hover:bg-white/5 hover:text-fg',
          )
        }
      >
        <span aria-hidden="true">{icon}</span>
        {children}
      </NavLink>
    </li>
  );
}
