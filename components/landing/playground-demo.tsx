"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: React.ReactNode;
}

const DEMO_SCRIPTS: Record<string, React.ReactNode> = {
  "budget": (
    <div className="space-y-4">
      <p>I can definitely help with that. For a <strong>$30,000 budget</strong> with <strong>100 guests</strong> in Utah, here is a balanced breakdown:</p>
      <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 text-sm">
        <div className="flex justify-between py-1 border-b border-stone-200"><span>Venue & Catering (40%)</span> <span>$12,000</span></div>
        <div className="flex justify-between py-1 border-b border-stone-200"><span>Photography (12%)</span> <span>$3,600</span></div>
        <div className="flex justify-between py-1 border-b border-stone-200"><span>Attire & Beauty (10%)</span> <span>$3,000</span></div>
        <div className="flex justify-between py-1 border-b border-stone-200"><span>Florals & Decor (10%)</span> <span>$3,000</span></div>
        <div className="flex justify-between py-1 border-b border-stone-200"><span>Entertainment (8%)</span> <span>$2,400</span></div>
        <div className="flex justify-between py-1"><span>Planner/Coordination (10%)</span> <span>$3,000</span></div>
      </div>
      <p>Would you like me to save this to your budget tool?</p>
    </div>
  ),
  "venue": (
    <div className="space-y-4">
      <p>Ideally, you should book your venue <strong>12-14 months in advance</strong>, especially if you want a Saturday in June or September.</p>
      <p>Since you&apos;re looking at next Fall, I&apos;d recommend touring venues <strong>this month</strong>. Shall I create a checklist of questions to ask during your tours?</p>
    </div>
  ),
  "vows": (
    <div className="space-y-4">
      <p>That&apos;s a beautiful sentiment. Here&apos;s a draft incorporating your love for hiking:</p>
      <div className="italic text-stone-600 border-l-2 border-primary/30 pl-4 py-1">
        &quot;I promise to be your partner in every adventure, whether we&apos;re scaling a mountain peak or just navigating a Tuesday. I vow to always carry the snacks, check the map, and hold your hand when the trail gets steep.&quot;
      </div>
      <p>How does that feel? We can make it more serious or more playful.</p>
    </div>
  )
};

export function PlaygroundDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Scribe. I can help you plan your budget, find vendors, or just vent about seating charts. What's on your mind?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handlePrompt = async (key: string, text: string) => {
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: DEMO_SCRIPTS[key] }]);
    }, 1500);
  };

  return (
    <section className="py-24 px-6 bg-stone-900 text-stone-50 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <h2 className="font-serif text-4xl md:text-6xl mb-6">
            Try it right now.
          </h2>
          <p className="text-xl text-stone-400 mb-8 font-light leading-relaxed">
            See how Scribe turns vague ideas into concrete plans. No sign-up required to test the magic.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center shrink-0 border border-stone-700">
                <span className="font-serif text-lg">1</span>
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Pick a prompt</h3>
                <p className="text-stone-400">Choose a common wedding task to see how Scribe handles it.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center shrink-0 border border-stone-700">
                <span className="font-serif text-lg">2</span>
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Watch it work</h3>
                <p className="text-stone-400">Scribe analyzes requests and uses wedding logic to give useful answers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="relative mx-auto w-full max-w-[450px]">
          {/* Phone Frame */}
          <div className="relative bg-white text-stone-900 rounded-[2.5rem] shadow-2xl border-8 border-stone-800 h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md p-4 border-b border-stone-100 flex items-center gap-3 sticky top-0 z-10">
              <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-medium">Scribe</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full" /> Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant" ? "bg-stone-200" : "bg-primary text-white"}`}>
                    {m.role === "assistant" ? <Bot className="w-4 h-4 text-stone-600" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user" 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-white text-stone-800 border border-stone-100 rounded-tl-sm"
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area (Mock) */}
            <div className="p-4 bg-white border-t border-stone-100">
              <p className="text-xs text-stone-400 mb-3 font-medium uppercase tracking-wider">Ask Scribe to...</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handlePrompt("budget", "Create a $30k budget for 100 guests")}
                  disabled={isTyping}
                  className="text-left text-sm p-3 rounded-xl bg-stone-50 hover:bg-primary/5 hover:text-primary border border-stone-200 transition-colors truncate"
                >
                  "Create a $30k budget for 100 guests"
                </button>
                <button
                  onClick={() => handlePrompt("venue", "When should I book my venue?")}
                  disabled={isTyping}
                  className="text-left text-sm p-3 rounded-xl bg-stone-50 hover:bg-primary/5 hover:text-primary border border-stone-200 transition-colors truncate"
                >
                  "When should I book my venue?"
                </button>
                <button
                  onClick={() => handlePrompt("vows", "Help me write vows about hiking")}
                  disabled={isTyping}
                  className="text-left text-sm p-3 rounded-xl bg-stone-50 hover:bg-primary/5 hover:text-primary border border-stone-200 transition-colors truncate"
                >
                  "Help me write vows about hiking"
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
