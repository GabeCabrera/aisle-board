"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TagIcon, Loader2 } from "lucide-react"; // Using Lucide for icon

interface AddIdeaDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  onIdeaAdded: () => void;
}

export function AddIdeaDialog({ open, onClose, boardId, onIdeaAdded }: AddIdeaDialogProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddIdea = async () => {
        if (!imageUrl.trim()) {
            toast.error("Image URL is required.");
            return;
        }
        setIsLoading(true);

        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        try {
            const response = await fetch('/api/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId, imageUrl, title, description, tags }),
            });

            if (response.ok) {
                toast.success("Idea added!");
                onIdeaAdded();
                onClose();
                setImageUrl("");
                setTitle("");
                setDescription("");
                setTagsInput("");
            } else {
                toast.error("Failed to add Idea.");
            }
        } catch (error) {
            console.error("Failed to add idea", error);
            toast.error("Failed to add Idea.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Add a new Idea</DialogTitle>
                    <DialogDescription>
                        Add an image URL and details to your inspiration board.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input 
                            id="imageUrl" 
                            type="url" 
                            placeholder="https://example.com/image.jpg" 
                            value={imageUrl} 
                            onChange={(e) => setImageUrl(e.target.value)} 
                            required 
                            disabled={isLoading}
                            className="rounded-lg h-10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title (optional)</Label>
                        <Input 
                            id="title" 
                            type="text" 
                            placeholder="Boho Chic Wedding Dress" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            disabled={isLoading}
                            className="rounded-lg h-10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea 
                            id="description" 
                            placeholder="Describe your inspiration here..." 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            disabled={isLoading}
                            className="rounded-lg min-h-[80px]"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="tags" 
                                type="text" 
                                placeholder="e.g., boho, dress, outdoor" 
                                value={tagsInput} 
                                onChange={(e) => setTagsInput(e.target.value)} 
                                disabled={isLoading}
                                className="pl-10 rounded-lg h-10"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-lg">Cancel</Button>
                    <Button onClick={handleAddIdea} disabled={isLoading} className="rounded-lg">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Idea
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
