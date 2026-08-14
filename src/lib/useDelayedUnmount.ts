import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an element mounted for the length of its exit animation.
 *
 * CSS can animate anything on the way in, but not on the way out: once React
 * removes a node there is nothing left to animate. This holds the node in the
 * tree for `exitMs` and flags it as closing, so a stylesheet rule can play the
 * exit before it goes.
 */
export function useDelayedUnmount(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => window.clearTimeout(timer.current);
  }, [open, mounted, exitMs]);

  return { mounted, closing };
}
