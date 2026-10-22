import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SlideDeck, SlideDots } from '@/components/Slides';
import { PAGE_WIDTH } from '@/components/pageWidth';
import { useSlides } from '@/hooks/useSlides';
import { HOW_TO_CARDS } from './howToCards';
import { HowToVisual } from './HowToVisual';

export function HowToPage() {
  const navigate = useNavigate();
  const { index, dir, go, isLast } = useSlides(HOW_TO_CARDS.length);
  const card = HOW_TO_CARDS[index];
  const done = () => navigate(ROUTES.feedSelect);
  if (!card) return null;

  return (
    <main className={`flex min-h-dvh flex-1 flex-col px-5 pb-8 ${PAGE_WIDTH.reading}`}>
      <ScreenHeader
        title="How to Play"
        backTo={ROUTES.start}
        right={
          <button
            type="button"
            onClick={done}
            className="min-h-tap rounded-full px-3 text-sm font-semibold text-muted transition-colors duration-fast hover:text-fg"
          >
            Skip
          </button>
        }
        className="-mx-2"
      />

      <SlideDeck
        index={index}
        dir={dir}
        count={HOW_TO_CARDS.length}
        go={go}
        label="How to Play"
        className="mt-4 flex-1"
      >
        <div className="flex min-h-[420px] flex-1 cursor-grab flex-col rounded-sheet bg-surface p-6 active:cursor-grabbing">
          <div className="flex flex-1 items-center justify-center py-6">
            <HowToVisual visual={card.visual} />
          </div>
          <h2 className="font-display text-[28px] font-bold leading-tight text-fg">{card.title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">{card.body}</p>
        </div>
      </SlideDeck>

      <SlideDots index={index} count={HOW_TO_CARDS.length} go={go} className="mt-4" />

      <Button fullWidth className="mt-3" onClick={() => (isLast ? done() : go(index + 1))}>
        {isLast ? "Let's play" : 'Next'}
      </Button>
    </main>
  );
}
