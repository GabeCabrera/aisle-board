"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, HelpCircle } from "lucide-react";

interface VendorQuestionFormProps {
  vendorName: string;
  onSubmit: (question: string) => Promise<void>;
  onCancel: () => void;
}

const MAX_LENGTH = 500;

export function VendorQuestionForm({ vendorName, onSubmit, onCancel }: VendorQuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(question.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_LENGTH - question.length;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Ask {vendorName} a Question
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Your Question *</Label>
            <Textarea
              id="question"
              placeholder="What would you like to know about this vendor? Ask about availability, pricing, services, etc."
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LENGTH))}
              rows={4}
              className="rounded-xl resize-none"
            />
            <div className="flex justify-end">
              <span className={`text-xs ${remainingChars < 50 ? "text-amber-600" : "text-muted-foreground"}`}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Your question will be publicly visible. The vendor will be notified and can respond.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={question.trim().length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Question"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
