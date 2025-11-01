"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { doc, collection, onSnapshot } from "firebase/firestore";
import BusinessOrders from "./BusinessOrders";
import BusinessInventory from "./BusinessInventory";
import BusinessSubscriptions from "./BusinessSubscriptions";
import BusinessAnalytics from "./BusinessAnalytics";
import BusinessSettings from "./BusinessSettings";
import BusinessSupport from "./BusinessSupport";

interface BusinessOverviewProps {
  businessId: string | null;
  businessInfo: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function BusinessOverview({
  businessId,
  businessInfo,
  activeSection,
  setActiveSection,
}: BusinessOverviewProps) {
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    if (!businessId) return;

    // Fetch stats from Firestore business document
    const db = firestoreDb();
    const businessRef = doc(db, "users", businessId);
    
    const unsubscribe = onSnapshot(
      businessRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.stats) {
            setStats({
              activeDeliveries: data.stats.activeDeliveries || 0,
              completedDeliveries: data.stats.completedDeliveries || 0,
              pendingOrders: data.stats.pendingOrders || 0,
              monthlyRevenue: data.stats.monthlyRevenue || 0,
            });
          } else {
            // If no stats, fetch from orders collection
            fetchStatsFromOrders(businessId);
          }
        }
      },
      (error) => {
        console.error("Error loading stats:", error);
        fetchStatsFromOrders(businessId);
      }
    );

    return () => unsubscribe();
  }, [businessId]);

  const fetchStatsFromOrders = async (businessId: string) => {
    // Fallback: calculate stats from orders
    const db = firestoreDb();
    const ordersRef = collection(db, "users", businessId, "orders");
    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        let activeDeliveries = 0;
        let completedDeliveries = 0;
        let pendingOrders = 0;
        let monthlyRevenue = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status || "pending";
          
          if (status === "in-transit" || status === "dispatched") {
            activeDeliveries++;
          } else if (status === "delivered") {
            completedDeliveries++;
            monthlyRevenue += data.amount || 0;
          } else if (status === "pending" || status === "processing") {
            pendingOrders++;
          }
        });

        setStats({
          activeDeliveries,
          completedDeliveries,
          pendingOrders,
          monthlyRevenue,
        });
      }
    );
    return unsubscribe;
  };

  if (activeSection === "orders") {
    return <BusinessOrders businessId={businessId} />;
  }

  if (activeSection === "inventory") {
    return <BusinessInventory businessId={businessId} />;
  }

  if (activeSection === "subscriptions") {
    return <BusinessSubscriptions businessId={businessId} />;
  }

  if (activeSection === "analytics") {
    return <BusinessAnalytics businessId={businessId} />;
  }

  if (activeSection === "settings") {
    return <BusinessSettings businessId={businessId} businessInfo={businessInfo} />;
  }

  if (activeSection === "support") {
    return <BusinessSupport />;
  }

  // Default: Dashboard Overview
  return (
    <div className="space-y-6">
      {/* Seed Demo Data Button (only show if no data exists) */}
      {stats.completedDeliveries === 0 && stats.activeDeliveries === 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-200">📦 No Data Yet</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Click the button below to seed demo orders and inventory data
              </p>
            </div>
            <button
              onClick={async () => {
                if (!businessId) return;
                try {
                  const response = await fetch("/api/business/seed-demo-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ businessId }),
                  });
                  const data = await response.json();
                  if (data.success) {
                    alert("Demo data seeded successfully! Refresh to see the data.");
                    window.location.reload();
                  } else {
                    alert("Failed to seed data: " + (data.error || "Unknown error"));
                  }
                } catch (error) {
                  alert("Failed to seed data");
                }
              }}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Seed Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Deliveries"
          value={stats.activeDeliveries}
          icon="🚚"
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Completed Deliveries"
          value={stats.completedDeliveries}
          icon="✅"
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon="⏳"
          color="yellow"
          trend="-5%"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon="💰"
          color="purple"
          trend="+15%"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
            <button
              onClick={() => setActiveSection("orders")}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Order #ORD{i.toString().padStart(4, "0")}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Medicine delivery • 2 items</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  In Transit
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveSection("orders")}
              className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-left transition-all hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900"
            >
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">New Order</p>
            </button>
            <button
              onClick={() => setActiveSection("inventory")}
              className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left transition-all hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900"
            >
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Update Inventory</p>
            </button>
            <button
              onClick={() => setActiveSection("analytics")}
              className="rounded-lg border border-green-200 bg-green-50 p-4 text-left transition-all hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900"
            >
              <div className="text-2xl mb-2">📈</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">View Reports</p>
            </button>
            <button
              onClick={() => setActiveSection("settings")}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Delivery Performance (Last 7 Days)</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">📊 Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend: string;
}) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    green: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    yellow: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
    purple: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{trend} from last month</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

