'use client';

import { useEffect, useRef, useState } from 'react';

interface LandingCounterProps {
  value: number;
  suffix?: string;
  locale: 'th' | 'en';
}

function animateNumber(from: number, to: number, onUpdate: (value: number) => void) {
  const duration = 1200;
  const start = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const next = Math.round(from + (to - from) * easeOut);
    onUpdate(next);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

export function LandingCounter({ value, suffix = '', locale }: LandingCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          animateNumber(0, value, setDisplayValue);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US').format(displayValue)}
      {suffix}
    </span>
  );
}
