import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an element mounted for the length of its exit animation.
 *
 * CSS cannot animate an unmounted node, so this keeps it in the tree for
 * `exitMs` and sets `closing`, which the stylesheet uses to play the exit.
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
