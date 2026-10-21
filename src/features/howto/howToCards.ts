export type HowToVisualKind = 'coins' | 'confirm' | 'idle' | 'traps';

export const HOW_TO_CARDS: { title: string; body: string; visual: HowToVisualKind }[] = [
  {
    title: 'You start with 100 coins',
    body: 'Each coin is a bit of your attention. The feed never ends, but your coins do.',
    visual: 'coins',
  },
  {
    title: 'Opening a post costs coins',
    body: "Every post shows its price. You'll always confirm before any coins are spent.",
    visual: 'confirm',
  },
  {
    title: 'Standing still drains coins',
    body: 'Zoning out on the feed for 5 seconds starts costing you 1 coin every 2 seconds.',
    visual: 'idle',
  },
  {
    title: 'Spot the traps',
    body: 'Some posts are built to grab you and give nothing back. Skip them or flag them.',
    visual: 'traps',
  },
];
