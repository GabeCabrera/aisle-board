"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Logo } from "@/components/logo";

type ConversationStage = "names" | "planner-name" | "chatting";

const PLANNER_NAMES = [
  { name: "Margot", vibe: "organized & thoughtful" },
  { name: "Jules", vibe: "easygoing & reliable" },
  { name: "Wren", vibe: "creative & attentive" },
  { name: "Ellis", vibe: "warm & practical" },
  { name: "Sage", vibe: "calm & supportive" },
  { name: "Quinn", vibe: "friendly & efficient" },
];

export function LandingPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi there. What are your names?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<ConversationStage>("names");
  const [coupleNames, setCoupleNames] = useState("");
  const [selectedPlanner, setSelectedPlanner] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectPlanner = (name: string) => {
    setSelectedPlanner(name);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: name },
      { role: "assistant", content: `Nice to meet you. I'm ${name}, and I'll be here whenever you need me.\n\nWhat's on your mind?` }
    ]);
    setStage("chatting");
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    if (stage === "names") {
      setCoupleNames(userMessage);
      setTimeout(() => {
        const firstName = userMessage.split(/[&,]|and/i)[0]?.trim() || "Hey";
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: `${firstName}, nice to meet you both.\n\nI'll be helping you plan your wedding. What would you like to call me?`
          }
        ]);
        setStage("planner-name");
        setIsTyping(false);
      }, 800);
      return;
    }

    if (stage === "chatting") {
      try {
        const response = await fetch("/api/concierge/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage,
            plannerName: selectedPlanner,
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
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-warm-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-warm-100 bg-white">
        <Logo size="sm" href="/" />
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
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <div className="flex-1 overflow-y-auto px-6 py-12 space-y-6">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-warm-800 text-white rounded-br-md"
                    : "bg-white border border-warm-200 text-warm-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Planner name selection */}
          {stage === "planner-name" && !isTyping && (
            <div className="flex flex-wrap gap-2 justify-start pl-4">
              {PLANNER_NAMES.map(({ name }) => (
                <button
                  key={name}
                  onClick={() => handleSelectPlanner(name)}
                  className="px-4 py-2 bg-white border border-warm-200 rounded-full text-sm text-warm-700 hover:border-warm-400 hover:bg-warm-50 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-warm-200 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {/* Sign up prompt after chatting for a bit */}
          {stage === "chatting" && messages.length >= 8 && (
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

        {/* Input */}
        {stage !== "planner-name" && (
          <div className="p-4 border-t border-warm-100 bg-white">
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
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
                placeholder={stage === "names" ? "e.g. Sarah & Mike" : "Type a message..."}
                className="flex-1 resize-none px-4 py-3 bg-warm-50 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm max-h-32"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="h-11 w-11 flex items-center justify-center bg-warm-800 hover:bg-warm-900 disabled:bg-warm-300 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
