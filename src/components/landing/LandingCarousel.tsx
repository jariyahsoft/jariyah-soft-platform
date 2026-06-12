'use client';

import { useEffect, useRef, useState } from 'react';

interface LandingCarouselProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingCarousel({ children, className = '' }: LandingCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let frame = 0;
    const scrollSpeed = 0.6;

    const tick = () => {
      if (!paused) {
        viewport.scrollLeft += scrollSpeed;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 1;
        if (viewport.scrollLeft >= maxScroll) {
          viewport.scrollLeft = 0;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [paused]);

  return (
    <div
      ref={viewportRef}
      className={`overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex gap-5 pr-6 min-w-max">{children}</div>
    </div>
  );
}
