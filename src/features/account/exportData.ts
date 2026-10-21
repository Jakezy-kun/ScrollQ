import type { DataRepository } from '@/lib/repository/types';

/** Build the "Download my data" JSON: profile, rounds and reflections. */
export async function buildExport(repo: DataRepository, email: string) {
  const [profile, rounds] = await Promise.all([repo.getProfile(), repo.listRounds()]);
  return {
    app: 'ScrollQ',
    version: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    account: { email },
    profile,
    rounds,
  };
}

/** Save JSON as a file in the browser. */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
