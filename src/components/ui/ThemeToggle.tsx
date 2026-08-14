import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Theme } from '../../types';

const ICON = { light: Sun, dark: Moon } as const;
const LABEL = { light: 'Light', dark: 'Dark' } as const;

/**
 * Sun/moon toggle, with no "system" option in the UI.
 *
 * Until it is clicked the icon follows the browser preference and updates if
 * the OS theme changes. The first click pins an explicit light or dark choice.
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
    // No explicit choice yet: leave the attribute unset so the CSS media
    // query keeps driving the theme.
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
