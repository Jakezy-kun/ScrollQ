import { useId } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { CoinIcon } from '@/components/CoinIcon';
import { Avatar } from '@/components/post';
import type { Post } from '@/engine';

interface ReadConfirmSheetProps {
  /** The post waiting for confirmation, or null when the sheet is closed. */
  post: Post | null;
  coins: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReadConfirmSheet({ post, coins, onConfirm, onCancel }: ReadConfirmSheetProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <BottomSheet open={post !== null} onClose={onCancel} labelledBy={titleId} describedBy={descId}>
      {post && (
        <SheetBody
          post={post}
          coins={coins}
          titleId={titleId}
          descId={descId}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </BottomSheet>
  );
}

function SheetBody({
  post,
  coins,
  titleId,
  descId,
  onConfirm,
  onCancel,
}: {
  post: Post;
  coins: number;
  titleId: string;
  descId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canAfford = post.cost <= coins;
  const left = coins - post.cost;

  return (
    <>
      <div className="flex items-center gap-3 rounded-card bg-base/70 p-3">
        <Avatar post={post} size={40} />
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{post.author}</p>
          <p className="line-clamp-2 font-semibold leading-snug text-fg">{post.title}</p>
        </div>
      </div>

      <h2 id={titleId} className="mt-5 font-display text-2xl font-bold leading-tight text-fg">
        Open this post for{' '}
        <span className="inline-flex items-baseline gap-1 text-amber">
          <CoinIcon size={20} className="self-center" />
          {post.cost} coins?
        </span>
      </h2>
      {canAfford ? (
        <p id={descId} className="mt-2 text-base text-muted">
          You'll have <span className="font-bold text-fg">{left}</span> left. No coins are taken
          until you confirm.
        </p>
      ) : (
        <p id={descId} className="mt-2 text-base text-coral">
          You need {post.cost} coins but only have {coins}. Skip it or flag it instead.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!canAfford}>
          Confirm
        </Button>
      </div>
    </>
  );
}
