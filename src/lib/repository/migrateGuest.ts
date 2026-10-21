import type { DataRepository } from './types';

/**
 * Move a guest's device rounds into their account, then clear the device copy.
 * Uploads are upserts by id, so running this twice never duplicates a round. If the
 * connection is down, rounds wait in the sync queue; the device copy is only cleared
 * once every round is saved or queued.
 */
export async function migrateGuestRounds(
  local: DataRepository,
  remote: DataRepository,
): Promise<number> {
  const rounds = await local.listRounds();
  for (const round of rounds) await remote.saveRound(round);
  await local.clearRounds();
  return rounds.length;
}
