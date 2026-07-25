import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* Typefaces to choose between, bundled rather than fetched from a CDN so the
   app renders correctly offline and nothing about you leaks to a third party.
   Variable fonts: one file each, every weight. */
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/figtree';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
