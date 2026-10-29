import React, { useState } from 'react';

export function ResponsiveLineChart({ data = [], xKey = 'period', yKey = 'sales', yKey2 = null, height = 240, strokeColor = '#1E3A5F', strokeColor2 = '#10B981', title = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No chart data available</div>;
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const values2 = yKey2 ? data.map(d => Number(d[yKey2]) || 0) : [];
  const allValues = [...values, ...values2];
  
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 100) * 1.15;
  const range = maxVal - minVal || 1;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getPoints = (vals) => {
    return vals.map((v, i) => {
      const x = paddingX + (i / Math.max(1, vals.length - 1)) * chartW;
      const y = paddingY + chartH - ((v - minVal) / range) * chartH;
      return { x, y, val: v, label: data[i]?.[xKey] };
    });
  };

  const points1 = getPoints(values);
  const points2 = yKey2 ? getPoints(values2) : null;

  const pathD1 = points1.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const areaD1 = `${pathD1} L ${points1[points1.length - 1].x} ${paddingY + chartH} L ${points1[0].x} ${paddingY + chartH} Z`;

  const pathD2 = points2 ? points2.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '') : '';

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h4>}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`grad1-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + chartH * pct;
            return (
              <line 
                key={i} 
                x1={paddingX} 
                y1={y} 
                x2={width - paddingX} 
                y2={y} 
                stroke="#E5E7EB" 
                strokeDasharray="4 4" 
                className="stroke-gray-200 dark:stroke-gray-700/50" 
              />
            );
          })}

          {/* Area under curve */}
          <path d={areaD1} fill={`url(#grad1-${title.replace(/\s+/g, '')})`} />

          {/* Line 1 */}
          <path d={pathD1} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Line 2 (optional) */}
          {points2 && (
            <path d={pathD2} fill="none" stroke={strokeColor2} strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
          )}

          {/* Points */}
          {points1.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 4}
                fill={hoveredIdx === i ? strokeColor : "#FFFFFF"}
                stroke={strokeColor}
                strokeWidth="2.5"
                className="transition-all"
              />
              {/* X Axis Labels */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 dark:fill-gray-400 font-medium"
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Tooltip */}
          {hoveredIdx !== null && points1[hoveredIdx] && (
            <g>
              <rect
                x={Math.min(width - 100, Math.max(10, points1[hoveredIdx].x - 45))}
                y={Math.max(5, points1[hoveredIdx].y - 35)}
                width="90"
                height="24"
                rx="4"
                className="fill-gray-900 dark:fill-gray-800 text-white"
              />
              <text
                x={Math.min(width - 55, Math.max(55, points1[hoveredIdx].x))}
                y={Math.max(21, points1[hoveredIdx].y - 19)}
                textAnchor="middle"
                className="fill-white text-[11px] font-semibold"
              >
                {points1[hoveredIdx].val.toLocaleString()}
              </text>
            </g>
          )}
        </svg>
      </div>

      {yKey2 && (
        <div className="flex items-center justify-end gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ backgroundColor: strokeColor }}></span>
            <span>Actual / Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: strokeColor2 }}></span>
            <span>Target / Baseline</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResponsiveBarChart({ data = [], xKey = 'name', yKey = 'count', height = 240, barColor = '#1E3A5F', title = '' }) {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No chart data available</div>;
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1) * 1.15;

  const width = 550;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;
  const barWidth = Math.min(36, (chartW / data.length) * 0.6);

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h4>}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + chartH * pct;
            return (
              <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700/50" />
            );
          })}

          {data.map((d, i) => {
            const val = Number(d[yKey]) || 0;
            const h = (val / maxVal) * chartH;
            const x = paddingX + (i + 0.5) * (chartW / data.length) - barWidth / 2;
            const y = paddingY + chartH - h;

            return (
              <g key={i} className="group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, h)}
                  rx="4"
                  fill={d.color || barColor}
                  className="transition-all opacity-90 hover:opacity-100 hover:brightness-110"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600 dark:fill-gray-300 font-semibold"
                >
                  {val.toLocaleString()}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-500 dark:fill-gray-400 font-medium truncate"
                >
                  {String(d[xKey]).length > 10 ? String(d[xKey]).substring(0, 9) + '…' : d[xKey]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function ResponsiveDonutChart({ data = [], valueKey = 'count', labelKey = 'status', title = '', centerLabel = 'Total' }) {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data available</div>;
  }

  const total = data.reduce((acc, cur) => acc + (Number(cur[valueKey]) || 0), 0) || 1;
  const colors = ['#10B981', '#F59E0B', '#EF4444', '#1E3A5F', '#8B5CF6', '#3B82F6', '#EC4899'];

  let cumulativeAngle = 0;
  const slices = data.map((item, idx) => {
    const val = Number(item[valueKey]) || 0;
    const fraction = val / total;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const r = 60;
    const x1 = 90 + r * Math.cos(startRad);
    const y1 = 90 + r * Math.sin(startRad);
    const x2 = 90 + r * Math.cos(endRad);
    const y2 = 90 + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathD = angle >= 359.9
      ? `M 90 30 A 60 60 0 1 1 89.9 30 Z`
      : `M 90 90 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      color: item.color || colors[idx % colors.length],
      pathD,
      val,
      percentage: Math.round(fraction * 100)
    };
  });

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h4>}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.pathD}
                fill={slice.color}
                className="hover:opacity-90 transition-opacity"
              />
            ))}
            {/* Cut out center to make donut */}
            <circle cx="90" cy="90" r="38" className="fill-white dark:fill-darkbg-card" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 w-full max-w-xs text-xs">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                <span className="truncate">{slice[labelKey]}</span>
              </div>
              <div className="font-semibold shrink-0 ml-2">
                <span>{slice.val}</span>
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({slice.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModelComparisonBarChart({ data = [], height = 240 }) {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No comparison data</div>;
  }

  const width = 500;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;
  const groupW = chartW / data.length;
  const barW = Math.min(28, groupW * 0.35);

  const maxVal = Math.max(...data.flatMap(d => [d.linear_regression || 0, d.random_forest || 0]), 100) * 1.15;

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + chartH * pct;
            return <line key={i} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700/50" />;
          })}

          {data.map((d, i) => {
            const lrVal = Number(d.linear_regression) || 0;
            const rfVal = Number(d.random_forest) || 0;

            const lrH = (lrVal / maxVal) * chartH;
            const rfH = (rfVal / maxVal) * chartH;

            const groupCenterX = paddingX + (i + 0.5) * groupW;
            const lrX = groupCenterX - barW - 2;
            const rfX = groupCenterX + 2;

            const lrY = paddingY + chartH - lrH;
            const rfY = paddingY + chartH - rfH;

            return (
              <g key={i}>
                {/* Linear Regression Bar */}
                <rect x={lrX} y={lrY} width={barW} height={Math.max(2, lrH)} rx="3" fill="#1E3A5F" />
                <text x={lrX + barW / 2} y={lrY - 5} textAnchor="middle" className="text-[9px] fill-gray-600 dark:fill-gray-300 font-semibold">
                  {lrVal}
                </text>

                {/* Random Forest Bar */}
                <rect x={rfX} y={rfY} width={barW} height={Math.max(2, rfH)} rx="3" fill="#10B981" />
                <text x={rfX + barW / 2} y={rfY - 5} textAnchor="middle" className="text-[9px] fill-emerald-600 dark:fill-emerald-400 font-bold">
                  {rfVal}
                </text>

                {/* Metric label */}
                <text x={groupCenterX} y={height - 8} textAnchor="middle" className="text-[10px] fill-gray-600 dark:fill-gray-300 font-medium">
                  {d.metric}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-2 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-navy"></span>
          <span className="text-gray-700 dark:text-gray-300">Simple Linear Regression</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
          <span className="text-gray-700 dark:text-gray-300">Random Forest Regressor</span>
        </div>
      </div>
    </div>
  );
}

