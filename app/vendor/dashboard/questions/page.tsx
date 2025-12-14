"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VendorQuestionsPage() {
  // TODO: Fetch questions from API
  const questions: unknown[] = [];
  const answeredQuestions: unknown[] = [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
          Questions & Answers
        </h1>
        <p className="text-muted-foreground mt-1">
          Answer questions from couples interested in your services
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="rounded-full">
          <TabsTrigger value="pending" className="rounded-full">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="answered" className="rounded-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Answered ({answeredQuestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {questions.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">No pending questions</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  When couples ask questions about your services, they'll appear
                  here for you to answer.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Questions would render here */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="answered">
          {answeredQuestions.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">No answered questions yet</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Questions you've answered will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Answered questions would render here */}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
