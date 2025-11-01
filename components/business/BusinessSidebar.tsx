"use client";

interface BusinessSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function BusinessSidebar({ activeSection, setActiveSection }: BusinessSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders & Deliveries", icon: "📦" },
    { id: "inventory", label: "Inventory Management", icon: "📋" },
    { id: "subscriptions", label: "Subscriptions / Premium", icon: "⭐" },
    { id: "analytics", label: "Analytics & Reports", icon: "📈" },
    { id: "settings", label: "Store Settings", icon: "⚙️" },
    { id: "support", label: "Support / Help", icon: "🆘" },
  ];

  return (
    <div className="w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="sticky top-0 h-screen overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Portal</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Navigation</p>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                activeSection === item.id
                  ? "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Need Help?</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Contact support or check our help center for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

