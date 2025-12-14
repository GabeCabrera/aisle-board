"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pin } from "lucide-react";

import type { Board, Idea } from '@/lib/db/schema'; // Updated import

interface IdeaWithTags extends Idea { // Updated from Spark to Idea
  tags: string[];
}

interface SaveIdeaDialogProps {
  open: boolean;
  onClose: () => void;
  idea: IdeaWithTags | null;
  myBoards: Board[];
  onSaved: () => void;
}

export function SaveIdeaDialog({ open, onClose, idea, myBoards, onSaved }: SaveIdeaDialogProps) {
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (myBoards.length > 0 && !selectedBoardId) {
            setSelectedBoardId(myBoards[0].id);
        }
    }, [myBoards, selectedBoardId]);

    const handleSave = async () => {
        if (!idea || !selectedBoardId) return;
        setIsLoading(true);

        try {
            const response = await fetch('/api/ideas/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalIdeaId: idea.id, targetBoardId: selectedBoardId }), // Updated from selectedPaletteId
            });

            if (response.ok) {
                toast.success("Idea saved to your board!");
                onSaved();
                onClose();
            } else {
                toast.error("Failed to save idea.");
            }
        } catch (error) {
            toast.error("Failed to save idea.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Save to Board</DialogTitle>
                    <DialogDescription>Select a board to save this idea to.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="board-select">Select Board</Label> {/* Updated from palette-select */}
                    <Select value={selectedBoardId} onValueChange={setSelectedBoardId} disabled={isLoading}>
                        <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Select a board" /> {/* Updated from palette */}
                        </SelectTrigger>
                        <SelectContent>
                            {myBoards.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-lg">Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="rounded-lg">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Pin className="mr-2 h-4 w-4" /> Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
