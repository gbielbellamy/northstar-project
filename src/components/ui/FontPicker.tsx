import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FONTS, type FontChoice } from '../../types';

/** The CSS stack each choice maps to, mirrored from index.css for the preview. */
const STACK: Record<FontChoice, string> = {
  System: "system-ui, 'Segoe UI', Roboto, sans-serif",
  Inter: "'Inter Variable', system-ui, sans-serif",
  Manrope: "'Manrope Variable', system-ui, sans-serif",
  'Plus Jakarta Sans': "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  Figtree: "'Figtree Variable', system-ui, sans-serif",
  'Space Grotesk': "'Space Grotesk Variable', system-ui, sans-serif",
};

/** One-line description of each typeface. */
const NOTE: Record<FontChoice, string> = {
  System:
    'Whatever your OS uses. Fastest, and invisible in a good way — but it looks different on every machine, so a recruiter may not see what you see.',
  Inter:
    'The default of modern dashboards — Linear, GitHub, Figma. Neutral, superb at small sizes, excellent numbers. The safe, professional choice.',
  Manrope:
    'Geometric and a little rounder. Slightly more character than Inter without getting in the way. Good if you want warmth.',
  'Plus Jakarta Sans':
    'Friendly geometric shapes with wide apertures. Reads well in headings and gives the app a modern SaaS feel.',
  Figtree:
    'Clean and quietly distinctive, with a touch of humanism. Sits between Inter and Manrope.',
  'Space Grotesk':
    'Technical, slightly quirky, with unusual letterforms. The most memorable of the six — and the most opinionated, so it can tire the eye in dense tables.',
};

/** Sets the choice on <html>, and previews each option in its own typeface. */
function FontPicker() {
  const font = useStore((s) => s.settings.font);
  const setSettings = useStore((s) => s.setSettings);

  const active: FontChoice = FONTS.includes(font) ? font : 'System';

  useEffect(() => {
    const root = document.documentElement;
    if (active === 'System') root.removeAttribute('data-font');
    else root.setAttribute('data-font', active);
  }, [active]);

  return (
    <div className="font-grid">
      {FONTS.map((f) => {
        const selected = f === active;
        return (
          <button
            key={f}
            type="button"
            className={`font-card ${selected ? 'font-card--on' : ''}`.trim()}
            style={{ fontFamily: STACK[f] }}
            onClick={() => setSettings({ font: f })}
            aria-pressed={selected}
          >
            <div className="font-card__head">
              <span className="font-card__name">{f}</span>
              {selected && (
                <span className="font-card__tick">
                  <Check size={13} /> In use
                </span>
              )}
            </div>

            <div className="font-card__display">Northstar</div>
            <div className="font-card__body">
              It’s your path, and yours alone. Others may walk it with you.
            </div>
            <div className="font-card__nums">0123456789 · 40h · 27 Jul – 2 Aug · 15%</div>
            <div className="font-card__alpha">ABCDEFGHIJKLM abcdefghijklm</div>

            <p className="font-card__note">{NOTE[f]}</p>
          </button>
        );
      })}
    </div>
  );
}

export default FontPicker;
