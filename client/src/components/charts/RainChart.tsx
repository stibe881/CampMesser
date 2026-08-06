import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Die Niederschlags-Grafik der Wetter-Seite (#47), herausgelöst in #354.
 *
 * WARUM EIGENE DATEI: `recharts` ist mit 384 kB der zweitgrösste Brocken
 * des Bündels. Statisch aus `Weather.tsx` importiert, musste er VOR dem
 * ersten Bild geladen werden – für zwei Diagramme, an denen niemand die
 * Seite festmacht. Als eigene, per `lazy()` geholte Komponente erscheinen
 * Zahlen, Warnungen und Tagesliste sofort, und die Grafik zeichnet sich
 * einen Wimpernschlag später dazu.
 *
 * WAS DAS NICHT IST, ehrlich: kein Byte weniger. Wer die Wetter-Seite
 * öffnet, lädt `recharts` weiterhin – nur eben nicht mehr als Erstes.
 */
export interface RainPoint {
  label: string;
  mm: number;
  prob: number;
}

export default function RainChart({
  data,
  labels,
}: {
  data: RainPoint[];
  labels: { rain: string; prob: string; hour: (label: string) => string };
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 4, right: -18, bottom: 0, left: -18 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={36}
        />
        <YAxis
          yAxisId="mm"
          domain={[0, (max: number) => Math.max(2, Math.ceil(max))]}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          yAxisId="prob"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === labels.rain
              ? [`${value.toFixed(1)} mm/h`, labels.rain]
              : [`${Math.round(value)} %`, labels.prob]
          }
          labelFormatter={(label: string) => labels.hour(label)}
        />
        <Bar
          yAxisId="mm"
          dataKey="mm"
          name={labels.rain}
          fill="var(--chart-2)"
          fillOpacity={0.75}
          isAnimationActive={false}
        />
        <Line
          yAxisId="prob"
          type="monotone"
          dataKey="prob"
          name={labels.prob}
          stroke="var(--chart-4)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
