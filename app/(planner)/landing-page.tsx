"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

function ScribblyLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      {/* Left circle - slightly wobbly */}
      <path
        d="M17 34c-6.5-0.5-11-5.5-10.5-12s5.5-11.5 12-11c6.5 0.5 11 5.8 10.5 12.2s-5.5 11.3-12 10.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="text-warm-600"
      />
      {/* Right circle - slightly wobbly */}
      <path
        d="M31 34c6.5-0.3 11.2-5.3 10.8-11.8s-5.3-11.7-11.8-11.2c-6.5 0.5-11.2 5.6-10.8 12.1s5.3 11.2 11.8 10.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="text-warm-600"
      />
    </svg>
  );
}

export function LandingPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [coupleNames, setCoupleNames] = useState("");
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    if (!hasIntroduced) {
      setCoupleNames(userMessage);
      setTimeout(() => {
        const firstName = userMessage.split(/[&,]|and/i)[0]?.trim() || "Hey";
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: `${firstName}, nice to meet you both. I'm Aisle, and I'll be here whenever you need me.\n\nWhat's on your mind?`
          }
        ]);
        setHasIntroduced(true);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("/api/concierge/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          coupleNames 
        }),
      });

      const data = await response.json();

      if (data.requiresAuth) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'd love to keep helping. Create a free account to save our conversation and pick up where we left off.",
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again?" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const hasStarted = messages.length > 0;

  return (
    <main className="min-h-screen flex flex-col bg-warm-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <ScribblyLogo className="w-8 h-8" />
          <span className="text-warm-700 font-medium">Aisle</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-warm-600 hover:text-warm-800 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 bg-warm-800 text-white rounded-full hover:bg-warm-900 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6">
        {!hasStarted ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center pb-32">
            <ScribblyLogo className="w-16 h-16 mb-8 text-warm-400" />
            <h1 className="text-2xl text-warm-800 text-center mb-2">
              Hi there. What are your names?
            </h1>
            <p className="text-warm-500 text-center text-sm mb-8">
              I'm Aisle. I'm here to help you plan your wedding.
            </p>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto py-8 space-y-6">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 mr-3 flex-shrink-0">
                    <ScribblyLogo className="w-8 h-8 text-warm-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-warm-800 text-white px-4 py-3 rounded-2xl rounded-br-sm"
                      : "text-warm-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="w-8 h-8 mr-3 flex-shrink-0">
                  <ScribblyLogo className="w-8 h-8 text-warm-400" />
                </div>
                <div className="flex gap-1 py-2">
                  <span className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-warm-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Sign up prompt after chatting for a bit */}
            {hasIntroduced && messages.length >= 6 && (
              <div className="text-center py-4">
                <p className="text-sm text-warm-500 mb-3">
                  Save this conversation and access your planning tools
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-warm-800 text-white text-sm rounded-full hover:bg-warm-900 transition-colors"
                >
                  Create free account
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={!hasStarted ? "e.g. Sarah & Mike" : "Message..."}
                className="w-full resize-none px-4 py-3 bg-white border border-warm-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-warm-300 focus:border-transparent text-sm max-h-32 pr-12"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 bottom-2 h-8 w-8 flex items-center justify-center bg-warm-800 hover:bg-warm-900 disabled:bg-warm-200 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
