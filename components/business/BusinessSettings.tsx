"use client";

import { useState } from "react";

interface BusinessSettingsProps {
  businessId: string | null;
  businessInfo: any;
}

export default function BusinessSettings({ businessId, businessInfo }: BusinessSettingsProps) {
  const [settings, setSettings] = useState({
    businessName: businessInfo?.businessName || businessInfo?.name || "",
    email: businessInfo?.email || "",
    phone: businessInfo?.phone || "",
    address: businessInfo?.address || "",
    city: businessInfo?.city || "",
    state: businessInfo?.state || "",
    pincode: businessInfo?.pincode || "",
    operatingHours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "09:00", close: "21:00", closed: false },
      sunday: { open: "10:00", close: "18:00", closed: false },
    },
    serviceAreas: businessInfo?.serviceAreas || [],
    deliveryRadius: businessInfo?.deliveryRadius || 5,
    autoAcceptOrders: businessInfo?.autoAcceptOrders || false,
  });

  const [newServiceArea, setNewServiceArea] = useState("");

  const handleSave = () => {
    // Save settings to API or Firestore
    alert("Settings saved successfully!");
  };

  const addServiceArea = () => {
    if (newServiceArea && !settings.serviceAreas.includes(newServiceArea)) {
      setSettings({
        ...settings,
        serviceAreas: [...settings.serviceAreas, newServiceArea],
      });
      setNewServiceArea("");
    }
  };

  const removeServiceArea = (area: string) => {
    setSettings({
      ...settings,
      serviceAreas: settings.serviceAreas.filter((a) => a !== area),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update your store information, availability, and operational details
        </p>
      </div>

      {/* Business Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Business Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter business name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="business@example.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="+91 1234567890"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Address</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Street Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              City
            </label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="City"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              State
            </label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="State"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pincode
            </label>
            <input
              type="text"
              value={settings.pincode}
              onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="123456"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Operating Hours</h3>
        <div className="space-y-3">
          {Object.entries(settings.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24 capitalize text-sm font-medium text-gray-700 dark:text-gray-300">
                {day}
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operatingHours: {
                        ...settings.operatingHours,
                        [day]: { ...hours, closed: !e.target.checked },
                      },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
              </label>
              {!hours.closed && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        operatingHours: {
                          ...settings.operatingHours,
                          [day]: { ...hours, open: e.target.value },
                        },
                      })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        operatingHours: {
                          ...settings.operatingHours,
                          [day]: { ...hours, close: e.target.value },
                        },
                      })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </>
              )}
              {hours.closed && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Service Areas */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Service Areas</h3>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Delivery Radius (km)
          </label>
          <input
            type="number"
            value={settings.deliveryRadius}
            onChange={(e) => setSettings({ ...settings, deliveryRadius: parseInt(e.target.value) || 0 })}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            min="1"
            max="50"
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Add Service Area
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addServiceArea()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter area name (e.g., Sector 5, Downtown)"
            />
            <button
              onClick={addServiceArea}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
        {settings.serviceAreas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {settings.serviceAreas.map((area, idx) => (
              <span
                key={idx}
                className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                {area}
                <button
                  onClick={() => removeServiceArea(area)}
                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoAcceptOrders}
            onChange={(e) => setSettings({ ...settings, autoAcceptOrders: e.target.checked })}
            className="rounded border-gray-300"
          />
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Auto-accept Orders</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically accept incoming orders without manual approval
            </p>
          </div>
        </label>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

