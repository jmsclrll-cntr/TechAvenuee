import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Utility: smooth cubic bezier path from an array of {x,y} points
// ─────────────────────────────────────────────────────────────────────────────
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const tension = 0.35;
    const cpx1 = prev.x + (curr.x - prev.x) * tension;
    const cpy1 = prev.y;
    const cpx2 = curr.x - (curr.x - prev.x) * tension;
    const cpy2 = curr.y;
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function formatYLabel(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(Math.round(val));
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveLineChart  – smooth curves, Y-axis labels, gradient fill, tooltip
// ─────────────────────────────────────────────────────────────────────────────
export function ResponsiveLineChart({
  data = [],
  xKey = 'period',
  yKey = 'sales',
  yKey2 = null,
  height = 260,
  strokeColor = '#3B82F6',
  strokeColor2 = '#10B981',
  title = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        No chart data available
      </div>
    );
  }

  const values  = data.map(d => Number(d[yKey])  || 0);
  const values2 = yKey2 ? data.map(d => Number(d[yKey2]) || 0) : [];
  const allVals = [...values, ...values2].filter(v => v > 0);

  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 100;
  const pad    = (rawMax - rawMin) * 0.15 || rawMax * 0.15 || 10;
  const minVal = Math.max(0, rawMin - pad);
  const maxVal = rawMax + pad;
  const range  = maxVal - minVal || 1;

  const W        = 620;
  const padLeft  = 56; // room for Y labels
  const padRight = 20;
  const padTop   = 24;
  const padBot   = 32;
  const chartW   = W - padLeft - padRight;
  const chartH   = height - padTop - padBot;
  const gradId1  = `lg1-${title.replace(/\W/g, '')}`;
  const gradId2  = `lg2-${title.replace(/\W/g, '')}`;

  const toXY = (vals) =>
    vals.map((v, i) => ({
      x: padLeft + (i / Math.max(1, vals.length - 1)) * chartW,
      y: padTop  + chartH - ((v - minVal) / range) * chartH,
      val: v,
      label: data[i]?.[xKey] ?? '',
    }));

  const pts1 = toXY(values);
  const pts2 = yKey2 ? toXY(values2) : null;

  const line1  = smoothPath(pts1);
  const area1  = `${line1} L ${pts1[pts1.length - 1].x} ${padTop + chartH} L ${pts1[0].x} ${padTop + chartH} Z`;
  const line2  = pts2 ? smoothPath(pts2) : '';

  // Y-axis tick positions (5 evenly spaced)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y:   padTop + chartH * (1 - pct),
    val: minVal + range * pct,
  }));

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-3">{title}</h4>
      )}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Area gradient – line 1 */}
            <linearGradient id={gradId1} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={strokeColor} stopOpacity="0.30" />
              <stop offset="60%"  stopColor={strokeColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.00" />
            </linearGradient>
            {/* Area gradient – line 2 */}
            {yKey2 && (
              <linearGradient id={gradId2} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={strokeColor2} stopOpacity="0.20" />
                <stop offset="100%" stopColor={strokeColor2} stopOpacity="0.00" />
              </linearGradient>
            )}
            {/* Glow filter for active dot */}
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Y-axis grid lines + labels ─────────────────────────── */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={W - padRight}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray={i === 0 ? 'none' : '4 4'}
                className="text-gray-200 dark:text-gray-700"
                strokeOpacity={i === 0 ? 0.6 : 0.4}
              />
              <text
                x={padLeft - 6}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-600 dark:fill-gray-400 font-semibold"
                style={{ fontSize: 10, fontFamily: 'inherit' }}
              >
                {formatYLabel(tick.val)}
              </text>
            </g>
          ))}

          {/* ── Area fills ─────────────────────────────────────────── */}
          <path d={area1} fill={`url(#${gradId1})`} />

          {/* ── Main line ──────────────────────────────────────────── */}
          <path
            d={line1}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Second line (target/baseline) ──────────────────────── */}
          {pts2 && (
            <path
              d={line2}
              fill="none"
              stroke={strokeColor2}
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}

          {/* ── Data points + hover zone ───────────────────────────── */}
          {pts1.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible wider hover target */}
              <rect
                x={p.x - 14}
                y={padTop}
                width={28}
                height={chartH}
                fill="transparent"
              />

              {/* Vertical indicator on hover */}
              {hoveredIdx === i && (
                <line
                  x1={p.x}
                  y1={padTop}
                  x2={p.x}
                  y2={padTop + chartH}
                  stroke={strokeColor}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              )}

              {/* Dot ring */}
              {hoveredIdx === i && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill={strokeColor}
                  fillOpacity="0.15"
                  filter="url(#dotGlow)"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 5.5 : 3.5}
                fill={hoveredIdx === i ? strokeColor : '#ffffff'}
                stroke={strokeColor}
                strokeWidth="2.2"
                className="transition-all duration-150"
              />

              {/* X-axis label */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-700 dark:fill-gray-300 font-bold"
                style={{ fontSize: 10.5, fontFamily: 'inherit', fontWeight: 600 }}
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* ── Tooltip ────────────────────────────────────────────── */}
          {hoveredIdx !== null && pts1[hoveredIdx] && (() => {
            const p  = pts1[hoveredIdx];
            const p2 = pts2?.[hoveredIdx];
            const tw = p2 ? 130 : 108;
            const th = p2 ? 46  : 28;
            const tx = Math.min(W - padRight - tw - 4, Math.max(padLeft + 4, p.x - tw / 2));
            const ty = Math.max(padTop + 4, p.y - th - 12);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={tx} y={ty} width={tw} height={th} rx={6}
                  className="fill-gray-900 dark:fill-gray-800"
                  fillOpacity="0.92"
                />
                <text
                  x={tx + tw / 2} y={ty + 15}
                  textAnchor="middle"
                  fill="#ffffff"
                  style={{ fontSize: 10.5, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  ₱ {p.val.toLocaleString()}
                </text>
                {p2 && (
                  <text
                    x={tx + tw / 2} y={ty + 32}
                    textAnchor="middle"
                    fill={strokeColor2}
                    style={{ fontSize: 9.5, fontFamily: 'inherit', fontWeight: 500 }}
                  >
                    Target: ₱ {p2.val.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      {yKey2 && (
        <div className="flex items-center justify-end gap-5 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 rounded-full" style={{ backgroundColor: strokeColor }} />
            <span>Actual / Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="22" height="4" className="shrink-0">
              <line x1="0" y1="2" x2="22" y2="2" stroke={strokeColor2} strokeWidth="2" strokeDasharray="5 3" />
            </svg>
            <span>Target / Baseline</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveBarChart  – gradient bars, rounded tops, value labels, hover glow
// ─────────────────────────────────────────────────────────────────────────────
export function ResponsiveBarChart({
  data = [],
  xKey = 'name',
  yKey = 'count',
  height = 240,
  barColor = '#1E3A5F',
  title = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        No chart data available
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1) * 1.18;

  const W       = 550;
  const padX    = 44;
  const padTop  = 24;
  const padBot  = 32;
  const chartW  = W - padX * 2;
  const chartH  = height - padTop - padBot;
  const barW    = Math.min(42, (chartW / data.length) * 0.55);
  const gradId  = `barGrad-${title.replace(/\W/g, '')}`;

  // Y ticks
  const yTicks = [0, 0.33, 0.66, 1].map(pct => ({
    y:   padTop + chartH * (1 - pct),
    val: maxVal * pct,
  }));

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-3">{title}</h4>
      )}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={barColor} stopOpacity="1.0" />
              <stop offset="100%" stopColor={barColor} stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* Y-axis grid + labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padX} y1={tick.y} x2={W - padX} y2={tick.y}
                stroke="currentColor"
                strokeDasharray={i === 0 ? 'none' : '4 4'}
                className="text-gray-200 dark:text-gray-700"
                strokeOpacity={i === 0 ? 0.6 : 0.4}
              />
              {i > 0 && (
                <text
                  x={padX - 6} y={tick.y + 4}
                  textAnchor="end"
                  className="fill-slate-600 dark:fill-gray-400 font-semibold"
                  style={{ fontSize: 10 }}
                >
                  {formatYLabel(tick.val)}
                </text>
              )}
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const val = Number(d[yKey]) || 0;
            const h   = Math.max(2, (val / maxVal) * chartH);
            const x   = padX + (i + 0.5) * (chartW / data.length) - barW / 2;
            const y   = padTop + chartH - h;
            const isH = hoveredIdx === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Hover glow behind bar */}
                {isH && (
                  <rect
                    x={x - 4} y={y - 4} width={barW + 8} height={h + 4}
                    rx={6}
                    fill={d.color || barColor}
                    fillOpacity="0.18"
                  />
                )}
                {/* Bar */}
                <rect
                  x={x} y={y} width={barW} height={h}
                  rx={5}
                  fill={d.color ? d.color : `url(#${gradId})`}
                  fillOpacity={isH ? 1 : 0.88}
                  className="transition-all duration-150"
                />
                {/* Bright top cap */}
                <rect
                  x={x} y={y} width={barW} height={Math.min(5, h)}
                  rx={5}
                  fill="#ffffff"
                  fillOpacity={isH ? 0.22 : 0.10}
                />

                {/* Value label */}
                <text
                  x={x + barW / 2} y={y - 7}
                  textAnchor="middle"
                  className="fill-slate-800 dark:fill-gray-100 font-bold"
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {formatYLabel(val)}
                </text>

                {/* X label */}
                <text
                  x={x + barW / 2} y={height - 7}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-gray-300 font-bold"
                  style={{ fontSize: 9.5, fontWeight: 600 }}
                >
                  {String(d[xKey] ?? '').length > 10
                    ? String(d[xKey]).substring(0, 9) + '…'
                    : d[xKey]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResponsiveDonutChart – smooth arcs, centre total, legend with bars
// ─────────────────────────────────────────────────────────────────────────────
export function ResponsiveDonutChart({
  data = [],
  valueKey  = 'count',
  labelKey  = 'status',
  title     = '',
  centerLabel = 'Total',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  const COLORS  = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#1E3A5F'];
  const total   = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0) || 1;
  const cx = 90, cy = 90, R = 64, r = 40;

  let cumAngle = -90; // start at top
  const slices = data.map((item, idx) => {
    const val      = Number(item[valueKey]) || 0;
    const pct      = val / total;
    const sweep    = pct * 360;
    const startA   = cumAngle;
    const endA     = cumAngle + sweep;
    cumAngle += sweep;

    const toRad   = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + R * Math.cos(toRad(startA));
    const y1 = cy + R * Math.sin(toRad(startA));
    const x2 = cx + R * Math.cos(toRad(endA));
    const y2 = cy + R * Math.sin(toRad(endA));

    const lx1 = cx + r * Math.cos(toRad(startA));
    const ly1 = cy + r * Math.sin(toRad(startA));
    const lx2 = cx + r * Math.cos(toRad(endA));
    const ly2 = cy + r * Math.sin(toRad(endA));

    const large = sweep > 180 ? 1 : 0;
    const pathD = sweep >= 359.9
      ? `M ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx + R - 0.001} ${cy} Z M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx + r - 0.001} ${cy} Z`
      : `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${lx2} ${ly2} A ${r} ${r} 0 ${large} 0 ${lx1} ${ly1} Z`;

    return {
      ...item,
      pathD,
      color: item.color || COLORS[idx % COLORS.length],
      val,
      pct: Math.round(pct * 100),
      midAngle: startA + sweep / 2,
    };
  });

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-3">{title}</h4>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
        {/* Donut */}
        <div className="relative w-44 h-44 shrink-0">
          <svg viewBox="0 0 180 180" className="w-full h-full">
            {slices.map((s, i) => {
              const isH   = hoveredIdx === i;
              const scale = isH ? 1.06 : 1;
              return (
                <path
                  key={i}
                  d={s.pathD}
                  fill={s.color}
                  opacity={hoveredIdx !== null && !isH ? 0.55 : 1}
                  style={{
                    transform: isH
                      ? `translate(${cx}px,${cy}px) scale(${scale}) translate(${-cx}px,${-cy}px)`
                      : 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    filter: isH ? `drop-shadow(0 0 6px ${s.color}66)` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
            {/* Inner shadow ring */}
            <circle cx={cx} cy={cy} r={r + 1} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-100 dark:text-darkbg-card" strokeOpacity="0.5" />
          </svg>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {hoveredIdx !== null ? (
              <>
                <span className="text-base font-black leading-tight" style={{ color: slices[hoveredIdx]?.color }}>
                  {slices[hoveredIdx]?.pct}%
                </span>
                <span className="text-[10px] text-slate-600 dark:text-gray-300 font-bold uppercase tracking-wider leading-snug">
                  {slices[hoveredIdx]?.[labelKey]}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {total.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-gray-300 font-bold uppercase tracking-wider">
                  {centerLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 w-full max-w-xs text-xs">
          {slices.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                style={{
                  backgroundColor: s.color,
                  transform: hoveredIdx === i ? 'scale(1.4)' : 'scale(1)',
                }}
              />
              <span className="flex-1 truncate text-slate-700 dark:text-gray-200 font-semibold">{s[labelKey]}</span>
              <span className="font-black text-slate-900 dark:text-gray-100 shrink-0">{s.val}</span>
              {/* Mini progress bar */}
              <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
              <span className="text-slate-500 dark:text-gray-400 font-bold shrink-0 w-8 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ModelComparisonBarChart  – grouped bars with gradient + labels
// ─────────────────────────────────────────────────────────────────────────────
export function ModelComparisonBarChart({ data = [], height = 240 }) {
  const [hoveredGroup, setHoveredGroup] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        No comparison data
      </div>
    );
  }

  const W      = 500;
  const padX   = 44;
  const padTop = 30;
  const padBot = 32;
  const chartW = W - padX * 2;
  const chartH = height - padTop - padBot;
  const groupW = chartW / data.length;
  const barW   = Math.min(28, groupW * 0.32);

  const maxVal = Math.max(
    ...data.flatMap(d => [d.linear_regression || 0, d.random_forest || 0]),
    100
  ) * 1.18;

  const yTicks = [0, 0.33, 0.66, 1].map(pct => ({
    y:   padTop + chartH * (1 - pct),
    val: maxVal * pct,
  }));

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="mcLR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1E3A5F" stopOpacity="1" />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="mcRF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10B981" stopOpacity="1" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padX} y1={tick.y} x2={W - padX} y2={tick.y}
                stroke="currentColor"
                strokeDasharray={i === 0 ? 'none' : '4 4'}
                className="text-gray-200 dark:text-gray-700"
                strokeOpacity={i === 0 ? 0.6 : 0.4}
              />
              {i > 0 && (
                <text x={padX - 5} y={tick.y + 4} textAnchor="end" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: 9.5 }}>
                  {formatYLabel(tick.val)}
                </text>
              )}
            </g>
          ))}

          {data.map((d, i) => {
            const lrVal = Number(d.linear_regression) || 0;
            const rfVal = Number(d.random_forest)     || 0;
            const lrH   = Math.max(2, (lrVal / maxVal) * chartH);
            const rfH   = Math.max(2, (rfVal / maxVal) * chartH);
            const gc    = padX + (i + 0.5) * groupW;
            const lrX   = gc - barW - 3;
            const rfX   = gc + 3;
            const lrY   = padTop + chartH - lrH;
            const rfY   = padTop + chartH - rfH;
            const isH   = hoveredGroup === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredGroup(i)}
                onMouseLeave={() => setHoveredGroup(null)}
                className="cursor-pointer"
              >
                {/* LR bar */}
                <rect x={lrX} y={lrY} width={barW} height={lrH} rx={4} fill="url(#mcLR)" fillOpacity={isH ? 1 : 0.85} />
                <rect x={lrX} y={lrY} width={barW} height={Math.min(4, lrH)} rx={4} fill="#ffffff" fillOpacity={isH ? 0.2 : 0.08} />
                <text x={lrX + barW / 2} y={lrY - 5} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300" style={{ fontSize: 9, fontWeight: 600 }}>
                  {lrVal}
                </text>

                {/* RF bar */}
                <rect x={rfX} y={rfY} width={barW} height={rfH} rx={4} fill="url(#mcRF)" fillOpacity={isH ? 1 : 0.85} />
                <rect x={rfX} y={rfY} width={barW} height={Math.min(4, rfH)} rx={4} fill="#ffffff" fillOpacity={isH ? 0.2 : 0.08} />
                <text x={rfX + barW / 2} y={rfY - 5} textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400" style={{ fontSize: 9, fontWeight: 600 }}>
                  {rfVal}
                </text>

                {/* Metric label */}
                <text x={gc} y={height - 7} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300" style={{ fontSize: 10, fontWeight: 500 }}>
                  {d.metric}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-2 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-navy" />
          <span className="text-gray-700 dark:text-gray-300">Simple Linear Regression</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
          <span className="text-gray-700 dark:text-gray-300">Random Forest Regressor</span>
        </div>
      </div>
    </div>
  );
}
