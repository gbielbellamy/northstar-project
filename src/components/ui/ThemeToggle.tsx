import { useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { THEMES, type Theme } from '../../types';

const ICON: Record<Theme, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const NEXT: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const LABEL: Record<Theme, string> = {
  system: 'Following your system',
  light: 'Light',
  dark: 'Dark',
};

/**
 * Cycles system → light → dark. Writes `data-theme` on <html>, which the
 * stylesheet reads; "system" removes the attribute and lets the media query win.
 */
function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  const safe: Theme = THEMES.includes(theme) ? theme : 'system';
  const Icon = ICON[safe];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setSettings({ theme: NEXT[safe] })}
      title={`Theme: ${LABEL[safe]} — click for ${LABEL[NEXT[safe]].toLowerCase()}`}
      aria-label={`Theme: ${LABEL[safe]}. Switch to ${LABEL[NEXT[safe]]}.`}
    >
      <Icon size={19} />
    </button>
  );
}

export default ThemeToggle;
