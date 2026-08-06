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
 * Klima-Diagramm des Platz-Dossiers (#68) – herausgelöst in #354.
 *
 * `recharts` ist mit 384 kB der zweitgrösste Brocken des Bündels.
 * Statisch importiert musste er vor dem ersten Bild geladen werden. Als
 * eigene, per `lazy()` geholte Komponente erscheint die Seite sofort und
 * das Diagramm zeichnet sich einen Wimpernschlag später dazu.
 *
 * KEIN BYTE WENIGER, ehrlich – nur nicht mehr als Erstes.
 */
export default function ClimateChart({
  data,
  labels,
}: {
  data: {
    label: string;
    max: number | null;
    min: number | null;
    rain: number | null;
  }[];
  labels: {
    max: string;
    min: string;
    rain: string;
    daysUnit: string;
  };
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 4, right: -18, bottom: 0, left: -18 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="temp" tick={{ fontSize: 10 }} />
        <YAxis
          yAxisId="rain"
          orientation="right"
          domain={[0, (max: number) => Math.max(10, Math.ceil(max))]}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === labels.rain
              ? [`${value} ${labels.daysUnit}`, name]
              : [`${value} °C`, name]
          }
        />
        <Bar
          yAxisId="rain"
          dataKey="rain"
          name={labels.rain}
          fill="var(--chart-2)"
          fillOpacity={0.55}
          isAnimationActive={false}
        />
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey="max"
          name={labels.max}
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey="min"
          name={labels.min}
          stroke="var(--chart-4)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
