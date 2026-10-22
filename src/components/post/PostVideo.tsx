import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import type { PostVideo as Clip } from '@/lib/postVideo';

interface PostVideoProps {
  video: Clip;
  onError: () => void;
  /** Where the "Pixabay" credit sits inside the media area. */
  creditClassName?: string;
}

/**
 * Muted, looping stock clip that fills its media area, like reels. Decorative: the post's
 * real content is its text, which stays locked. With reduced motion it shows a still frame.
 */
export function PostVideo({
  video,
  onError,
  creditClassName = 'bottom-2 right-2',
}: PostVideoProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  const still = reduced || !video.url;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (still && !video.poster) onError();
  }, [still, video.poster, onError]);

  // Browsers pause video on hidden pages; carry on when the player comes back to the app.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === 'visible') videoRef.current?.play()?.catch(() => {});
    };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, []);

  const media = cn(
    'h-full w-full object-cover transition-opacity duration-slow',
    shown ? 'opacity-100' : 'opacity-0',
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {still ? (
        video.poster && (
          <img
            src={video.poster}
            alt=""
            className={media}
            onLoad={() => setShown(true)}
            onError={onError}
          />
        )
      ) : (
        <video
          ref={videoRef}
          src={video.url}
          poster={video.poster || undefined}
          className={media}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          // Show the first frame even if the phone blocks autoplay (e.g. low-power mode).
          onLoadedData={() => setShown(true)}
          onError={onError}
        />
      )}
      <span className="absolute inset-0 bg-black/20" />
      <span
        className={cn(
          'absolute rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white/85',
          creditClassName,
        )}
      >
        Video: Pixabay
      </span>
    </div>
  );
}
