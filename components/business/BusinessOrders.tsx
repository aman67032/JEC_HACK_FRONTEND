"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, Timestamp } from "firebase/firestore";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: number | any[];
  totalItems?: number;
  amount: number;
  status: "pending" | "processing" | "dispatched" | "in-transit" | "delivered" | "cancelled";
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
  deliveryAddress: string;
  estimatedDelivery?: string | null;
  deliveredAt?: string;
}

export default function BusinessOrders({ businessId }: { businessId: string | null }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    // Fetch orders from Firestore
    const db = firestoreDb();
    const ordersRef = collection(db, "users", businessId, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ordersList.push({
            id: doc.id,
            orderNumber: data.orderNumber || doc.id,
            customerName: data.customerName || "Unknown",
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            items: data.items || [],
            totalItems: data.totalItems || (Array.isArray(data.items) ? data.items.length : data.items || 0),
            amount: data.amount || 0,
            status: data.status || "pending",
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt,
            deliveryAddress: data.deliveryAddress || "",
            estimatedDelivery: data.estimatedDelivery,
            deliveredAt: data.deliveredAt,
          });
        });
        setOrders(ordersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId]);

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter((order) => order.status === filter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      dispatched: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "in-transit": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status] || colors.pending;
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    if (!businessId) return;
    
    try {
      const db = firestoreDb();
      const orderRef = doc(db, "users", businessId, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === "delivered" && { deliveredAt: new Date().toISOString() }),
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
          <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders & Deliveries</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track all your orders</p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          + New Order
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {["all", "pending", "processing", "dispatched", "in-transit", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === status
                ? "border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {status.replace("-", " ")} ({status === "all" ? orders.length : orders.filter((o) => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-3">
                    <div>
                      <span className="font-medium">Customer:</span> {order.customerName}
                    </div>
                    <div>
                      <span className="font-medium">Items:</span> {order.totalItems || (Array.isArray(order.items) ? order.items.length : order.items) || 0}
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> ₹{order.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Address:</span> {order.deliveryAddress}
                  </div>
                  {order.customerPhone && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Phone:</span> {order.customerPhone}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Created: {new Date(order.createdAt).toLocaleString()}
                  </div>
                  {order.estimatedDelivery && (
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      ETA: {new Date(order.estimatedDelivery).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "processing")}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Process
                    </button>
                  )}
                  {order.status === "processing" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "dispatched")}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      Dispatch
                    </button>
                  )}
                  {order.status === "dispatched" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "in-transit")}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Mark In Transit
                    </button>
                  )}
                  {order.status === "in-transit" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Mark Delivered
                    </button>
                  )}
                  <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real-time Tracking Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Real-time Tracking</h3>
        <div className="space-y-4">
          {orders.filter((o) => o.status === "in-transit" || o.status === "dispatched").map((order) => (
            <div key={order.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Estimated: 30 min</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 w-2/3 rounded-full bg-purple-600"></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">65%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

