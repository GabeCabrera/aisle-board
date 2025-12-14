"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

export default function VendorAnalyticsPage() {
  // TODO: Fetch analytics from API
  const stats = {
    totalViews: 0,
    totalSaves: 0,
    totalQuestions: 0,
    totalInquiries: 0,
  };

  const weeklyData = {
    views: 0,
    saves: 0,
    questions: 0,
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track how your profile is performing
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalSaves}</p>
                <p className="text-sm text-muted-foreground">Total Saves</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalInquiries}</p>
                <p className="text-sm text-muted-foreground">Inquiries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week
          </CardTitle>
          <CardDescription>
            Your performance over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-semibold text-blue-600">
                {weeklyData.views}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Profile Views</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-semibold text-rose-600">
                {weeklyData.saves}
              </p>
              <p className="text-sm text-muted-foreground mt-1">New Saves</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-semibold text-amber-600">
                {weeklyData.questions}
              </p>
              <p className="text-sm text-muted-foreground mt-1">New Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="rounded-2xl border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tips to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Complete your profile to appear higher in search results
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Add portfolio images to showcase your best work
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Respond to questions quickly to build trust with couples
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Post regularly to stay visible in the Stem feed
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
