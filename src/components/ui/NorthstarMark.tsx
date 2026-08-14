type Props = { size?: number; className?: string };

/** Four-point star inside a compass ring, with a longer north point. */
function NorthstarMark({ size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Northstar"
    >
      {/* compass ring */}
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="1.6" opacity="0.32" />
      {/* the cardinal tick at north, so the ring reads as a compass */}
      <path d="M16 1.2v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* four-point star, north point drawn longer */}
      <path
        d="M16 5.2c.9 5.2 2.1 7.4 6.6 8.9-4.5 1-6 3-6.6 8.7-.7-5.7-2.2-7.7-6.6-8.7 4.5-1.5 5.7-3.7 6.6-8.9Z"
        fill="currentColor"
      />
      {/* the trailing point, giving it direction rather than symmetry */}
      <path
        d="M16 22.8c.4 3.3 1.1 4.8 3.4 5.8-2.3.5-3 1.6-3.4 4-.4-2.4-1.1-3.5-3.4-4 2.3-1 3-2.5 3.4-5.8Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

export default NorthstarMark;
