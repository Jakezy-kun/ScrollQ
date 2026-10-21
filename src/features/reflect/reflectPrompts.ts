import type { Reflection } from '@/lib/rounds/record';

export const REFLECT_PROMPTS: { id: keyof Reflection; question: string; placeholder: string }[] = [
  {
    id: 'trap',
    question: 'Which trap almost got you?',
    placeholder: 'e.g. The "only 1% can solve this" post. I wanted to prove I could.',
  },
  {
    id: 'worth',
    question: 'What made a post worth your coins?',
    placeholder: 'e.g. It taught me something I can use today.',
  },
  {
    id: 'limit',
    question: "One limit you'll try this week.",
    placeholder: 'e.g. No scrolling after 10 PM on school nights.',
  },
];
