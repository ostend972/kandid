export function EmptyJobIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration : paysage romand avec deux fiches d'offre et un soleil"
      className={className}
    >
      <defs>
        {/* Diagonal hatching — mountains */}
        <pattern
          id="kandid-hatch"
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(135)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.9" />
        </pattern>

        {/* Dot grid — sun */}
        <pattern
          id="kandid-dots"
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2.5" cy="2.5" r="0.7" fill="currentColor" />
        </pattern>

        {/* Fine grain overlay */}
        <filter id="kandid-grain" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="7" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.22 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>

        {/* Mask: dots inside sun only */}
        <mask id="kandid-sun-mask">
          <circle cx="190" cy="54" r="24" fill="white" />
        </mask>

        {/* Mask: hatch inside mountain silhouette only */}
        <mask id="kandid-mount-mask">
          <path
            d="M0 140 L38 92 L74 118 L112 74 L158 116 L198 86 L240 128 L240 170 L0 170 Z"
            fill="white"
          />
        </mask>
      </defs>

      {/* Horizon baseline */}
      <line
        x1="8"
        y1="140"
        x2="232"
        y2="140"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />

      {/* Sun — hollow circle with dot fill */}
      <g>
        <circle
          cx="190"
          cy="54"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <g mask="url(#kandid-sun-mask)" style={{ color: 'currentColor' }}>
          <rect x="166" y="30" width="48" height="48" fill="url(#kandid-dots)" opacity="0.7" />
        </g>
      </g>

      {/* Faint sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="190"
          y1="54"
          x2="190"
          y2="22"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
          transform={`rotate(${deg} 190 54)`}
          strokeDasharray="2 4"
        />
      ))}

      {/* Mountain silhouette — hatched */}
      <g mask="url(#kandid-mount-mask)" style={{ color: 'currentColor' }}>
        <rect x="0" y="70" width="240" height="100" fill="url(#kandid-hatch)" opacity="0.55" />
      </g>
      <path
        d="M0 140 L38 92 L74 118 L112 74 L158 116 L198 86 L240 128"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />

      {/* Ground — subtle base line */}
      <line
        x1="0"
        y1="170"
        x2="240"
        y2="170"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
      />

      {/* Card A — back, tilted left */}
      <g transform="rotate(-6 68 110)">
        <rect
          x="30"
          y="80"
          width="76"
          height="96"
          rx="7"
          fill="var(--background, white)"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Dot-pattern band on back card */}
        <rect
          x="38"
          y="88"
          width="60"
          height="14"
          fill="url(#kandid-dots)"
          opacity="0.55"
        />
        {/* Content lines */}
        <line x1="38" y1="114" x2="98" y2="114" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <line x1="38" y1="122" x2="88" y2="122" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <line x1="38" y1="130" x2="94" y2="130" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <line x1="38" y1="138" x2="78" y2="138" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        {/* Small CTA pill */}
        <rect
          x="38"
          y="152"
          width="36"
          height="12"
          rx="6"
          fill="currentColor"
          opacity="0.85"
        />
      </g>

      {/* Card B — front, tilted right, with match circle */}
      <g transform="rotate(4 148 116)">
        <rect
          x="110"
          y="90"
          width="84"
          height="104"
          rx="7"
          fill="var(--background, white)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        {/* Title lines */}
        <line x1="120" y1="104" x2="176" y2="104" stroke="currentColor" strokeWidth="1.4" />
        <line x1="120" y1="112" x2="162" y2="112" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
        {/* Body lines */}
        <line x1="120" y1="128" x2="182" y2="128" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <line x1="120" y1="136" x2="172" y2="136" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <line x1="120" y1="144" x2="178" y2="144" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />

        {/* Match circle — progress arc */}
        <g transform="translate(152 170)">
          <circle cx="0" cy="0" r="14" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
          <circle
            cx="0"
            cy="0"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="88"
            strokeDashoffset="26"
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="currentColor"
            style={{ fontFamily: 'inherit' }}
          >
            72
          </text>
        </g>
      </g>

      {/* Grain overlay */}
      <rect
        x="0"
        y="0"
        width="240"
        height="200"
        fill="currentColor"
        filter="url(#kandid-grain)"
        pointerEvents="none"
      />
    </svg>
  );
}
