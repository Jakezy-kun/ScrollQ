import type { PostVideo } from '@/server/pixabay';

export type { PostVideo };

/** One request per search per session; posts that share words share the clip. */
const requests = new Map<string, Promise<PostVideo | null>>();
/** Set when the server says videos aren't set up (no key), so we stop asking. */
let switchedOff = false;

function savingData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Background clip for a post's search words, or null to keep the gradient: offline,
 * data saver on, videos not set up, nothing found, or any error. Never throws.
 */
export function loadPostVideo(query: string): Promise<PostVideo | null> {
  if (switchedOff || !navigator.onLine || savingData()) return Promise.resolve(null);
  let request = requests.get(query);
  if (!request) {
    request = fetch(`/api/videos?q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        if (res.status === 503) switchedOff = true;
        if (!res.ok) return null;
        const body = (await res.json()) as { video?: PostVideo | null };
        return body.video ?? null;
      })
      .catch(() => null);
    requests.set(query, request);
  }
  return request;
}

/** Test helper. */
export function resetPostVideos(): void {
  requests.clear();
  switchedOff = false;
}
