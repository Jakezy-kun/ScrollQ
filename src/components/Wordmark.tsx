import { cn } from '@/lib/cn';

/** "ScrollQ" with the Q in amber. Renders as a heading when `as` is set. */
export function Wordmark({
  className,
  as: Tag = 'span',
}: {
  className?: string;
  as?: 'span' | 'h1' | 'p';
}) {
  return (
    <Tag
      className={cn('font-display font-extrabold leading-none tracking-tight text-fg', className)}
    >
      Scroll<span className="text-amber">Q</span>
    </Tag>
  );
}
