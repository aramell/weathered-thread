"use client";

import { useEffect, useRef } from "react";

type VideoLoopProps = {
  src: string;
  poster: string;
  /** Describes the clip for screen readers; the video has no audio worth hearing. */
  label: string;
  className?: string;
};

/**
 * video-loop — a short, silent, looping clip used like a moving photo (not a player).
 * Autoplays muted and inline (required for mobile autoplay). People who prefer reduced
 * motion, or browsers that block autoplay, just see the poster frame.
 */
export default function VideoLoop({ src, poster, label, className }: VideoLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (reduce.matches) {
        video.pause();
        video.currentTime = 0;
      } else {
        video.play().catch(() => {});
      }
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
