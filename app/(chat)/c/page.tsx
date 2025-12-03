"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Artifact } from "@/components/artifacts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifact?: {
    type: string;
    data: unknown;
  };
}

const thinkingMessages = [
  "Reading your message...",
  "Thinking about your wedding...",
  "Considering the details...",
  "Crafting a response...",
  "Almost ready...",
];

const leftRingPaths = [
  "M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22",
  "M 4.5 22 C 4 13, 9 11.5, 14 12 C 20 12.5, 24.5 16, 24 22 C 23.5 29, 19 32.5, 14 32 C 8 31.5, 4.5 27, 4.5 22",
  "M 4 21.5 C 4.5 14, 8.5 12.5, 14 12.5 C 20.5 12, 24 15.5, 24 22.5 C 24 28.5, 20 31.5, 14 31.5 C 7.5 32, 3.5 28, 4 21.5",
  "M 4.2 22.2 C 3.8 14.5, 8 12, 14.2 12.2 C 20.5 11.8, 24.2 15.8, 23.8 22 C 24 29.2, 19.5 32, 13.8 31.8 C 7.8 32.2, 4 28.5, 4.2 22.2",
];

const rightRingPaths = [
  "M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22",
  "M 16.5 22 C 16 13, 21 11.5, 26 12 C 32 12.5, 36.5 16, 36 22 C 35.5 29, 31 32.5, 26 32 C 20 31.5, 16.5 27, 16.5 22",
  "M 16 21.5 C 16.5 14, 20.5 12.5, 26 12.5 C 32.5 12, 36 15.5, 36 22.5 C 36 28.5, 32 31.5, 26 31.5 C 19.5 32, 15.5 28, 16 21.5",
  "M 16.2 22.2 C 15.8 14.5, 20 12, 26.2 12.2 C 32.5 11.8, 36.2 15.8, 35.8 22 C 36 29.2, 31.5 32, 25.8 31.8 C 19.8 32.2, 16 28.5, 16.2 22.2",
];

function SketchyLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d={leftRingPaths[0]} stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={rightRingPaths[0]} stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function ThinkingLogo({ size = 32 }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), 150);
    return () => clearInterval(interval);
  }, []);

  const transforms = [
    { rotate: -2, scale: 1, x: 0, y: 0 },
    { rotate: 1, scale: 1.02, x: 0.5, y: -0.5 },
    { rotate: -1, scale: 0.98, x: -0.5, y: 0 },
    { rotate: 2, scale: 1.01, x: 0, y: 0.5 },
  ];
  const t = transforms[frame];

  return (
    <div style={{ transform: `rotate(${t.rotate}deg) scale(${t.scale}) translate(${t.x}px, ${t.y}px)`, width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d={leftRingPaths[frame]} stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={rightRingPaths[frame]} stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function ThinkingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex(prev => (prev + 1) % thinkingMessages.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="flex-shrink-0 mt-1">
        <ThinkingLogo size={48} />
      </div>
      <p className="text-stone-500 text-sm pt-3">{thinkingMessages[messageIndex]}</p>
    </div>
  );
}

export default function ChatPage() {
  const { status } = useSession();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  // Load existing conversation on mount
  useEffect(() => {
    if (status === "authenticated" && !hasLoaded) {
      loadConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadConversation = async () => {
    setHasLoaded(true);
    setIsLoading(true);
    try {
      // First try to load existing conversation
      const loadResponse = await fetch("/api/chat/load");
      const loadData = await loadResponse.json();
      
      if (loadData.conversationId && loadData.messages?.length > 0) {
        // We have an existing conversation, restore it
        setConversationId(loadData.conversationId);
        setMessages(loadData.messages.map((m: { role: string; content: string; artifact?: { type: string; data: unknown } }, i: number) => ({
          id: `loaded-${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          artifact: m.artifact,
        })));
      } else {
        // No existing conversation, get a greeting
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: null, conversationId: null }),
        });
        const data = await response.json();
        if (response.ok && data.message) {
          setConversationId(data.conversationId);
          setMessages([{
            id: Date.now().toString(),
            role: "assistant",
            content: data.message,
            artifact: data.artifact,
          }]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (status === "unauthenticated") {
      signIn("google");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setError(null);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        artifact: data.artifact,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <ThinkingLogo size={64} />
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {/* Empty state */}
          {!hasMessages && !isLoading && status === "unauthenticated" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <SketchyLogo size={80} className="mb-6" />
              <h1 className="font-serif tracking-[0.2em] uppercase text-stone-600 text-2xl mb-2">Aisle</h1>
              <p className="text-stone-500 text-center max-w-md">Your wedding planner. Tell me about your big day.</p>
            </div>
          )}
          
          {/* Messages */}
          {hasMessages && (
            <div className="space-y-6 pt-8">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-rose-100/80 text-stone-700 px-4 py-3 rounded-2xl rounded-br-md max-w-[80%] border border-rose-200/50">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <SketchyLogo size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-stone-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        {msg.artifact && (
                          <Artifact type={msg.artifact.type} data={msg.artifact.data} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Thinking */}
          {isLoading && (
            <div className={hasMessages ? "mt-6" : "mt-8"}>
              <ThinkingIndicator />
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 mt-6">
              <SketchyLogo size={24} />
              <p className="text-red-600 text-sm">Oops! {error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={status === "unauthenticated" ? "Sign in to start planning..." : "Tell me about your wedding..."}
            className="flex-1 border border-stone-300 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-rose-400 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-500 transition-colors font-medium"
          >
            {status === "unauthenticated" ? "Sign in" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
