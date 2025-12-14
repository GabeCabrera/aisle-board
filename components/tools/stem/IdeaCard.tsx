"use client";

import React, { useState } from "react";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";

import type { Idea } from '@/lib/db/schema'; // Updated import

interface IdeaWithTags extends Idea { // Updated from Spark to Idea
  tags: string[];
}

interface IdeaCardProps {
  idea: IdeaWithTags;
  onClick: (idea: IdeaWithTags) => void; // Updated parameter name
  isOwner: boolean;
  onSave?: (idea: IdeaWithTags) => void;
}

export function IdeaCard({ idea, onClick, isOwner, onSave }: IdeaCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative rounded-3xl overflow-hidden cursor-zoom-in shadow-soft transition-all duration-200 group-hover:translate-y-[-4px] group-hover:shadow-medium"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick(idea)} // Updated variable name
        >
            <Image
                src={idea.imageUrl}
                alt={idea.title || "Idea"}
                width={400}
                height={400} // Adjust based on common aspect ratios or make dynamic
                className="w-full h-auto object-cover"
                unoptimized // Use unoptimized for external images or adjust loader
            />
            
            {/* Hover Overlay */}
            <div className={cn(
                "absolute inset-0 bg-black/40 flex flex-col justify-between p-4 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0"
            )}>
                <div className="flex justify-end">
                    {!isOwner && onSave && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave(idea);
                            }}
                        >
                            <Pin className="h-4 w-4 mr-1" /> Save
                        </Button>
                    )}
                </div>
                <div>
                    {idea.title && (
                        <p className="text-white font-bold text-lg leading-tight truncate">{idea.title}</p>
                    )}
                    {idea.tags && idea.tags.length > 0 && (
                        <p className="text-white text-xs opacity-80 truncate">
                            {idea.tags.slice(0, 3).join(", ")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
