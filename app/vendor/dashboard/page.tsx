"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Eye,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  User,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function VendorDashboardPage() {
  const { data: session } = useSession();

  // TODO: Fetch real stats from API
  const stats = {
    profileViews: 0,
    saves: 0,
    questions: 0,
    reviews: 0,
    averageRating: 0,
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
          Welcome back, {session?.user?.name?.split(" ")[0] || "Vendor"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's how your business is performing
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.profileViews}</p>
                <p className="text-sm text-muted-foreground">Profile Views</p>
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
                <p className="text-2xl font-semibold">{stats.saves}</p>
                <p className="text-sm text-muted-foreground">Saves</p>
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
                <p className="text-2xl font-semibold">{stats.questions}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.averageRating > 0 ? (stats.averageRating / 10).toFixed(1) : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rating ({stats.reviews} reviews)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complete Profile */}
        <Card className="rounded-2xl border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Complete Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A complete profile helps couples find and trust your business.
              Add your bio, portfolio images, and pricing information.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/vendor/dashboard/profile">
                Edit Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Create Post */}
        <Card className="rounded-2xl border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Share Your Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Post photos from recent weddings and events to showcase your
              work and attract new clients.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/vendor/dashboard/posts">
                Create Post
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity yet.</p>
            <p className="text-sm mt-1">
              When couples view your profile or ask questions, you'll see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
