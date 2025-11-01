"use client";

import { useState, useEffect } from "react";
import { firestoreDb } from "@/lib/firebaseClient";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";

interface InventoryItem {
  id: string;
  medicineName: string;
  brand: string;
  quantity: number;
  unit: string;
  price: number;
  expiryDate: string;
  lowStockThreshold: number;
  licenseNumber?: string;
  category?: string;
}

export default function BusinessInventory({ businessId }: { businessId: string | null }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    // Fetch inventory from Firestore
    const db = firestoreDb();
    const inventoryRef = collection(db, "users", businessId, "inventory");

    const unsubscribe = onSnapshot(
      inventoryRef,
      (snapshot) => {
        const itemsList: InventoryItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          itemsList.push({
            id: doc.id,
            medicineName: data.medicineName || "Unknown",
            brand: data.brand || "Generic",
            quantity: data.quantity || 0,
            unit: data.unit || "units",
            price: data.price || 0,
            expiryDate: data.expiryDate || "",
            lowStockThreshold: data.lowStockThreshold || 50,
            licenseNumber: data.licenseNumber,
            category: data.category,
          });
        });
        setItems(itemsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading inventory:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId]);

  const lowStockItems = items.filter((item) => item.quantity <= item.lowStockThreshold);
  const expiredItems = items.filter((item) => new Date(item.expiryDate) < new Date());
  const filteredItems = filter === "low-stock" 
    ? lowStockItems 
    : filter === "expired"
    ? expiredItems
    : items;

  const updateQuantity = (id: string, newQuantity: number) => {
    setItems(items.map((item) => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your medicine stock and licenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          + Add Medicine
        </button>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="font-semibold text-yellow-900 dark:text-yellow-200">
            ⚠️ {lowStockItems.length} item(s) are running low on stock
          </p>
        </div>
      )}

      {expiredItems.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="font-semibold text-red-900 dark:text-red-200">
            🚨 {expiredItems.length} item(s) have expired
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {["all", "low-stock", "expired"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === status
                ? "border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {status.replace("-", " ")} (
            {status === "all" 
              ? items.length 
              : status === "low-stock" 
              ? lowStockItems.length 
              : expiredItems.length}
            )
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Medicine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.medicineName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.brand}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      item.quantity <= item.lowStockThreshold 
                        ? "text-red-600 dark:text-red-400" 
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {item.quantity} {item.unit}
                    </span>
                    {item.quantity <= item.lowStockThreshold && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                        Low
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                  ₹{item.price}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`text-sm ${
                    new Date(item.expiryDate) < new Date()
                      ? "text-red-600 dark:text-red-400"
                      : new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {item.licenseNumber ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Not verified</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Medicine Catalog Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Partner Pharmacy Verification</h3>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">License Verified</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your pharmacy license is active and verified. License #: DL-MED-12345
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Add New Medicine</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This feature will be connected to your inventory management system.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

