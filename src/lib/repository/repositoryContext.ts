import { createContext, useContext } from 'react';
import { LocalRepository } from './LocalRepository';
import type { DataRepository } from './types';

/** Shared guest repository. RepositoryProvider swaps in Supabase for signed-in players. */
export const localRepository = new LocalRepository();

export const RepositoryContext = createContext<DataRepository>(localRepository);

export function useRepository(): DataRepository {
  return useContext(RepositoryContext);
}
