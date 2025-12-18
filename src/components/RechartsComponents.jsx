
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

// Premium Revenue Chart with modern enterprise styling
export const RevenueAreaChart = ({ data, viewMode = 'monthly' }) => {
  const isWeekly = viewMode === 'weekly';

  // Custom tooltip component for premium look
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {isWeekly ? `Tuần ${label}` : `Tháng ${label}`}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('vi-VN').format(payload[0].value)}₫
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Premium gradient - inspired by Stripe/Vercel dashboards */}
            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeOpacity={0.5}
          />

          <XAxis
            dataKey={isWeekly ? 'name' : 'month'}
            tickFormatter={(val) => isWeekly ? val : `T${val}`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            dy={10}
            interval={0}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : val >= 1000 ? `${val / 1000}k` : val}
            width={50}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }} />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="url(#strokeGradient)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#premiumGradient)"
            animationDuration={1200}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 6,
              fill: '#8b5cf6',
              stroke: '#fff',
              strokeWidth: 3,
              className: 'drop-shadow-lg'
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OrderStatusPieChart = ({ data }) => {
  const COLORS = {
    Pending: '#eab308',   // Yellow
    Shipping: '#3b82f6',  // Blue
    Completed: '#22c55e', // Green
    Cancelled: '#ef4444'  // Red
  };

  const statusLabels = {
    Pending: 'Chờ xử lý',
    Shipping: 'Đang giao',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy'
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [value, 'Đơn hàng']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => statusLabels[value] || value}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
