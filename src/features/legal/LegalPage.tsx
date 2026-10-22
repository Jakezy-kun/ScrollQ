import type { ReactNode } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PAGE_WIDTH } from '@/components/pageWidth';

/** Simple reading layout for the Privacy notice and About pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-12 ${PAGE_WIDTH.reading}`}>
      <ScreenHeader className="-mx-2" />
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight">{title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{intro}</p>
      <div className="mt-6 space-y-7 leading-relaxed">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-fg/90 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
