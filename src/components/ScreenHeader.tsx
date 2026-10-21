import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/cn';

export interface ScreenHeaderProps {
  title?: ReactNode;
  /** Where Back goes. Defaults to the previous page, or Start if there is none. */
  backTo?: string;
  backLabel?: string;
  hideBack?: boolean;
  right?: ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  backTo,
  backLabel = 'Back',
  hideBack = false,
  right,
  className,
}: ScreenHeaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.state && (window.history.state as { idx?: number }).idx) navigate(-1);
    else navigate('/');
  };

  return (
    <header
      className={cn(
        'flex min-h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      {!hideBack && (
        <button
          type="button"
          onClick={goBack}
          className="-ml-1 inline-flex min-h-tap min-w-tap items-center gap-1 rounded-full px-2 font-semibold text-muted transition-colors duration-fast hover:text-fg"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          {backLabel}
        </button>
      )}
      {title && <h1 className="flex-1 truncate font-display text-lg font-bold text-fg">{title}</h1>}
      {!title && <div className="flex-1" />}
      {right}
    </header>
  );
}
