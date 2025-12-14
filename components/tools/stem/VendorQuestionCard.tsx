"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, CheckCircle, Clock, Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { VendorQuestion } from "@/lib/db/schema";

interface VendorQuestionCardProps {
  question: VendorQuestion & {
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
  };
  vendorName: string;
  isVendorOwner?: boolean;
  onAnswerSubmit?: (questionId: string, answer: string) => Promise<void>;
}

export function VendorQuestionCard({
  question,
  vendorName,
  isVendorOwner = false,
  onAnswerSubmit,
}: VendorQuestionCardProps) {
  const router = useRouter();
  const [helpfulCount, setHelpfulCount] = useState(question.helpfulCount);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localAnswer, setLocalAnswer] = useState(question.answer);
  const [localAnsweredAt, setLocalAnsweredAt] = useState(question.answeredAt);

  const initials = question.tenant.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleHelpful = async () => {
    if (hasMarkedHelpful) return;

    setHelpfulCount((prev) => prev + 1);
    setHasMarkedHelpful(true);

    try {
      await fetch(`/api/vendors/questions/${question.id}/helpful`, {
        method: "POST",
      });
    } catch (error) {
      setHelpfulCount((prev) => prev - 1);
      setHasMarkedHelpful(false);
    }
  };

  const handleProfileClick = () => {
    if (question.tenant.id && question.tenant.slug) {
      router.push(`/planner/stem/profile/${question.tenant.id}`);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answer.trim() || !onAnswerSubmit) return;

    setIsSubmitting(true);
    try {
      await onAnswerSubmit(question.id, answer.trim());
      setLocalAnswer(answer.trim());
      setLocalAnsweredAt(new Date());
      setShowAnswerForm(false);
      setAnswer("");
      toast.success("Answer submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnswered = !!localAnswer;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-6">
        {/* Question Section */}
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <div
            onClick={handleProfileClick}
            className={cn(
              "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary overflow-hidden relative shrink-0",
              question.tenant.id && "cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            )}
          >
            {question.tenant.profileImage ? (
              <Image
                src={question.tenant.profileImage}
                alt={question.tenant.displayName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p
                  onClick={handleProfileClick}
                  className={cn(
                    "font-medium text-foreground",
                    question.tenant.id && "cursor-pointer hover:text-primary transition-colors"
                  )}
                >
                  {question.tenant.displayName}
                </p>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Status Badge */}
              {isAnswered ? (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Answered
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
                  <Clock className="h-3 w-3" />
                  Awaiting Response
                </Badge>
              )}
            </div>

            {/* Question Content */}
            <div className="flex items-start gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {question.question}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        {isAnswered && (
          <div className="mt-4 ml-14 pl-4 border-l-2 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">{vendorName}</span>
              <span className="text-sm text-muted-foreground">
                {localAnsweredAt && formatDistanceToNow(new Date(localAnsweredAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {localAnswer}
            </p>
          </div>
        )}

        {/* Answer Form for Vendor Owner */}
        {isVendorOwner && !isAnswered && (
          <div className="mt-4 ml-14">
            {showAnswerForm ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Write your response..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={handleAnswerSubmit}
                    disabled={!answer.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setShowAnswerForm(false);
                      setAnswer("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setShowAnswerForm(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Answer this Question
              </Button>
            )}
          </div>
        )}

        {/* Helpful Button */}
        <div className="mt-4 pt-3 border-t border-border/50 ml-14">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-muted-foreground hover:text-foreground gap-1.5",
              hasMarkedHelpful && "text-primary"
            )}
            onClick={handleHelpful}
            disabled={hasMarkedHelpful}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", hasMarkedHelpful && "fill-current")} />
            Helpful {helpfulCount > 0 && `(${helpfulCount})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
