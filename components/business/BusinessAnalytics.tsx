"use client";

import { useState, useEffect } from "react";

export default function BusinessAnalytics({ businessId }: { businessId: string | null }) {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [analytics, setAnalytics] = useState({
    totalOrders: 234,
    totalRevenue: 456780,
    averageOrderValue: 1952,
    customerSatisfaction: 4.5,
    deliveryTime: 28, // minutes
    repeatCustomers: 65,
  });

  // Mock chart data
  const deliveryTrends = [
    { day: "Mon", delivered: 12, pending: 3 },
    { day: "Tue", delivered: 15, pending: 2 },
    { day: "Wed", delivered: 18, pending: 4 },
    { day: "Thu", delivered: 14, pending: 1 },
    { day: "Fri", delivered: 20, pending: 5 },
    { day: "Sat", delivered: 22, pending: 3 },
    { day: "Sun", delivered: 16, pending: 2 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 42000 },
    { month: "Feb", revenue: 45000 },
    { month: "Mar", revenue: 48000 },
    { month: "Apr", revenue: 46000 },
    { month: "May", revenue: 49000 },
    { month: "Jun", revenue: 45678 },
  ];

  const maxDelivered = Math.max(...deliveryTrends.map((d) => d.delivered));
  const maxRevenue = Math.max(...revenueData.map((r) => r.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track performance, sales trends, and customer satisfaction
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Orders"
          value={analytics.totalOrders}
          change="+12%"
          trend="up"
          icon="📦"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${analytics.totalRevenue.toLocaleString()}`}
          change="+15%"
          trend="up"
          icon="💰"
        />
        <MetricCard
          title="Avg Order Value"
          value={`₹${analytics.averageOrderValue}`}
          change="+3%"
          trend="up"
          icon="💵"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={analytics.customerSatisfaction}
          change="+0.2"
          trend="up"
          icon="⭐"
          subtitle="out of 5"
        />
        <MetricCard
          title="Avg Delivery Time"
          value={`${analytics.deliveryTime} min`}
          change="-5 min"
          trend="down"
          icon="⏱️"
        />
        <MetricCard
          title="Repeat Customers"
          value={`${analytics.repeatCustomers}%`}
          change="+5%"
          trend="up"
          icon="🔄"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Delivery Trends Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Delivery Trends (Last 7 Days)
          </h3>
          <div className="h-64 space-y-4">
            {deliveryTrends.map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-12 text-xs text-gray-600 dark:text-gray-400">{day.day}</div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-6 flex-1 rounded bg-blue-100 dark:bg-blue-900" style={{ width: `${(day.delivered / maxDelivered) * 100}%` }}>
                      <div className="h-full w-full rounded bg-blue-500"></div>
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-gray-900 dark:text-white">
                      {day.delivered}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 flex-1 rounded bg-yellow-100 dark:bg-yellow-900" style={{ width: `${(day.pending / maxDelivered) * 100}%` }}>
                      <div className="h-full w-full rounded bg-yellow-500"></div>
                    </div>
                    <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                      {day.pending}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500"></div>
              <span>Delivered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-yellow-500"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Revenue Trend
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {revenueData.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative" style={{ height: "200px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-purple-500 transition-all hover:bg-purple-600"
                    style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{month.month}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  ₹{(month.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Reports */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Performance Insights</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-semibold text-green-900 dark:text-green-200">Strong Growth</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your orders have increased by 12% this week compared to last week.
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Faster Deliveries</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Average delivery time improved by 5 minutes. Keep up the good work!
            </p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
            <div className="text-2xl mb-2">💎</div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-200">Loyal Customers</h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              65% of your customers are repeat buyers - excellent retention!
            </p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Peak Hours</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Most orders come between 6 PM - 9 PM. Consider optimizing staffing.
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Reports</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download detailed reports for your records or accounting
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Export PDF
            </button>
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  icon: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <p className={`mt-1 text-xs font-medium ${
            trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {trend === "up" ? "↑" : "↓"} {change}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

