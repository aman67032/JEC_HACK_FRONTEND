"use client";

import { useState, useEffect, useRef } from "react";
import { firebaseAuth, firestoreDb } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth(), (user) => {
      setUser(user);
      if (user) {
        const convId = `conv_${user.uid}_${Date.now()}`;
        setConversationId(convId);
        initializeConversation(convId);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async (convId: string) => {
    const systemMessage: Message = {
      role: "system",
      content: "You are Baymax, the Health Connect Assistant — a calm, professional, and caring digital health companion. You help patients, caretakers, and doctors use the Health Connect dashboard and features. Be concise and empathetic. Explain steps clearly and safely. Do not provide medical diagnoses.\n\nKey features: Medication List, Scan Prescription (OCR), Drug Interaction Checker, Medicine Schedule & Reminders, Smart Med Card (QR), Emergency (SOS), History & Reports, Caretaker & Doctor workflows, Privacy & Security.\n\nReply format: 1-2 line empathic summary, then 2-5 actionable steps, then a short tip/warning if relevant.",
    };

    try {
      const convRef = doc(firestoreDb(), "conversations", convId);
      const convDoc = await getDoc(convRef);
      
      if (!convDoc.exists()) {
        await setDoc(convRef, {
          conversation_id: convId,
          messages: [systemMessage],
          created_at: serverTimestamp(),
          active: true,
          user_id: user?.uid || "anonymous",
        });
        setMessages([systemMessage]);
      } else {
        const data = convDoc.data();
        setMessages(data.messages || [systemMessage]);
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
      setMessages([systemMessage]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !conversationId) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get auth token for API request
      let authHeader: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (user) {
        const token = await user.getIdToken();
        authHeader["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
          role: "user",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I'm here to help! How can I assist you?",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Show more helpful error message
      let errorMessage = "I'm sorry, I'm having trouble connecting. Please try again later.";
      
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (error.message?.includes("Server error: 500")) {
        errorMessage = "Server error: The service is temporarily unavailable. Please try again in a moment.";
      } else if (error.message?.includes("Server error: 401")) {
        errorMessage = "Authentication error: Please refresh the page and try again.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      const errorMsg: Message = {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button with Pulse Animation */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-fade-in">
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></div>
          {/* Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-red-500/50 active:scale-95 border-2 border-red-500/20"
            aria-label="Toggle chatbot"
          >
            <img 
              src="/chatbot_emo.jpg" 
              alt="Baymax Chatbot" 
              className="h-full w-full object-cover rounded-full"
            />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
            </span>
          </button>
        </div>
      )}

      {/* Chat Window with Slide Animation */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 left-4 z-50 flex h-[calc(100vh-140px)] max-h-[650px] w-full max-w-[420px] md:right-6 md:left-auto md:w-[420px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl animate-slide-up">
          {/* Header with Red Background */}
          <div className="relative flex items-center justify-between bg-red-600 px-6 py-4 shadow-lg">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
            </div>
            
            <div className="relative flex items-center gap-3">
              {/* Avatar with Status */}
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-white shadow-md overflow-hidden">
                  <img 
                    src="/chatbot_emo.jpg" 
                    alt="Baymax" 
                    className="h-full w-full object-cover rounded-full"
                  />
                </div>
                {/* Online Status Indicator */}
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-400 shadow-lg"></div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white drop-shadow-sm">Baymax Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="relative rounded-lg p-2 text-white transition-all hover:bg-white/20 hover:rotate-90 active:scale-90"
              aria-label="Close chat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container with Gradient Overlay */}
          <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white">
            {/* Scrollable Messages */}
            <div className="h-full overflow-y-auto p-6 space-y-4 scroll-smooth">
              {messages.filter((msg) => msg.role !== "system").length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 border-2 border-red-200 overflow-hidden">
                      <img 
                        src="/chatbot_emo.jpg" 
                        alt="Baymax" 
                        className="h-full w-full object-cover rounded-full"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Start a conversation</p>
                    <p className="mt-1 text-xs text-gray-400">Ask me anything about Health Connect</p>
                  </div>
                </div>
              )}
              
              {messages
                .filter((msg) => msg.role !== "system")
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Avatar for Assistant */}
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border-2 border-red-100 shadow-md overflow-hidden">
                        <img 
                          src="/chatbot_emo.jpg" 
                          alt="Baymax" 
                          className="h-full w-full object-cover rounded-full"
                        />
                      </div>
                    )}
                    
                    <div className="flex max-w-[75%] flex-col">
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-lg ${
                          msg.role === "user"
                            ? "bg-red-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border border-red-100 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-gray-800"}`}>
                          {msg.content}
                        </p>
                      </div>
                      {msg.timestamp && (
                        <p className={`mt-1.5 text-[10px] px-1 ${msg.role === "user" ? "text-right text-gray-400" : "text-left text-gray-400"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    
                    {/* Avatar for User */}
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-md">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Enhanced Loading Animation */}
              {loading && (
                <div className="flex justify-start gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border-2 border-red-100 shadow-md overflow-hidden">
                    <img 
                      src="/chatbot_emo.jpg" 
                      alt="Baymax" 
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-red-100">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-red-500" style={{ animationDelay: "0ms" }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: "150ms" }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-red-300" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Gradient Fade at Top */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/80 to-transparent"></div>
            {/* Gradient Fade at Bottom */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent"></div>
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200/50 bg-gradient-to-r from-white via-gray-50/50 to-white p-4 backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/50 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
              >
                <svg className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium">Enter</kbd> to send
            </p>
          </div>
        </div>
      )}
      
    </>
  );
}
