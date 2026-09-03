import React from 'react';

interface RegOneBrandProps {
  collapsed?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dark' | 'light';
  onClick?: () => void;
}

export const RegOneBrand: React.FC<RegOneBrandProps> = ({
  collapsed = false,
  size = 'medium',
  variant = 'dark',
  onClick,
}) => {
  const isDark = variant === 'dark';
  const badgeSize = size === 'small' ? 32 : size === 'large' ? 46 : 38;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 12,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Crisp Vector App Icon Squircle */}
      <svg
        width={badgeSize}
        height={badgeSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          flexShrink: 0,
          filter: isDark
            ? 'drop-shadow(0 2px 6px rgba(14, 165, 233, 0.3))'
            : 'drop-shadow(0 2px 4px rgba(11, 42, 107, 0.15))',
        }}
      >
        <defs>
          <linearGradient id="regone-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#07193F" />
            <stop offset="100%" stopColor="#0B2A6B" />
          </linearGradient>
          <linearGradient id="regone-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E63FF" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="regone-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#08B5FF" />
            <stop offset="100%" stopColor="#67E8FF" />
          </linearGradient>
        </defs>

        {/* Squircle Base */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="22"
          fill="url(#regone-bg)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.5"
        />

        {/* Document Stem & Upper Loop (Letter 'R') */}
        <path
          d="M 27 20
             C 21 20 17 24 17 30
             L 17 70
             C 17 76 21 80 27 80
             L 34 80
             C 36 80 38 78 38 75
             L 38 72
             C 38 70 36 68 34 68
             L 27 68
             C 26 68 25 67 25 66
             L 25 30
             C 25 29 26 28 27 28
             L 57 28
             C 65 28 71 33 71 41
             C 71 49 65 54 57 54
             L 34 54
             C 31 54 29 56 29 59
             L 29 61
             C 29 64 31 66 34 66
             L 57 66
             C 71 66 82 55 82 41
             C 82 27 71 20 57 20
             Z"
          fill="url(#regone-blue)"
        />

        {/* Document Horizontal Inner Lines */}
        <rect x="33" y="35" width="22" height="5.5" rx="2.75" fill="#38BDF8" opacity="0.95" />
        <rect x="33" y="44" width="15" height="5.5" rx="2.75" fill="#38BDF8" opacity="0.8" />

        {/* Compliance Checkmark (Leg of 'R') */}
        <path
          d="M 33 55
             C 30 52 26 52 24 55
             C 21 57 21 61 24 64
             L 43 83
             C 45 85 49 85 51 83
             L 86 45
             C 88 42 88 38 86 36
             C 83 33 79 33 76 36
             L 47 68
             Z"
          fill="url(#regone-cyan)"
        />
      </svg>

      {/* Brand Text Block */}
      {!collapsed && (
        <div style={{ lineHeight: 1.15, overflow: 'hidden' }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20,
              letterSpacing: '-0.4px',
              display: 'flex',
              alignItems: 'baseline',
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <span style={{ color: isDark ? '#FFFFFF' : '#0B2A6B' }}>Reg</span>
            <span
              style={{
                marginLeft: 1,
                background: 'linear-gradient(135deg, #08B5FF 0%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 900,
              }}
            >
              One
            </span>
          </div>

          <div
            style={{
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              textTransform: 'none',
              marginTop: 2,
            }}
          >
            One platform for regulatory reporting
          </div>
        </div>
      )}
    </div>
  );
};
