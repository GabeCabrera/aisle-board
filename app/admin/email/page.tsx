"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Users,
  UserMinus,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AtSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface EmailStats {
  totalUsers: number;
  subscribedUsers: number;
  unsubscribedUsers: number;
}

export default function EmailManagementPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  // Direct email state
  const [directTo, setDirectTo] = useState("");
  const [directSubject, setDirectSubject] = useState("");
  const [directContent, setDirectContent] = useState("");
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // Confirmation dialogs
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showDirectDialog, setShowDirectDialog] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/email");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      toast.error("Failed to load email stats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBroadcastClick = () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required");
      return;
    }
    setShowBroadcastDialog(true);
  };

  const confirmSendBroadcast = async () => {
    setShowBroadcastDialog(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      setSendResult(data);
      toast.success(`Sent ${data.sent} emails successfully`);
      
      if (data.failed === 0) {
        setSubject("");
        setContent("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const handleDirectClick = () => {
    if (!directTo.trim() || !directSubject.trim() || !directContent.trim()) {
      toast.error("Recipient, subject, and content are required");
      return;
    }
    setShowDirectDialog(true);
  };

  const confirmSendDirect = async () => {
    setShowDirectDialog(false);
    setIsSendingDirect(true);

    try {
      const response = await fetch("/api/admin/email/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: directTo,
          subject: directSubject,
          content: directContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success(`Email sent to ${directTo}`);
      setDirectTo("");
      setDirectSubject("");
      setDirectContent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingDirect(false);
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-wider uppercase text-warm-800">
            Email
          </h1>
          <p className="text-warm-500 mt-1">
            Manage subscribers and send broadcasts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-warm-200 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-warm-500">Total Users</span>
          </div>
          <p className="text-3xl font-light text-warm-800">
            {isLoading ? "..." : stats?.totalUsers || 0}
          </p>
        </div>

        <div className="bg-white border border-warm-200 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-warm-500">Subscribed</span>
          </div>
          <p className="text-3xl font-light text-green-600">
            {isLoading ? "..." : stats?.subscribedUsers || 0}
          </p>
          <p className="text-xs text-warm-400 mt-1">
            {stats && stats.totalUsers > 0
              ? `${((stats.subscribedUsers / stats.totalUsers) * 100).toFixed(1)}% of users`
              : ""}
          </p>
        </div>

        <div className="bg-white border border-warm-200 p-5 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserMinus className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-warm-500">Unsubscribed</span>
          </div>
          <p className="text-3xl font-light text-red-500">
            {isLoading ? "..." : stats?.unsubscribedUsers || 0}
          </p>
        </div>
      </div>

      {/* Direct Email Form */}
      <div className="bg-white border border-warm-200 rounded-lg mb-8">
        <div className="p-6 border-b border-warm-100">
          <h2 className="text-lg font-medium text-warm-800 flex items-center gap-2">
            <AtSign className="w-5 h-5 text-warm-400" />
            Direct Email
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send from <span className="font-medium text-warm-700">GabeandSarah@scribeandstem.com</span> — for business outreach, partnerships, etc.
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="direct-to" className="block text-sm font-medium text-warm-700 mb-1">
              To
            </label>
            <input
              type="email"
              id="direct-to"
              value={directTo}
              onChange={(e) => setDirectTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent"
              disabled={isSendingDirect}
            />
          </div>

          <div>
            <label htmlFor="direct-subject" className="block text-sm font-medium text-warm-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              id="direct-subject"
              value={directSubject}
              onChange={(e) => setDirectSubject(e.target.value)}
              placeholder="e.g., Partnership Opportunity with Aisle"
              className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent"
              disabled={isSendingDirect}
            />
          </div>

          <div>
            <label htmlFor="direct-content" className="block text-sm font-medium text-warm-700 mb-1">
              Email Content
            </label>
            <textarea
              id="direct-content"
              value={directContent}
              onChange={(e) => setDirectContent(e.target.value)}
              placeholder="Hi [Name],

I'm reaching out because...

Looking forward to connecting!

Best,
Gabe & Sarah"
              rows={8}
              className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent font-mono text-sm"
              disabled={isSendingDirect}
            />
            <p className="text-xs text-warm-400 mt-1">
              Replies will go to GabeandSarah@aisleboard.com
            </p>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-warm-100">
            <Button
              onClick={handleDirectClick}
              disabled={isSendingDirect || !directTo.trim() || !directSubject.trim() || !directContent.trim()}
              className="bg-warm-600 hover:bg-warm-700"
            >
              {isSendingDirect ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Direct Email Confirmation Dialog */}
      <AlertDialog open={showDirectDialog} onOpenChange={setShowDirectDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Direct Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send an email to <strong>{directTo}</strong> from GabeandSarah@scribeandstem.com.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendDirect}
              className="rounded-full bg-warm-600 hover:bg-warm-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Broadcast Form */}
      <div className="bg-white border border-warm-200 rounded-lg mb-8">
        <div className="p-6 border-b border-warm-100">
          <h2 className="text-lg font-medium text-warm-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-warm-400" />
            Send Broadcast Email
          </h2>
          <p className="text-sm text-warm-500 mt-1">
            Send from <span className="font-medium text-warm-700">hello@aisleboard.com</span> — to all subscribers
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-warm-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., New Feature: Wedding Calendar"
              className="w-full px-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent"
              disabled={isSending}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-warm-700 mb-1">
              Email Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your email content here. Each paragraph will be wrapped in a styled block.

You can write multiple paragraphs by adding blank lines between them.

Keep it personal and helpful!"
              rows={10}
              className="w-full px-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent font-mono text-sm"
              disabled={isSending}
            />
            <p className="text-xs text-warm-400 mt-1">
              Plain text only. Each line break creates a new paragraph.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-warm-100">
            <div className="text-sm text-warm-500">
              Will be sent to <strong className="text-warm-700">{stats?.subscribedUsers || 0}</strong> subscribers
            </div>
            <Button
              onClick={handleBroadcastClick}
              disabled={isSending || !subject.trim() || !content.trim() || !stats?.subscribedUsers}
              className="bg-warm-600 hover:bg-warm-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Broadcast Confirmation Dialog */}
      <AlertDialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Broadcast Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send an email to <strong>{stats?.subscribedUsers || 0}</strong> subscribers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSendBroadcast}
              className="rounded-full bg-warm-600 hover:bg-warm-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to All Subscribers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Result */}
      {sendResult && (
        <div className={`border rounded-lg p-6 mb-8 ${
          sendResult.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="flex items-start gap-4">
            {sendResult.failed === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            )}
            <div>
              <h3 className={`font-medium ${sendResult.failed === 0 ? "text-green-800" : "text-yellow-800"}`}>
                Broadcast Complete
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-green-700">✓ {sendResult.sent} emails sent successfully</p>
                {sendResult.failed > 0 && (
                  <p className="text-red-600">✗ {sendResult.failed} emails failed</p>
                )}
                <p className="text-warm-600">Total: {sendResult.total} subscribers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-3">Tips for Effective Emails</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• Keep subject lines under 50 characters</li>
          <li>• Lead with value — what&apos;s in it for them?</li>
          <li>• Use personal language (&quot;you&quot; and &quot;your&quot;)</li>
          <li>• Include a clear call-to-action</li>
          <li>• Emails are styled with your brand colors automatically</li>
          <li>• Unsubscribe link is added automatically to broadcast emails</li>
        </ul>
      </div>
    </div>
  );
}
