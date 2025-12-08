"use client";

import Image from 'next/image';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Globe } from 'lucide-react';

import type { Palette } from '@/lib/db/schema';

// --- Types ---
interface PaletteWithMeta extends Palette {
  tenantName?: string;
  coverImage?: string;
}

interface PublicPaletteCardProps {
  palette: PaletteWithMeta;
  onClick: (p: PaletteWithMeta) => void;
}

export function PublicPaletteCard({ palette, onClick }: PublicPaletteCardProps) {
    return (
        <Card 
            className="cursor-pointer rounded-3xl h-full shadow-soft transition-all duration-200 hover:translate-y-[-4px] hover:shadow-medium"
            onClick={() => onClick(palette)}
        >
            <div className="h-48 bg-muted flex items-center justify-center overflow-hidden rounded-t-3xl">
                {palette.coverImage ? (
                    <Image src={`${palette.coverImage}?w=400&auto=format`} alt={palette.name} width={400} height={200} className="w-full h-full object-cover" unoptimized />
                ) : (
                    <Globe className="h-16 w-16 text-muted-foreground/50" />
                )}
            </div>
            <CardContent className="p-4">
                <CardTitle className="font-serif text-lg leading-tight mb-1">{palette.name}</CardTitle>
                {palette.tenantName && (
                    <p className="text-xs text-muted-foreground">
                        by {palette.tenantName}
                    </p>
                )}
                {palette.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {palette.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
