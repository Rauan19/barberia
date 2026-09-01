import { Card } from '@/components/ui/card';

export type Insight = { emoji: string; text: string };

export function Insights({ items }: { items: Insight[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold">Resumo do mês</p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm">
            <span aria-hidden className="text-base leading-5">
              {item.emoji}
            </span>
            <span className="text-muted-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
