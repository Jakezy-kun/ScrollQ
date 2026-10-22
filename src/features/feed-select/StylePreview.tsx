import type { FeedStyle } from '@/engine';

/** Tiny decorative mock of each feed style. No real brands or logos. */
export function StylePreview({ style }: { style: FeedStyle }) {
  if (style === 'vertical') {
    return (
      <div
        aria-hidden="true"
        className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-[#4A3A86] to-[#241B47]"
      >
        <div className="absolute inset-x-0 top-1.5 flex justify-center gap-1">
          <span className="block h-1 w-3 rounded-full bg-white/40" />
          <span className="block h-1 w-3 rounded-full bg-white" />
        </div>
        <div className="absolute right-1 top-6 flex flex-col items-center gap-1.5">
          <span className="block h-3 w-3 rounded-full bg-white/70 ring-1 ring-white" />
          <span className="block h-2.5 w-2.5 rounded-full bg-coral" />
          <span className="block h-2 w-2 rounded-sm bg-white/60" />
          <span className="block h-2 w-2 rounded-sm bg-white/60" />
        </div>
        <div className="absolute bottom-2 left-1.5 space-y-1">
          <span className="block h-1 w-5 rounded-full bg-white" />
          <span className="block h-1 w-8 rounded-full bg-white/60" />
          <span className="block h-1 w-6 rounded-full bg-white/35" />
        </div>
        <span className="absolute inset-x-0 bottom-0 block h-0.5 bg-white/25">
          <span className="block h-full w-1/3 bg-white/80" />
        </span>
      </div>
    );
  }
  if (style === 'gallery') {
    return (
      <div aria-hidden="true" className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-base">
        <div className="flex items-center gap-1 px-1.5 py-1">
          <span className="block h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-violet to-mint" />
          <span className="block h-1 w-5 rounded-full bg-white/70" />
        </div>
        <span className="block h-9 w-full bg-[#1E4A47]" />
        <div className="flex items-center gap-1 px-1.5 pt-1">
          <span className="block h-1.5 w-1.5 rounded-full bg-coral" />
          <span className="block h-1.5 w-1.5 rounded-full bg-white/60" />
          <span className="block h-1.5 w-1.5 rounded-full bg-white/60" />
          <span className="ml-auto block h-1.5 w-1.5 rounded-sm bg-white/60" />
        </div>
        <span className="mx-1.5 mt-1 block h-1 w-2/3 rounded-full bg-white/40" />
      </div>
    );
  }
  if (style === 'forum') {
    return (
      <div aria-hidden="true" className="h-20 w-14 shrink-0 space-y-1 rounded-xl bg-base p-1">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md bg-surface p-1">
            <div className="flex items-center gap-0.5">
              <span className="block h-1.5 w-1.5 rounded-full bg-mint" />
              <span className="block h-1 w-4 rounded-full bg-white/40" />
            </div>
            <span className="mt-1 block h-1.5 w-full rounded-full bg-white/85" />
            <div className="mt-1 flex gap-0.5">
              <span className="block h-1.5 w-4 rounded-full bg-violet/80" />
              <span className="block h-1.5 w-2.5 rounded-full bg-white/25" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-base">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-1 border-b border-white/10 px-1.5 py-1.5 last:border-0">
          <span className="h-3 w-3 shrink-0 rounded-full bg-violet/70" />
          <div className="flex-1 space-y-0.5">
            <span className="block h-1 w-full rounded-full bg-white/80" />
            <span className="block h-1 w-2/3 rounded-full bg-white/30" />
            <span className="flex justify-between pt-0.5">
              <span className="block h-0.5 w-1 bg-white/40" />
              <span className="block h-0.5 w-1 bg-white/40" />
              <span className="block h-0.5 w-1 bg-white/40" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
