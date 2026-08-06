import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Nacht-Protokoll des Ruhe-Timers (#34) – herausgelöst in #354.
 *
 * `recharts` ist mit 384 kB der zweitgrösste Brocken des Bündels.
 * Statisch importiert musste er vor dem ersten Bild geladen werden. Als
 * eigene, per `lazy()` geholte Komponente erscheint die Seite sofort und
 * das Diagramm zeichnet sich einen Wimpernschlag später dazu.
 *
 * KEIN BYTE WENIGER, ehrlich – nur nicht mehr als Erstes.
 */
export default function QuietChart({
  history,
  threshold,
  labels,
}: {
  history: { time: string; max: number }[];
  threshold: number;
  labels: {
    value: (v: number) => string;
    name: string;
    time: (label: string) => string;
  };
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={history}
        margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(value: number) => [labels.value(value), labels.name]}
          labelFormatter={(label: string) => labels.time(label)}
        />
        <ReferenceLine
          y={threshold}
          stroke="var(--destructive)"
          strokeDasharray="4 4"
        />
        <Area
          type="monotone"
          dataKey="max"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.25}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
