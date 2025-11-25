import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TimeSeriesChartProps {
  title: string;
  data: Array<{ date: string; count: string }>;
  color: string;
  dataKey?: string;
}

export function TimeSeriesChart({ title, data, color, dataKey = 'count' }: TimeSeriesChartProps) {
  const [isVisible, setIsVisible] = useState(true);

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: parseInt(item.count),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          {isVisible ? (
            <ChevronUp className="text-gray-600 dark:text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-600 dark:text-gray-400" size={20} />
          )}
        </button>
      </div>

      {isVisible && (
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                <XAxis
                  dataKey="date"
                  className="text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #ccc)',
                    borderRadius: '0.375rem',
                  }}
                  labelStyle={{ color: 'var(--tooltip-text, #000)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color }}
                  activeDot={{ r: 6 }}
                  name={title}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No data available for the selected period
            </div>
          )}
        </div>
      )}
    </div>
  );
}
