"use client";

import { useState } from "react";

export default function BusinessSupport() {
  const [activeTab, setActiveTab] = useState<string>("faq");

  const faqs = [
    {
      question: "How do I update my inventory?",
      answer:
        "Go to Inventory Management section, click on 'Add Medicine' to add new items, or click 'Edit' on existing items to update quantities, prices, or expiry dates.",
    },
    {
      question: "How does premium visibility work?",
      answer:
        "Premium visibility subscription helps your store appear at the top of search results, get highlighted on maps, and receive priority placement. You can upgrade from the Subscriptions section.",
    },
    {
      question: "How do I track deliveries?",
      answer:
        "All active deliveries are shown in the Orders & Deliveries section with real-time tracking. You can update order status as it moves through processing, dispatched, in-transit, and delivered stages.",
    },
    {
      question: "What payment methods do you support?",
      answer:
        "We support multiple payment gateways including credit/debit cards, UPI, net banking, and wallet payments. Payment is processed securely through our partner payment processors.",
    },
    {
      question: "How do I add or remove service areas?",
      answer:
        "Go to Store Settings, scroll to Service Areas section. You can set your delivery radius and add specific areas by name. Click the × button to remove any area.",
    },
    {
      question: "Can I export my sales reports?",
      answer:
        "Yes! In the Analytics & Reports section, you can export detailed reports in PDF or CSV format for your accounting or record-keeping purposes.",
    },
  ];

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Support",
      description: "Get help via email",
      contact: "support@healthconnect.com",
      action: "Send Email",
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available 9 AM - 9 PM",
      action: "Start Chat",
    },
    {
      icon: "📞",
      title: "Phone Support",
      description: "Speak with our team",
      contact: "+91 1800-123-4567",
      action: "Call Now",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Support / Help</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Find answers to common questions or contact our support team
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {[
            { id: "faq", label: "FAQ" },
            { id: "contact", label: "Contact Support" },
            { id: "guides", label: "User Guides" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {contactMethods.map((method, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4 text-4xl">{method.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{method.title}</h3>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                <p className="mb-4 font-medium text-gray-900 dark:text-white">{method.contact}</p>
                <button className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                  {method.action}
                </button>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Send us a Message
            </h3>
            <form className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="What can we help you with?"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe your issue or question in detail..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guides Tab */}
      {activeTab === "guides" && (
        <div className="space-y-4">
          {[
            {
              title: "Getting Started with Your Business Dashboard",
              description:
                "Learn how to navigate your dashboard, manage orders, and update your store information.",
              icon: "🚀",
            },
            {
              title: "Inventory Management Guide",
              description:
                "Step-by-step guide on adding medicines, updating stock, managing licenses, and handling low stock alerts.",
              icon: "📋",
            },
            {
              title: "Order Processing & Delivery",
              description:
                "Understand how to process orders, update delivery status, track shipments, and handle customer inquiries.",
              icon: "📦",
            },
            {
              title: "Understanding Analytics & Reports",
              description:
                "Learn how to interpret your sales data, view performance metrics, and export reports for accounting.",
              icon: "📊",
            },
            {
              title: "Subscription & Premium Features",
              description:
                "Guide on selecting the right subscription plan, understanding premium visibility features, and managing your subscription.",
              icon: "⭐",
            },
          ].map((guide, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="text-3xl">{guide.icon}</div>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{guide.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{guide.description}</p>
              </div>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                Read Guide
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Tips */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950">
        <h3 className="mb-4 font-semibold text-purple-900 dark:text-purple-200">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
          <li>• Keep your inventory updated regularly to avoid stockouts</li>
          <li>• Respond to orders quickly to improve customer satisfaction</li>
          <li>• Use analytics to identify peak hours and optimize operations</li>
          <li>• Enable auto-accept orders if you have sufficient inventory</li>
          <li>• Regularly check your delivery performance metrics</li>
        </ul>
      </div>
    </div>
  );
}

