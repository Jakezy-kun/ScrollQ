import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { PAGE_WIDTH } from '@/components/pageWidth';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <main className={`flex flex-1 flex-col px-6 pb-8 pt-16 ${PAGE_WIDTH.narrow}`}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet/20">
          <Compass className="h-8 w-8 text-violet" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold">This page scrolled away</h1>
        <p className="mt-3 max-w-[30ch] text-muted">
          We couldn't find what you were looking for. Your coins are safe.
        </p>
      </div>
      <Button fullWidth onClick={() => navigate(ROUTES.start)}>
        Back to Start
      </Button>
    </main>
  );
}
