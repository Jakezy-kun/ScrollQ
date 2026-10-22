import { handleVideoRequest } from '../src/server/pixabay.js';

/**
 * Vercel Function: GET /api/videos?q=<search words> → a Pixabay clip for a post's background.
 * The key lives only here (Vercel → Settings → Environment Variables → PIXABAY_API_KEY).
 */
export function GET(request: Request): Promise<Response> {
  return handleVideoRequest(new URL(request.url).searchParams, process.env.PIXABAY_API_KEY);
}
