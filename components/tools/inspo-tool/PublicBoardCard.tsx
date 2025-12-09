"use client";

import Image from 'next/image';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Globe } from 'lucide-react';

import type { Board } from '@/lib/db/schema'; // Already updated

// --- Types ---
interface BoardWithMeta extends Board { // Updated from Palette to Board
  tenant: {
    displayName: string;
  } | null;
  coverImage?: string;
}

interface PublicBoardCardProps {
  board: BoardWithMeta;
  onClick: (b: BoardWithMeta) => void; // Updated parameter name
}

export function PublicBoardCard({ board, onClick }: PublicBoardCardProps) {
    return (
        <Card 
            className="cursor-pointer rounded-3xl h-full shadow-soft transition-all duration-200 hover:translate-y-[-4px] hover:shadow-medium"
            onClick={() => onClick(board)}
        >
            <div className="h-48 bg-muted flex items-center justify-center overflow-hidden rounded-t-3xl">
                {board.coverImage ? (
                    <Image src={`${board.coverImage}?w=400&auto=format`} alt={board.name} width={400} height={200} className="w-full h-full object-cover" unoptimized />
                ) : (
                    <Globe className="h-16 w-16 text-muted-foreground/50" />
                )}
            </div>
            <CardContent className="p-4">
                <CardTitle className="font-serif text-lg leading-tight mb-1">{board.name}</CardTitle>
                {board.tenant?.displayName && ( // Updated to displayName
                    <p className="text-xs text-muted-foreground">
                        by {board.tenant.displayName}
                    </p>
                )}
                {board.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {board.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
