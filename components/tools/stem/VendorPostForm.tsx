"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface VendorPostFormProps {
  vendorSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editPost?: {
    id: string;
    type: string;
    title?: string | null;
    content: string;
    images?: string[];
  };
}

const postTypes = [
  { value: "update", label: "Update", description: "Share news or announcements" },
  { value: "portfolio", label: "Portfolio", description: "Showcase your work" },
  { value: "special_offer", label: "Special Offer", description: "Promote a deal or discount" },
  { value: "tip", label: "Tip", description: "Share wedding planning advice" },
];

export function VendorPostForm({
  vendorSlug,
  open,
  onOpenChange,
  onSuccess,
  editPost,
}: VendorPostFormProps) {
  const [type, setType] = useState(editPost?.type || "update");
  const [title, setTitle] = useState(editPost?.title || "");
  const [content, setContent] = useState(editPost?.content || "");
  const [images, setImages] = useState<string[]>(editPost?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editPost;

  const handleAddImage = () => {
    // In a real app, this would open a file picker or image upload dialog
    const url = prompt("Enter image URL:");
    if (url) {
      setImages((prev) => [...prev, url]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/vendors/posts/${editPost.id}`
        : `/api/vendors/${vendorSlug}/posts`;

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim() || undefined,
          content: content.trim(),
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (response.ok) {
        toast.success(isEditing ? "Post updated" : "Post published");
        onOpenChange(false);
        onSuccess?.();

        // Reset form
        if (!isEditing) {
          setType("update");
          setTitle("");
          setContent("");
          setImages([]);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Post" : "Create Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Post Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <span className="font-medium">{t.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {t.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to share?"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {images.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Publishing..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Publish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
