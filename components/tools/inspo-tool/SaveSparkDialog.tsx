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

import type { Palette, Spark } from '@/lib/db/schema';

interface SparkWithTags extends Spark {
  tags: string[];
}

interface SaveSparkDialogProps {
  open: boolean;
  onClose: () => void;
  spark: SparkWithTags | null;
  myPalettes: Palette[];
  onSaved: () => void;
}

export function SaveSparkDialog({ open, onClose, spark, myPalettes, onSaved }: SaveSparkDialogProps) {
    const [selectedPaletteId, setSelectedPaletteId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (myPalettes.length > 0 && !selectedPaletteId) {
            setSelectedPaletteId(myPalettes[0].id);
        }
    }, [myPalettes, selectedPaletteId]);

    const handleSave = async () => {
        if (!spark || !selectedPaletteId) return;
        setIsLoading(true);

        try {
            const response = await fetch('/api/sparks/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalSparkId: spark.id, targetPaletteId: selectedPaletteId }),
            });

            if (response.ok) {
                toast.success("Spark saved to your palette!");
                onSaved();
                onClose();
            } else {
                toast.error("Failed to save spark.");
            }
        } catch (error) {
            toast.error("Failed to save spark.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Save to Palette</DialogTitle>
                    <DialogDescription>Select a palette to save this spark to.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="palette-select">Select Palette</Label>
                    <Select value={selectedPaletteId} onValueChange={setSelectedPaletteId} disabled={isLoading}>
                        <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Select a palette" />
                        </SelectTrigger>
                        <SelectContent>
                            {myPalettes.map((option) => (
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