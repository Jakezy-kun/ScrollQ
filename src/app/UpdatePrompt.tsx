import { AnimatePresence, m } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/Button';
import { useToast } from '@/components/toastContext';
import { quick } from '@/lib/motion';
import { ROUTES } from './routes';

/**
 * Registers the service worker. Tells the player once when ScrollQ works offline, and
 * offers a reload when a new version is ready (never during a round).
 */
export function UpdatePrompt() {
  const toast = useToast();
  const { pathname } = useLocation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    toast.show('Ready to play offline', {
      tone: 'good',
      detail: 'Curated rounds now work without a connection.',
    });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, toast]);

  const show = needRefresh && pathname !== ROUTES.round;

  return (
    <AnimatePresence>
      {show && (
        <m.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={quick}
          className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-2rem)] max-w-[398px] rounded-card-lg bg-surface-2 p-4 shadow-2xl ring-1 ring-white/10"
        >
          <p className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4 text-violet" aria-hidden="true" />A new version of ScrollQ
            is ready.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="md" variant="secondary" onClick={() => setNeedRefresh(false)}>
              Later
            </Button>
            <Button size="md" onClick={() => void updateServiceWorker(true)}>
              Reload
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
