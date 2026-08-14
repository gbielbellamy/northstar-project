import {
  siAnthropic,
  siBootstrap,
  siClaude,
  siCss,
  siCssmodules,
  siCursor,
  siDocker,
  siExpo,
  siExpress,
  siFigma,
  siGit,
  siGithub,
  siGnubash,
  siGooglechrome,
  siHtml5,
  siJavascript,
  siMarkdown,
  siNetlify,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siReact,
  siRedux,
  siRender,
  siTailwindcss,
  siTypescript,
  siVercel,
  siVite,
  siVitest,
} from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

type Props = {
  /** simple-icons slug, or the name of a file in assets/logos. */
  icon: string;
  /** Two-letter fallback when there's no logo for the brand. */
  badge: string;
  /** Overrides the brand colour when set. */
  colour?: string;
  size?: number;
};

/**
 * Named imports, not a namespace import: simple-icons ships 3,400+ icons and
 * importing the module wholesale added 5MB of unused paths to the bundle.
 * A new technology has to be added here too.
 */
const BRAND: Record<string, SimpleIcon> = {
  anthropic: siAnthropic,
  bootstrap: siBootstrap,
  claude: siClaude,
  css: siCss,
  cssmodules: siCssmodules,
  cursor: siCursor,
  docker: siDocker,
  expo: siExpo,
  express: siExpress,
  figma: siFigma,
  git: siGit,
  github: siGithub,
  gnubash: siGnubash,
  googlechrome: siGooglechrome,
  html5: siHtml5,
  javascript: siJavascript,
  markdown: siMarkdown,
  netlify: siNetlify,
  nextdotjs: siNextdotjs,
  nodedotjs: siNodedotjs,
  postgresql: siPostgresql,
  react: siReact,
  redux: siRedux,
  render: siRender,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
  vercel: siVercel,
  vite: siVite,
  vitest: siVitest,
};

/**
 * Local logos for brands simple-icons does not carry. A file in assets/logos
 * named after the slug takes precedence.
 */
const LOCAL: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../assets/logos/*.{svg,png,jpg,jpeg,webp}', {
      eager: true,
      query: '?url',
      import: 'default',
    }) as Record<string, string>,
  ).map(([path, url]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), url]),
);

function SkillIcon({ icon, badge, colour, size = 38 }: Props) {
  const local = LOCAL[icon];
  const brand = local ? undefined : BRAND[icon];
  const hue = colour || (brand ? `#${brand.hex}` : '#8b5cf6');

  return (
    <span
      className={`tech-badge ${local ? 'tech-badge--image' : ''}`.trim()}
      style={{ ['--tech' as string]: hue, width: size, height: size }}
    >
      {local ? (
        // A PNG or JPEG brings its own colours and background, so it fills the
        // tile rather than sitting on a tint.
        <img src={local} alt="" width={size} height={size} />
      ) : brand ? (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.52}
          height={size * 0.52}
          fill="currentColor"
          aria-hidden
        >
          <path d={brand.path} />
        </svg>
      ) : (
        <span className="tech-badge__text">{badge}</span>
      )}
    </span>
  );
}

export default SkillIcon;
