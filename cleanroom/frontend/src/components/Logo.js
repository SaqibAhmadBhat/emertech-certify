import React from 'react';

export default function Logo({ size = 36 }) {
  return (
    <div className="brand-logo-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="emGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        {/* Hexagon Border */}
        <polygon
          points="24,3 44,14 44,34 24,45 4,34 4,14"
          stroke="url(#emGrad)"
          strokeWidth="2.5"
          fill="#111827"
        />
        {/* Mortarboard / Academic Cap */}
        <path
          d="M24 14L37 20L24 26L11 20L24 14Z"
          fill="url(#emGrad)"
        />
        {/* Cap Base & Tassel */}
        <path
          d="M16 23.5V30C16 33 32 33 32 30V23.5"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Verification Check Badge */}
        <circle cx="34" cy="34" r="7" fill="#10B981" />
        <path
          d="M31 34L33 36L37 32"
          stroke="#0B0F19"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="brand-text-col">
        <span className="brand-name">EMERTECH <span style={{ color: '#38BDF8' }}>CERTIFY</span></span>
        <span className="brand-tagline">Decentralized Academic Trust</span>
      </div>
    </div>
  );
}
