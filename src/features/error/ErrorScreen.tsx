import { RotateCcw } from 'lucide-react';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';

/**
 * Friendly error screen. Used as the router's errorElement and as the top-level
 * ErrorBoundary fallback, so it must not depend on router context.
 */
export function ErrorScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-1 flex-col bg-base px-6 pb-8 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral/20">
          <RotateCcw className="h-8 w-8 text-coral" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 max-w-[30ch] text-muted">
          Try again. If it keeps happening, head back to Start.
        </p>
      </div>
      <div className="space-y-3">
        <Button fullWidth onClick={() => window.location.reload()}>
          Try again
        </Button>
        <Button fullWidth variant="secondary" onClick={() => window.location.assign(ROUTES.start)}>
          Back to Start
        </Button>
      </div>
    </main>
  );
}
