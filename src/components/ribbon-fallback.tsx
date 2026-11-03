export function RibbonFallback() {
  return (
    <svg
      className="thread-fallback"
      viewBox="0 0 1440 900"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="paper-ribbon" x1="0" x2="1" y1="0.15" y2="0.86">
          <stop offset="0" stopColor="#741426" />
          <stop offset="0.42" stopColor="#b52a3d" />
          <stop offset="0.7" stopColor="#e66f76" />
          <stop offset="1" stopColor="#8d172a" />
        </linearGradient>
      </defs>
      <path d="M-130 250C126 84 301 458 565 296s338-9 501 54c125 48 202-18 372-125l67 112c-196 127-335 237-500 150-172-90-232-130-402-3S146 283-130 413Z" fill="url(#paper-ribbon)" />
      <path d="M1083 570c88-83 169-20 180 32 11-52 92-115 180-32-11 118-91 138-180 64-89 74-169 54-180-64Z" fill="url(#paper-ribbon)" opacity="0.95" />
    </svg>
  );
}
