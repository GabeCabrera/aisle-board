"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  text: string;
  className?: string;
  onComplete?: () => void;
  cursorColor?: string;
}

export function Typewriter({ 
  text, 
  className, 
  onComplete,
  cursorColor = "bg-rose-400"
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const typeNextCharacter = () => {
      if (!isMounted) return;

      if (currentIndex >= text.length) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // Calculate delay based on punctuation for natural feel
      let delay = 20; // Base speed (faster)
      const char = text[currentIndex];
      const nextChar = text[currentIndex + 1];

      if (char === "." || char === "?" || char === "!") {
        delay = 400; // Sentence pause
      } else if (char === "," || char === ";") {
        delay = 150; // Clause pause
      } else if (char === "\n") {
        delay = 300; // Paragraph pause
      } else if (currentIndex === 0) {
        delay = 100; // Initial pause
      }

      // Slight randomization
      delay += Math.random() * 15;

      setDisplayedText(text.substring(0, currentIndex + 1));
      currentIndex++;

      timeoutId = setTimeout(typeNextCharacter, delay);
    };

    // Start typing
    timeoutId = setTimeout(typeNextCharacter, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [text]); // Intentionally excluding onComplete to avoid reset on re-render

  // Auto-scroll logic integration hook could be here, 
  // but usually handled by parent observing the content size change.

  return (
    <div className={cn("whitespace-pre-wrap leading-relaxed font-serif tracking-wide", className)} ref={containerRef}>
      {displayedText}
      {!isComplete && (
        <span 
          className={cn(
            "inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse",
            cursorColor
          )} 
        />
      )}
    </div>
  );
}
