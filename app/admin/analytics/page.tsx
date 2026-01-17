"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Eye,
  Users,
  MousePointer,
  Smartphone,
  Tablet,
  Monitor,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
  Link2,
} from "lucide-react";

interface AnalyticsData {
  realtime: {
    activeSessions: number;
    currentPages: Array<{ pagePath: string; count: number }>;
  };
  traffic: {
    totalPageViews: number;
    uniqueSessions: number;
    topPages: Array<{ pagePath: string; views: number; uniqueSessions: number }>;
    deviceBreakdown: Array<{ deviceType: string | null; count: number }>;
    trafficSources: Array<{ referrer: string | null; sessions: number }>;
    utmCampaigns: Array<{
      source: string | null;
      medium: string | null;
      campaign: string | null;
      sessions: number;
    }>;
  };
  behavior: {
    featureUsage: Array<{ eventName: string; count: number; uniqueUsers: number }>;
    clickEvents: Array<{ eventName: string; count: number }>;
    errors: Array<{ eventName: string; count: number; lastOccurred: string }>;
  };
  trends: {
    daily: Array<{ date: string; pageViews: number; uniqueSessions: number }>;
  };
  recentEvents: Array<{
    id: string;
    eventType: string;
    eventName: string;
    pagePath: string;
    deviceType: string | null;
    timestamp: string;
  }>;
  period: string;
  generatedAt: string;
}

const deviceIcons: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  const totalDevices = data.traffic.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-muted-foreground">
            Track user behavior and engagement
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("7d")}
            >
              7 days
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("30d")}
            >
              30 days
            </Button>
            <Button
              variant={period === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("90d")}
            >
              90 days
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.realtime.activeSessions}</p>
                <p className="text-sm text-muted-foreground">Active now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.traffic.totalPageViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Page views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.traffic.uniqueSessions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic.topPages.slice(0, 10).map((page, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[200px]" title={page.pagePath}>
                        {page.pagePath}
                      </span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {page.views.toLocaleString()} views
                        </span>
                        <span className="font-medium">
                          {page.uniqueSessions.toLocaleString()} sessions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.traffic.deviceBreakdown.map((device, i) => {
                    const percentage = totalDevices > 0
                      ? Math.round((device.count / totalDevices) * 100)
                      : 0;
                    const deviceType = device.deviceType || "unknown";
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {deviceIcons[deviceType] || <Monitor className="h-4 w-4" />}
                            <span className="capitalize">{deviceType}</span>
                          </div>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Traffic Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic.trafficSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No referrer data yet</p>
                  ) : (
                    data.traffic.trafficSources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[250px]" title={source.referrer || "Direct"}>
                          {source.referrer || "Direct"}
                        </span>
                        <span className="font-medium">{source.sessions} sessions</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* UTM Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic.utmCampaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No campaign data yet</p>
                  ) : (
                    data.traffic.utmCampaigns.map((campaign, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{campaign.source}</span>
                          {campaign.medium && (
                            <span className="text-muted-foreground"> / {campaign.medium}</span>
                          )}
                          {campaign.campaign && (
                            <span className="text-muted-foreground"> / {campaign.campaign}</span>
                          )}
                        </div>
                        <span className="font-medium">{campaign.sessions}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trends Chart (Simple) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Trends
              </CardTitle>
              <CardDescription>Page views and sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {data.trends.daily.map((day, i) => {
                  const maxViews = Math.max(...data.trends.daily.map((d) => d.pageViews), 1);
                  const height = (day.pageViews / maxViews) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.pageViews} views, ${day.uniqueSessions} sessions`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{data.trends.daily[0]?.date}</span>
                <span>{data.trends.daily[data.trends.daily.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Feature Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.behavior.featureUsage.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No feature usage data yet</p>
                  ) : (
                    data.behavior.featureUsage.map((feature, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{feature.eventName.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {feature.uniqueUsers} users
                          </span>
                          <span className="font-medium">{feature.count}x</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Click Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Click Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.behavior.clickEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No click data yet</p>
                  ) : (
                    data.behavior.clickEvents.map((click, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{click.eventName.replace(/_/g, " ")}</span>
                        <span className="font-medium">{click.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.behavior.errors.length === 0 ? (
                    <p className="text-sm text-green-600">No errors recorded</p>
                  ) : (
                    data.behavior.errors.map((error, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-600">
                            {error.eventName}
                          </span>
                          <span className="text-sm">{error.count}x</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last: {new Date(error.lastOccurred).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Currently Viewing</CardTitle>
                <CardDescription>Pages being viewed right now</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.realtime.currentPages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active sessions</p>
                  ) : (
                    data.realtime.currentPages.map((page, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[250px]">{page.pagePath}</span>
                        <span className="font-medium">{page.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Live Event Stream</CardTitle>
                <CardDescription>Most recent events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {data.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          event.eventType === "page_view"
                            ? "bg-blue-500"
                            : event.eventType === "click"
                            ? "bg-green-500"
                            : event.eventType === "error"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{event.eventName}</span>
                        <span className="text-muted-foreground"> on </span>
                        <span className="truncate">{event.pagePath}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
