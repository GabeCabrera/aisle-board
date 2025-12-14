"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon, FileText } from "lucide-react";

export default function VendorPostsPage() {
  // TODO: Fetch posts from API
  const posts: unknown[] = [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
            Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Share your work with engaged couples
          </p>
        </div>
        <Button className="rounded-full shadow-soft">
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Share photos from your recent weddings and events to showcase
              your work and attract new clients.
            </p>
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Posts would render here */}
        </div>
      )}
    </div>
  );
}
