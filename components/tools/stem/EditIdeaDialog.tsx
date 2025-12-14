"use client";

import React, { useState, useEffect } from "react";
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
import { TagIcon, Loader2 } from "lucide-react";



import type { Idea } from '@/lib/db/schema';

interface IdeaWithTags extends Idea {
  tags: string[];
}

interface EditIdeaDialogProps {
  open: boolean;
  onClose: () => void;
  idea: IdeaWithTags | null;
  onUpdate: () => void;
}

export function EditIdeaDialog({ open, onClose, idea, onUpdate }: EditIdeaDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (idea) {
            setTitle(idea.title || "");
            setDescription(idea.description || "");
            setTagsInput((idea.tags || []).join(", "));
        }
    }, [idea]);

    const handleSave = async () => {
        if (!idea) return;
        setIsLoading(true);

        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        try {
            const response = await fetch(`/api/ideas/${idea.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, tags }),
            });

            if (response.ok) {
                toast.success("Idea updated");
                onUpdate();
                onClose();
            } else {
                toast.error("Failed to update idea");
            }
        } catch (error) {
            toast.error("Failed to update spark");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Edit Idea</DialogTitle>
                    <DialogDescription>Make changes to your idea here.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} className="rounded-lg h-10" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} className="rounded-lg min-h-[80px]" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="edit-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={isLoading} className="pl-10 rounded-lg h-10" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-lg">Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="rounded-lg">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
