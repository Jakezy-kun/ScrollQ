import { create } from 'zustand';

/** Bumped whenever saved data changes outside a screen (migration, sync). Screens refetch. */
export const useDataRevision = create<{ revision: number; bump: () => void }>()((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 })),
}));
