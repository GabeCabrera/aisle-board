"use client";

import { useState } from "react";
import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Share:</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-muted"
        asChild
      >
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-muted"
        asChild
      >
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-muted"
        onClick={copyToClipboard}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
