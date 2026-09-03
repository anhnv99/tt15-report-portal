import React, { useState } from 'react';

export interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  labelTooltip?: string;
}

interface SimpleBarChartProps {
  data: BarChartItem[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryName?: string;
  secondaryName?: string;
  valueUnit?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  height = 240,
  primaryColor = '#003B95',
  secondaryColor = '#10B981',
  primaryName = 'Hợp Lệ',
  secondaryName = 'Lỗi / Cảnh Báo',
  valueUnit = 'dòng',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
        Không có dữ liệu hiển thị
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.value || 0, d.secondaryValue || 0, 10)),
    10
  );

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const svgWidth = 550;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const barWidth = Math.min(hasSecondary ? barGroupWidth * 0.32 : barGroupWidth * 0.55, 34);

  // Y-axis grid lines (4 intervals)
  const yTicks = [0, Math.round(maxValue * 0.33), Math.round(maxValue * 0.66), maxValue];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 8, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: primaryColor }} />
          <span style={{ color: '#475569', fontWeight: 500 }}>{primaryName}</span>
        </div>
        {hasSecondary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: secondaryColor }} />
            <span style={{ color: '#475569', fontWeight: 500 }}>{secondaryName}</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={1} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="barGradientSecondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity={1} />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.75} />
          </linearGradient>
        </defs>

        {/* Gridlines & Y-axis labels */}
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
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#94A3B8"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const groupCenterX = paddingLeft + idx * barGroupWidth + barGroupWidth / 2;
          const isHovered = hoveredIdx === idx;

          const primaryHeight = (item.value / maxValue) * chartHeight;
          const primaryY = paddingTop + chartHeight - primaryHeight;
          const primaryX = hasSecondary ? groupCenterX - barWidth - 3 : groupCenterX - barWidth / 2;

          let secondaryHeight = 0;
          let secondaryY = 0;
          let secondaryX = 0;

          if (hasSecondary && item.secondaryValue !== undefined) {
            secondaryHeight = (item.secondaryValue / maxValue) * chartHeight;
            secondaryY = paddingTop + chartHeight - secondaryHeight;
            secondaryX = groupCenterX + 3;
          }

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Highlight background on hover */}
              {isHovered && (
                <rect
                  x={paddingLeft + idx * barGroupWidth + 4}
                  y={paddingTop}
                  width={barGroupWidth - 8}
                  height={chartHeight}
                  fill="#F1F5F9"
                  rx={4}
                  opacity={0.7}
                />
              )}

              {/* Primary Bar */}
              <rect
                x={primaryX}
                y={primaryY}
                width={barWidth}
                height={Math.max(primaryHeight, 2)}
                fill="url(#barGradientPrimary)"
                rx={3}
                style={{
                  transition: 'all 0.25s ease',
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                  opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1,
                }}
              />

              {/* Secondary Bar */}
              {hasSecondary && item.secondaryValue !== undefined && (
                <rect
                  x={secondaryX}
                  y={secondaryY}
                  width={barWidth}
                  height={Math.max(secondaryHeight, 2)}
                  fill="url(#barGradientSecondary)"
                  rx={3}
                  style={{
                    transition: 'all 0.25s ease',
                    filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                    opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1,
                  }}
                />
              )}

              {/* Value Label above primary bar */}
              {item.value > 0 && (
                <text
                  x={hasSecondary ? primaryX + barWidth / 2 : groupCenterX}
                  y={primaryY - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={isHovered ? primaryColor : '#64748B'}
                >
                  {item.value}
                </text>
              )}

              {/* X-axis Label */}
              <text
                x={groupCenterX}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isHovered ? 700 : 500}
                fill={isHovered ? '#003B95' : '#475569'}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${((paddingLeft + hoveredIdx * barGroupWidth + barGroupWidth / 2) / svgWidth) * 100}%`,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 2, marginBottom: 4 }}>
            {data[hoveredIdx].labelTooltip || `Biểu mẫu ${data[hoveredIdx].label}`}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: '#93C5FD' }}>{primaryName}:</span>
            <span style={{ fontWeight: 700 }}>{data[hoveredIdx].value} {valueUnit}</span>
          </div>
          {hasSecondary && data[hoveredIdx].secondaryValue !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
              <span style={{ color: '#FCA5A5' }}>{secondaryName}:</span>
              <span style={{ fontWeight: 700 }}>{data[hoveredIdx].secondaryValue} {valueUnit}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
