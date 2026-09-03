import React, { useState } from 'react';

export interface AreaChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface SimpleAreaChartProps {
  data: AreaChartPoint[];
  height?: number;
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  valueUnit?: string;
  title?: string;
}

export const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({
  data,
  height = 200,
  lineColor = '#003B95',
  gradientFrom = 'rgba(0, 59, 149, 0.35)',
  gradientTo = 'rgba(0, 59, 149, 0.02)',
  valueUnit = 'bản ghi',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
        Chưa có số liệu xu hướng
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value || 0), 10);
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;
  const svgWidth = 550;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  // Generate smooth SVG Path using bezier curves
  const linePath = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const controlPointX1 = prev.x + (point.x - prev.x) / 2;
    const controlPointY1 = prev.y;
    const controlPointX2 = prev.x + (point.x - prev.x) / 2;
    const controlPointY2 = point.y;
    return `${acc} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${point.x} ${point.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const yTicks = [0, Math.round(maxValue * 0.5), maxValue];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${svgWidth} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={i === 0 ? 'none' : '3 3'}
                strokeWidth={1}
              />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#94A3B8">
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Main Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Points and interaction */}
        {points.map((pt, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible touch target */}
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

              {/* Outer halo on hover */}
              {isHovered && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={8}
                  fill={lineColor}
                  opacity={0.25}
                />
              )}

              {/* Point circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5 : 3.5}
                fill="#FFFFFF"
                stroke={lineColor}
                strokeWidth={2.5}
              />

              {/* X label */}
              <text
                x={pt.x}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isHovered ? 700 : 500}
                fill={isHovered ? '#003B95' : '#64748B'}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            padding: '5px 10px',
            borderRadius: 6,
            fontSize: 12,
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: '#93C5FD' }}>{points[hoveredIdx].label}</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
            {points[hoveredIdx].value.toLocaleString()} {valueUnit}
          </div>
        </div>
      )}
    </div>
  );
};
