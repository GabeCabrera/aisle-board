"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash, Edit, ExternalLink, Pin } from "lucide-react";
import Image from 'next/image';

import type { Palette, Spark } from '@/lib/db/schema';

// Import the SaveSparkDialog for nested usage
import { SaveSparkDialog } from './SaveSparkDialog';

interface SparkWithTags extends Spark {
  tags: string[];
}

interface SparkDetailDialogProps {
  spark: SparkWithTags | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (spark: SparkWithTags) => void;
  isOwner: boolean;
  onSave?: (spark: SparkWithTags) => void;
  myPalettes: Palette[]; // Passed to SaveSparkDialog
}

export function SparkDetailDialog({ spark, open, onClose, onDelete, onEdit, isOwner, onSave, myPalettes }: SparkDetailDialogProps) {
    if (!spark) return null;

    const [openSaveDialog, setOpenSaveDialog] = useState(false); // Local state for SaveSparkDialog
    const handleSaveClick = () => {
        setOpenSaveDialog(true);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row rounded-xl">
                <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                    <img 
                        src={spark.imageUrl} 
                        alt={spark.title || "Spark"} 
                        className="max-w-full max-h-[80vh] object-contain" 
                    />
                </div>
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <DialogTitle className="font-serif text-2xl font-bold">
                            {spark.title || "Untitled Spark"}
                        </DialogTitle>
                        <div className="flex items-center space-x-2">
                            {isOwner ? (
                                <>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(spark)} className="rounded-full"><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(spark.id)} className="rounded-full text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button>
                                </>
                            ) : (
                                <Button 
                                    onClick={handleSaveClick}
                                    className="rounded-full"
                                    size="sm"
                                >
                                    <Pin className="mr-2 h-4 w-4" /> Save
                                </Button>
                            )}
                        </div>
                    </div>

                    {spark.description && (
                        <DialogDescription className="text-muted-foreground mb-4">
                            {spark.description}
                        </DialogDescription>
                    )}

                    {spark.tags && spark.tags.length > 0 && (
                        <div className="mb-4">
                            <Label className="text-sm font-medium">Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {spark.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-border/70">
                        {spark.sourceUrl && (
                            <Button 
                                variant="outline" 
                                asChild 
                                className="w-full rounded-full mb-2"
                            >
                                <a href={spark.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> Visit Source
                                </a>
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                            Added {new Date(spark.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </DialogContent>
            {onSave && spark && (
                <SaveSparkDialog 
                    open={openSaveDialog} 
                    onClose={() => setOpenSaveDialog(false)} 
                    spark={spark} 
                    myPalettes={myPalettes} 
                    onSaved={onSave ? () => onSave(spark) : () => {}} 
                />
            )}
        </Dialog>
    );
}
