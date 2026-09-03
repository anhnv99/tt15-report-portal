import React, { useState } from 'react';

export interface DonutChartItem {
  label: string;
  value: number;
  color: string;
}

interface SimpleDonutChartProps {
  data: DonutChartItem[];
  size?: number;
  thickness?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

export const SimpleDonutChart: React.FC<SimpleDonutChartProps> = ({
  data,
  size = 200,
  thickness = 26,
  centerTitle,
  centerSubtitle = 'Tổng cộng',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
        Chưa có số liệu phát sinh
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = -90; // Start at 12 o'clock

  const segments = data.map((item, index) => {
    const percentage = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const transform = `rotate(${accumulatedAngle} ${size / 2} ${size / 2})`;
    accumulatedAngle += percentage * 360;

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      transform,
      index,
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Base background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={thickness}
          />

          {/* Slices */}
          {segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            return (
              <circle
                key={seg.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={seg.strokeDasharray}
                transform={seg.transform}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  opacity: hoveredIndex !== null && !isHovered ? 0.55 : 1,
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none',
                }}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {hoveredIndex !== null ? data[hoveredIndex].value : centerTitle || total}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {hoveredIndex !== null ? data[hoveredIndex].label : centerSubtitle}
          </div>
        </div>
      </div>

      {/* Legend List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 150 }}>
        {segments.map((seg) => {
          const isHovered = hoveredIndex === seg.index;
          return (
            <div
              key={seg.index}
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: isHovered ? '#F8FAFC' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: seg.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: isHovered ? '#0F172A' : '#475569', fontWeight: isHovered ? 600 : 500 }}>
                  {seg.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{seg.value}</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>({seg.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
