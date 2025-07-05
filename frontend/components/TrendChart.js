
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function TrendChart({
  data,
  dataKeyCurrent = 'Current',
  dataKeyIdeal   = 'Ideal',
  title          = 'Trends',
}) {
  const COLORS = {
    current: '#7a3b3b',  
    ideal:   '#997156',  
    grid:    '#ecebe4',
    axis:    '#141414',
    bg:      '#ffffff'
  };

  return (
    <div className="w-full">
      <h3 className="text-center text-lg font-semibold text-[#111011] mb-1">
        {title}
      </h3>

      <div className="w-full h-64 rounded-lg border border-[#eae8e1] bg-[#ffffff] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            barGap={6}
          >
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="parameter"
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis, fontSize: 12 }}
            />
            <YAxis
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis, fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: COLORS.bg,
                border: '1px solid #eae8e1',
                borderRadius: 8
              }}
              labelStyle={{ color: COLORS.axis }}
              itemStyle={{ color: COLORS.axis }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.axis }} />
            <Bar
              dataKey={dataKeyCurrent}
              name="Current"
              fill={COLORS.current}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={dataKeyIdeal}
              name="Ideal"
              fill={COLORS.ideal}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}