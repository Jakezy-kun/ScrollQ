import { Lock } from 'lucide-react';
import { Avatar, CostBadge } from '@/components/post';
import type { Post } from '@/engine';

/** Locked preview of the next posts under the Gallery and Timeline skins. Decorative. */
export function UpNext({ posts }: { posts: Post[] }) {
  return (
    <section className="mt-5" aria-hidden="true">
      {posts.length > 0 && <h3 className="mb-2 px-1 text-sm font-semibold text-muted">Up next</h3>}
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-card bg-surface/50 p-3">
            <Avatar post={p} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{p.author}</p>
              <p className="truncate text-sm font-semibold text-fg">{p.title}</p>
            </div>
            <CostBadge cost={p.cost} />
            <Lock className="h-4 w-4 text-muted" />
          </li>
        ))}
      </ul>
      <p className="py-6 text-center text-sm text-muted">The feed never ends. Your coins do.</p>
    </section>
  );
}
