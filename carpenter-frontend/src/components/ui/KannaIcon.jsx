/**
 * Brand logo based on the hand-plane + wood-curl mark.
 * Used in navbar, footer, and preloader.
 */
const KannaIcon = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 220 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`kanna-icon ${className}`}
  >
    <defs>
      <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g filter="url(#logoGlow)" stroke="#D8B08C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer main curl */}
      <path d="M184 120 C210 100 213 54 185 26 C162 4 128 6 114 31 C101 54 118 74 136 68 C150 64 154 48 143 41 C136 37 128 40 127 48" />

      {/* Hand plane base */}
      <path d="M26 96 H132 V106 H26 Z" />

      {/* Plane body */}
      <path d="M40 94 C55 89 67 73 78 58" />
      <path d="M78 58 L116 58" />
      <path d="M90 94 C95 79 108 67 123 63" />
      <path d="M123 63 C114 77 112 88 122 94" />

      {/* Blade + slot */}
      <path d="M82 94 L82 67" />
      <path d="M88 94 L88 67" />
      <path d="M84 82 L95 71" />

      {/* Decorative inner curls */}
      <path d="M31 94 C22 89 20 79 27 73 C34 67 43 74 41 81 C39 88 30 86 30 80" />
      <path d="M53 85 C46 79 46 70 53 65 C60 60 69 65 69 73 C69 79 62 81 59 77" />
    </g>
  </svg>
)

export default KannaIcon