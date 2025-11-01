"use client";

import { useState } from "react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export default function BusinessSubscriptions({ businessId }: { businessId: string | null }) {
  const [currentPlan, setCurrentPlan] = useState<string>("premium");
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    active: true,
    plan: "Premium Visibility",
    expiresAt: "2025-12-31",
    monthlyCost: 2999,
  });

  const plans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic Listing",
      price: 0,
      features: [
        "Basic store listing",
        "Standard search visibility",
        "Order management",
        "Basic analytics",
      ],
    },
    {
      id: "standard",
      name: "Standard Visibility",
      price: 1499,
      features: [
        "Enhanced search ranking",
        "Featured in category pages",
        "Order management",
        "Advanced analytics",
        "Priority customer support",
      ],
    },
    {
      id: "premium",
      name: "Premium Visibility",
      price: 2999,
      features: [
        "Top search results placement",
        "Featured on homepage",
        "Highlighted on maps",
        "Order management",
        "Full analytics & reports",
        "24/7 priority support",
        "Custom store branding",
      ],
      popular: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscriptions / Premium Visibility
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription and enhance your store visibility
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200">
              Current Subscription
            </h3>
            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              {subscriptionStatus.active ? (
                <>
                  <span className="font-medium">{subscriptionStatus.plan}</span> • Active until{" "}
                  {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}
                </>
              ) : (
                "No active subscription"
              )}
            </p>
          </div>
          {subscriptionStatus.active && (
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Active
            </span>
          )}
        </div>
        {subscriptionStatus.active && (
          <div className="mt-4 rounded-lg bg-white p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{subscriptionStatus.monthlyCost.toLocaleString()}
              </span>
            </div>
            <button className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              Manage Subscription
            </button>
          </div>
        )}
      </div>

      {/* Subscription Plans */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Available Plans
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 ${
                plan.popular
                  ? "border-purple-500 bg-purple-50 shadow-lg dark:border-purple-600 dark:bg-purple-950"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white">
                    Popular
                  </span>
                </div>
              )}
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                    plan.id === currentPlan
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : plan.popular
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.id === currentPlan ? "Current Plan" : plan.price === 0 ? "Free Forever" : "Upgrade Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Features */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Premium Visibility Features
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 text-2xl">🗺️</div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Map Highlighting</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your store appears prominently on location-based searches
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 text-2xl">🔍</div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Search Priority</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get listed at the top of relevant search results
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 text-2xl">⭐</div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Featured Badge</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Special badge to highlight your verified status
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 text-2xl">📊</div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Advanced Analytics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed insights into customer behavior and sales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

