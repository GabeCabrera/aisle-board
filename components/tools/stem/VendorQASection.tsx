"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, MessageCircle } from "lucide-react";
import { VendorQuestionForm } from "./VendorQuestionForm";
import { VendorQuestionCard } from "./VendorQuestionCard";
import type { VendorQuestion } from "@/lib/db/schema";

type SortOption = "newest" | "unanswered" | "helpful";

interface VendorQASectionProps {
  vendorName: string;
  vendorSlug: string;
  questions: (VendorQuestion & {
    tenant: {
      id: string;
      displayName: string;
      profileImage: string | null;
      slug: string;
    };
    answeredBy?: {
      id: string;
      displayName: string;
      profileImage: string | null;
    } | null;
  })[];
  questionCount: number;
  isVendorOwner?: boolean;
  onQuestionSubmit: (question: string) => Promise<void>;
  onAnswerSubmit: (questionId: string, answer: string) => Promise<void>;
}

export function VendorQASection({
  vendorName,
  vendorSlug,
  questions: initialQuestions,
  questionCount,
  isVendorOwner = false,
  onQuestionSubmit,
  onAnswerSubmit,
}: VendorQASectionProps) {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [questions, setQuestions] = useState(initialQuestions);

  const handleQuestionSubmit = async (question: string) => {
    await onQuestionSubmit(question);
    setShowQuestionForm(false);
    // Optimistically add the question to the list (will be refreshed on page reload)
  };

  // Sort questions locally
  const sortedQuestions = [...questions].sort((a, b) => {
    switch (sortBy) {
      case "unanswered":
        // Unanswered first
        if (!a.answer && b.answer) return -1;
        if (a.answer && !b.answer) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "helpful":
        return b.helpfulCount - a.helpfulCount;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Questions & Answers ({questionCount})
        </h2>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          {questions.length > 0 && (
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[160px] rounded-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="unanswered">Unanswered First</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Ask Question Button */}
          {!showQuestionForm && !isVendorOwner && (
            <Button
              className="rounded-full"
              onClick={() => setShowQuestionForm(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask a Question
            </Button>
          )}
        </div>
      </div>

      {/* Question Form */}
      {showQuestionForm && (
        <VendorQuestionForm
          vendorName={vendorName}
          onSubmit={handleQuestionSubmit}
          onCancel={() => setShowQuestionForm(false)}
        />
      )}

      {/* Questions List */}
      {sortedQuestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">No questions yet</p>
          <p className="text-sm mt-1">Be the first to ask {vendorName} a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((question) => (
            <VendorQuestionCard
              key={question.id}
              question={question}
              vendorName={vendorName}
              isVendorOwner={isVendorOwner}
              onAnswerSubmit={onAnswerSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
