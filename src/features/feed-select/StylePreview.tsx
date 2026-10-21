import type { FeedStyle } from '@/engine';

/** Tiny decorative mock of each feed style. No real brands or logos. */
export function StylePreview({ style }: { style: FeedStyle }) {
  if (style === 'vertical') {
    return (
      <div aria-hidden="true" className="relative h-20 w-14 shrink-0 rounded-xl bg-[#3B2F6B]">
        <div className="absolute right-1.5 top-6 space-y-1.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-coral" />
          <span className="block h-2.5 w-2.5 rounded-full bg-white/40" />
          <span className="block h-2.5 w-2.5 rounded-full bg-white/40" />
        </div>
        <div className="absolute bottom-2 left-1.5 space-y-1">
          <span className="block h-1 w-6 rounded-full bg-white/50" />
          <span className="block h-1.5 w-8 rounded-full bg-white" />
        </div>
      </div>
    );
  }
  if (style === 'gallery') {
    return (
      <div aria-hidden="true" className="h-20 w-14 shrink-0 rounded-xl bg-base p-1.5">
        <span className="block h-10 w-full rounded-md bg-[#1E4A47]" />
        <span className="mt-1.5 block h-1.5 w-full rounded-full bg-white" />
        <span className="mt-1 block h-1 w-2/3 rounded-full bg-white/40" />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="h-20 w-14 shrink-0 space-y-2 rounded-xl bg-base p-1.5 pt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-1">
          <span className="h-3 w-3 shrink-0 rounded-full bg-violet/70" />
          <div className="flex-1 space-y-0.5">
            <span className="block h-1 w-full rounded-full bg-white/80" />
            <span className="block h-1 w-2/3 rounded-full bg-white/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
