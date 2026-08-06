import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Höhenprofil einer Wanderung (#280) – herausgelöst in #354.
 *
 * `recharts` ist mit 384 kB der zweitgrösste Brocken des Bündels.
 * Statisch importiert musste er vor dem ersten Bild geladen werden. Als
 * eigene, per `lazy()` geholte Komponente erscheint die Seite sofort und
 * das Diagramm zeichnet sich einen Wimpernschlag später dazu.
 *
 * KEIN BYTE WENIGER, ehrlich – nur nicht mehr als Erstes.
 */
export default function TrackProfileChart({
  data,
  labels,
  decimalSeparator,
}: {
  data: { km: number; ele: number }[];
  labels: {
    elevation: string;
    distance: (km: string) => string;
  };
  /** «,» ausser auf Englisch – die Seite kennt die Sprache, hier nicht. */
  decimalSeparator: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          dataKey="km"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={value =>
            `${value.toFixed(1).replace(".", decimalSeparator)}`
          }
          tick={{ fontSize: 11 }}
          unit=" km"
        />
        <YAxis
          domain={["dataMin - 20", "dataMax + 20"]}
          tick={{ fontSize: 11 }}
          tickFormatter={value => `${Math.round(Number(value))}`}
          width={44}
        />
        <Tooltip
          formatter={(value: number) => [
            `${Math.round(value)} m`,
            labels.elevation,
          ]}
          labelFormatter={(value: number) =>
            labels.distance(value.toFixed(1).replace(".", decimalSeparator))
          }
        />
        <Area
          type="monotone"
          dataKey="ele"
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.25}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
