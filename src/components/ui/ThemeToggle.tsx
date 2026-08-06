import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Theme } from '../../types';

const ICON = { light: Sun, dark: Moon } as const;
const LABEL = { light: 'Light', dark: 'Dark' } as const;

/**
 * Two states only, sun and moon — no "system" option in the UI. On first
 * load, before you've ever clicked it, the icon reflects the browser's own
 * preference (and stays live if the OS theme changes underneath you). The
 * moment you click, that resolves to an explicit light/dark choice and the
 * button toggles strictly between the two from then on.
 */
function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' =
    theme === 'light' || theme === 'dark' ? theme : systemPrefersDark ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    // Still on the browser default: leave the attribute unset so the CSS
    // media query keeps driving it live, rather than pinning today's value.
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
  }, [theme]);

  const next: Theme = resolved === 'light' ? 'dark' : 'light';
  const Icon = ICON[resolved];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setSettings({ theme: next })}
      title={`Theme: ${LABEL[resolved]} — click for ${LABEL[next].toLowerCase()}`}
      aria-label={`Theme: ${LABEL[resolved]}. Switch to ${LABEL[next]}.`}
    >
      <Icon size={19} />
    </button>
  );
}

export default ThemeToggle;
