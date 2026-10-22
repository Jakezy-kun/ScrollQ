import { useCallback, useEffect, useState } from 'react';
import type { Post } from '@/engine';
import type { PostVideo as Clip } from '@/lib/postVideo';
import { loadPostVideo } from '@/lib/postVideo';

/**
 * The post's background clip, or null while loading / when there is none.
 * `onError` drops a clip that fails to play, so the skin falls back to its gradient art.
 */
export function usePostVideo(post: Post): { video: Clip | null; onError: () => void } {
  const [state, setState] = useState<{ postId: string; video: Clip | null }>({
    postId: post.id,
    video: null,
  });

  useEffect(() => {
    if (!post.videoQuery) return;
    let current = true;
    void loadPostVideo(post.videoQuery).then((video) => {
      if (current) setState({ postId: post.id, video });
    });
    return () => {
      current = false;
    };
  }, [post.id, post.videoQuery]);

  const onError = useCallback(() => setState({ postId: post.id, video: null }), [post.id]);
  return { video: state.postId === post.id ? state.video : null, onError };
}
