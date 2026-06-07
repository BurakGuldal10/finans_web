"use client";

import { useMemo, useState } from "react";
import { formatPrice, type Candle } from "@/lib/analysis";

type CandlestickChartProps = {
  candles: Candle[];
  timeframe: "15m" | "1h" | "4h" | "1d";
  unit: string;
};

type ChartCandle = Candle & {
  index: number;
  x: number;
};

const width = 920;
const height = 360;
const padding = {
  bottom: 74,
  left: 10,
  right: 82,
  top: 18,
};
const volumeHeight = 58;

export function CandlestickChart({ candles, timeframe, unit }: CandlestickChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chart = useMemo(() => buildChart(candles, timeframe), [candles, timeframe]);

  if (!chart) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
        Grafik icin yeterli mum verisi yok.
      </div>
    );
  }

  const active =
    activeIndex === null ? chart.candles.at(-1) : chart.candles.find((item) => item.index === activeIndex);

  return (
    <div className="h-full min-h-80 rounded-md border border-white/5 bg-black/10 p-3">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Mum grafigi</p>
          <p className="mt-1 font-mono text-sm text-white">
            {active ? `${formatPrice(active.close)} ${unit}` : "Veri bekleniyor"}
          </p>
        </div>
        {active ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right font-mono text-xs text-[var(--muted)] md:grid-cols-4">
            <span>A {formatPrice(active.open)}</span>
            <span>Y {formatPrice(active.high)}</span>
            <span>D {formatPrice(active.low)}</span>
            <span>K {formatPrice(active.close)}</span>
          </div>
        ) : null}
      </div>

      <svg
        aria-label="Mum grafigi"
        className="h-[calc(100%-52px)] min-h-64 w-full overflow-visible"
        onMouseLeave={() => setActiveIndex(null)}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect fill="transparent" height={height} width={width} x={0} y={0} />

        {chart.priceTicks.map((tick) => (
          <g key={tick.value}>
            <line
              stroke="rgba(159,184,175,0.12)"
              strokeDasharray="4 6"
              strokeWidth={1}
              x1={padding.left}
              x2={width - padding.right + 12}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              dominantBaseline="middle"
              fill="#9fb8af"
              fontSize={11}
              textAnchor="start"
              x={width - padding.right + 18}
              y={tick.y}
            >
              {formatPrice(tick.value)}
            </text>
          </g>
        ))}

        {chart.timeTicks.map((tick) => (
          <text
            fill="#9fb8af"
            fontSize={11}
            key={`${tick.x}-${tick.label}`}
            textAnchor="middle"
            x={tick.x}
            y={height - 8}
          >
            {tick.label}
          </text>
        ))}

        {chart.candles.map((candle) => {
          const positive = candle.close >= candle.open;
          const color = positive ? "#5ee7b7" : "#fca5a5";
          const bodyTop = chart.priceToY(Math.max(candle.open, candle.close));
          const bodyBottom = chart.priceToY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(2, bodyBottom - bodyTop);
          const volumeBarHeight = chart.volumeToHeight(candle.volume);

          return (
            <g key={`${candle.openTime}-${candle.index}`}>
              <rect
                fill={color}
                opacity={positive ? 0.28 : 0.2}
                x={candle.x - chart.candleWidth / 2}
                y={height - padding.bottom + volumeHeight - volumeBarHeight}
                width={chart.candleWidth}
                height={volumeBarHeight}
                rx={1}
              />
              <line
                stroke={color}
                strokeLinecap="round"
                strokeWidth={1.4}
                x1={candle.x}
                x2={candle.x}
                y1={chart.priceToY(candle.high)}
                y2={chart.priceToY(candle.low)}
              />
              <rect
                fill={positive ? "rgba(94,231,183,0.78)" : "rgba(252,165,165,0.78)"}
                stroke={color}
                strokeWidth={1}
                x={candle.x - chart.candleWidth / 2}
                y={bodyTop}
                width={chart.candleWidth}
                height={bodyHeight}
                rx={1.5}
              />
              <rect
                fill="transparent"
                height={height - padding.top - 12}
                onMouseEnter={() => setActiveIndex(candle.index)}
                width={Math.max(chart.step, chart.candleWidth)}
                x={candle.x - chart.step / 2}
                y={padding.top}
              />
            </g>
          );
        })}

        {active ? (
          <g>
            <line
              stroke="rgba(232,242,238,0.55)"
              strokeDasharray="3 5"
              strokeWidth={1}
              x1={active.x}
              x2={active.x}
              y1={padding.top}
              y2={height - padding.bottom + volumeHeight}
            />
            <circle cx={active.x} cy={chart.priceToY(active.close)} fill="#e8f2ee" r={3.5} />
            <rect
              fill="rgba(13,26,23,0.94)"
              height={58}
              rx={6}
              stroke="rgba(94,231,183,0.35)"
              width={136}
              x={Math.min(active.x + 10, width - padding.right - 146)}
              y={Math.max(8, chart.priceToY(active.close) - 32)}
            />
            <text
              fill="#9fb8af"
              fontSize={11}
              x={Math.min(active.x + 22, width - padding.right - 134)}
              y={Math.max(25, chart.priceToY(active.close) - 13)}
            >
              {formatCandleTime(active.openTime, timeframe)}
            </text>
            <text
              fill="#e8f2ee"
              fontSize={13}
              fontWeight={600}
              x={Math.min(active.x + 22, width - padding.right - 134)}
              y={Math.max(45, chart.priceToY(active.close) + 7)}
            >
              {formatPrice(active.close)} {unit}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function buildChart(candles: Candle[], timeframe: CandlestickChartProps["timeframe"]) {
  const visible = candles.slice(-80);
  if (visible.length < 2) {
    return null;
  }

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom - volumeHeight - 14;
  const step = plotWidth / Math.max(visible.length - 1, 1);
  const candleWidth = Math.max(4, Math.min(12, step * 0.58));
  const minLow = Math.min(...visible.map((candle) => candle.low));
  const maxHigh = Math.max(...visible.map((candle) => candle.high));
  const pricePadding = Math.max((maxHigh - minLow) * 0.08, maxHigh * 0.002);
  const minPrice = minLow - pricePadding;
  const maxPrice = maxHigh + pricePadding;
  const maxVolume = Math.max(...visible.map((candle) => candle.volume), 1);

  const priceToY = (price: number) =>
    padding.top + ((maxPrice - price) / Math.max(maxPrice - minPrice, 1)) * plotHeight;
  const volumeToHeight = (volume: number) => (volume / maxVolume) * volumeHeight;
  const chartCandles: ChartCandle[] = visible.map((candle, index) => ({
    ...candle,
    index,
    x: padding.left + index * step,
  }));
  const priceTicks = Array.from({ length: 5 }, (_, index) => {
    const value = minPrice + ((maxPrice - minPrice) / 4) * index;
    return { value, y: priceToY(value) };
  }).reverse();
  const timeTicks = createTimeTicks(chartCandles, timeframe);

  return {
    candles: chartCandles,
    candleWidth,
    priceTicks,
    priceToY,
    step,
    timeTicks,
    volumeToHeight,
  };
}

function createTimeTicks(candles: ChartCandle[], timeframe: CandlestickChartProps["timeframe"]) {
  const tickCount = Math.min(5, candles.length);
  return Array.from({ length: tickCount }, (_, index) => {
    const candleIndex = Math.round((index / Math.max(tickCount - 1, 1)) * (candles.length - 1));
    const candle = candles[candleIndex];
    return {
      label: formatCandleTime(candle.openTime, timeframe),
      x: candle.x,
    };
  });
}

function formatCandleTime(openTime: number, timeframe: CandlestickChartProps["timeframe"]) {
  const date = new Date(openTime);

  if (timeframe === "1d") {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
