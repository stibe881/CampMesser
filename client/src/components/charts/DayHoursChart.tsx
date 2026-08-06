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
 * Der Stunden-Verlauf eines Tages im 7-Tage-Ausblick (#106),
 * herausgelöst in #354 – aus demselben Grund wie `RainChart`: recharts
 * hing statisch am Bündel der Wetter-Seite und musste vor dem ersten
 * Bild geladen werden.
 */
export interface HourPoint {
  label: string;
  temp: number;
  mm: number;
}

export default function DayHoursChart({
  data,
  labels,
}: {
  data: HourPoint[];
  labels: { rain: string; temp: string };
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 4,
          right: -18,
          bottom: 0,
          left: -18,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis yAxisId="temp" tick={{ fontSize: 10 }} />
        <YAxis
          yAxisId="mm"
          orientation="right"
          domain={[0, (max: number) => Math.max(2, Math.ceil(max))]}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === labels.rain
              ? [`${value.toFixed(1)} mm/h`, labels.rain]
              : [`${Math.round(value)} °C`, labels.temp]
          }
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
          yAxisId="temp"
          type="monotone"
          dataKey="temp"
          name={labels.temp}
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
