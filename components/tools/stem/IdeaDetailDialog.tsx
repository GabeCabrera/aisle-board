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

import type { Board, Idea } from '@/lib/db/schema'; // Updated import

// Import the SaveIdeaDialog for nested usage
import { SaveIdeaDialog } from './SaveIdeaDialog';

interface IdeaWithTags extends Idea { // Updated from Spark to Idea
  tags: string[];
}

interface IdeaDetailDialogProps {
  idea: IdeaWithTags | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (idea: IdeaWithTags) => void; // Updated parameter name
  isOwner: boolean;
  onSave?: (idea: IdeaWithTags) => void;
  myBoards: Board[]; // Passed to SaveIdeaDialog
}

export function IdeaDetailDialog({ idea, open, onClose, onDelete, onEdit, isOwner, onSave, myBoards }: IdeaDetailDialogProps) {
    const [openSaveDialog, setOpenSaveDialog] = useState(false); // Local state for SaveIdeaDialog
    
    if (!idea) return null;

    const handleSaveIdeaClick = () => {
        setOpenSaveDialog(true);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row rounded-xl">
                <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                    <img 
                        src={idea.imageUrl} 
                        alt={idea.title || "Idea"} 
                        className="max-w-full max-h-[80vh] object-contain" 
                    />
                </div>
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <DialogTitle className="font-serif text-2xl font-bold">
                            {idea.title || "Untitled Idea"}
                        </DialogTitle>
                        <div className="flex items-center space-x-2">
                            {isOwner ? (
                                <>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(idea)} className="rounded-full"><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(idea.id)} className="rounded-full text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button>
                                </>
                            ) : (
                                <Button 
                                    onClick={handleSaveIdeaClick}
                                    className="rounded-full"
                                    size="sm"
                                >
                                    <Pin className="mr-2 h-4 w-4" /> Save
                                </Button>
                            )}
                        </div>
                    </div>

                    {idea.description && (
                        <DialogDescription className="text-muted-foreground mb-4">
                            {idea.description}
                        </DialogDescription>
                    )}

                    {idea.tags && idea.tags.length > 0 && (
                        <div className="mb-4">
                            <Label className="text-sm font-medium">Tags</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {idea.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-border/70">
                        {idea.sourceUrl && (
                            <Button 
                                variant="outline" 
                                asChild 
                                className="w-full rounded-full mb-2"
                            >
                                <a href={idea.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> Visit Source
                                </a>
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                            Added {new Date(idea.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </DialogContent>
            {onSave && idea && (
                <SaveIdeaDialog 
                    open={openSaveDialog} 
                    onClose={() => setOpenSaveDialog(false)} 
                    idea={idea} 
                    myBoards={myBoards} 
                    onSaved={onSave ? () => onSave(idea) : () => {}} 
                />
            )}
        </Dialog>
    );
}