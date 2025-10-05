import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./WeatherChart.css";

interface WeatherChartProps {
  title: string;
  hourlyData: number[];
  unit?: string;
  color?: string;
}

export default function WeatherChart ({
  title,
  hourlyData,
  unit = "",
  color = "#00bcd4",
}: WeatherChartProps) {
  if (!hourlyData || hourlyData.length === 0) return null;

  const data = hourlyData.map((value, hour) => ({
    hour,
    value: Math.round(value * 10) / 10,
  }));

  return (
    <div className="chart-box">
      <h2 style={{ textAlign: "center", marginBottom: "8px" }}>{title}</h2>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="hour" label={{ value: "Hour", position: "insideBottom", dy: 10 }} />
            <YAxis label={{ value: unit, angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(v: number) => `${v} ${unit}`} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
