"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const welcomeLines = [
  "Welcome.",
  "",
  "You said yes — and now, the adventure begins.",
  "",
  "This space was designed for the two of you.",
  "Not for the opinions, not for the stress,",
  "not for the endless tabs and spreadsheets.",
  "",
  "Just you. Just this.",
  "Just the joy of planning something beautiful together.",
  "",
  "We'll keep things simple.",
  "One page at a time. One decision at a time.",
  "",
  "Congratulations.",
  "We're so glad you're here.",
];

export default function WelcomePage() {
  const router = useRouter();
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showContinue, setShowContinue] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isLineComplete, setIsLineComplete] = useState(false);

  useEffect(() => {
    if (currentLineIndex >= welcomeLines.length) {
      setTimeout(() => setShowContinue(true), 500);
      return;
    }

    const currentLine = welcomeLines[currentLineIndex];
    
    // If empty line, just add it and move on
    if (currentLine === "") {
      setDisplayedLines((prev) => [...prev, ""]);
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
      }, 300);
      return;
    }

    // If line is complete, add to displayed and move to next
    if (isLineComplete) {
      setDisplayedLines((prev) => [...prev, currentLine]);
      setCurrentText("");
      setIsLineComplete(false);
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
      }, 400);
      return;
    }

    // Type out the current line
    if (currentText.length < currentLine.length) {
      const timeout = setTimeout(() => {
        setCurrentText(currentLine.slice(0, currentText.length + 1));
      }, 40);
      return () => clearTimeout(timeout);
    } else {
      // Line typing complete, mark it
      setIsLineComplete(true);
    }
  }, [currentLineIndex, currentText, isLineComplete]);

  const handleContinue = async () => {
    // Mark onboarding as complete
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleSkip = async () => {
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const isTyping = currentLineIndex < welcomeLines.length && !isLineComplete;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-lg">
        <div className="min-h-[400px] flex flex-col justify-center">
          {displayedLines.map((line, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-lg font-light leading-relaxed ${
                line === "" ? "h-6" : ""
              } ${
                line === "Welcome." || line === "Congratulations."
                  ? "font-serif text-2xl tracking-wide"
                  : "text-warm-600"
              }`}
            >
              {line}
            </motion.p>
          ))}
          
          {isTyping && currentText && (
            <p
              className={`text-lg font-light leading-relaxed ${
                welcomeLines[currentLineIndex] === "Welcome." ||
                welcomeLines[currentLineIndex] === "Congratulations."
                  ? "font-serif text-2xl tracking-wide"
                  : "text-warm-600"
              }`}
            >
              {currentText}
              <span className="animate-pulse">|</span>
            </p>
          )}
        </div>

        <AnimatePresence>
          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
              <Button onClick={handleContinue} variant="outline" size="lg">
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button for those who've seen it before */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleSkip}
            className="text-xs tracking-wider uppercase text-warm-400 hover:text-warm-500 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </main>
  );
}
