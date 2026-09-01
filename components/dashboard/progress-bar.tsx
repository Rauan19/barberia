import { cn } from '@/lib/utils';

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const complete = percent >= 100;

  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all',
          complete ? 'bg-success' : 'bg-primary',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
