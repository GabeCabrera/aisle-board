"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Users,
  Crown,
  Mail,
  MailX,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  FlaskConical,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isTestAccount: boolean;
  emailOptIn: boolean;
  unsubscribedAt: string | null;
  createdAt: string;
  tenant: {
    id: string;
    displayName: string;
    slug: string;
    plan: string;
    weddingDate: string | null;
    onboardingComplete: boolean;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats from all users (fetched separately)
  const [stats, setStats] = useState({
    total: 0,
    totalReal: 0,
    paid: 0,
    paidReal: 0,
    testAccounts: 0,
  });

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);

      const response = await fetch(`/api/manage-x7k9/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      
      // Calculate stats from all loaded users
      const allUsers = data.users as User[];
      const testCount = allUsers.filter(u => u.isTestAccount).length;
      const paidCount = allUsers.filter(u => u.tenant.plan === "complete").length;
      const paidRealCount = allUsers.filter(u => u.tenant.plan === "complete" && !u.isTestAccount).length;
      
      setStats({
        total: data.pagination.total,
        totalReal: data.pagination.total - testCount, // Approximate
        paid: paidCount,
        paidReal: paidRealCount,
        testAccounts: testCount,
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const toggleTestAccount = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/manage-x7k9/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isTestAccount: !currentStatus }),
      });
      
      if (!response.ok) throw new Error("Failed to update");
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isTestAccount: !currentStatus } : u
      ));
      
      toast.success(!currentStatus ? "Marked as test account" : "Unmarked as test account");
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  const deleteUser = async (userId: string, tenantId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/manage-x7k9/users?userId=${userId}&tenantId=${tenantId}`,
        { method: "DELETE" }
      );
      
      if (!response.ok) throw new Error("Failed to delete");
      
      // Remove from local state
      setUsers(users.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setDeleteConfirm(null);
      
      toast.success("User and all data deleted");
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Email", "Name", "Plan", "Test Account", "Wedding Date", "Email Opt-In", "Created"];
    const rows = users.map((u) => [
      u.email,
      u.name || "",
      u.tenant.plan,
      u.isTestAccount ? "Yes" : "No",
      u.tenant.weddingDate || "",
      u.emailOptIn ? "Yes" : "No",
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aisle-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  };

  // Calculate real stats (excluding test accounts)
  const realUsers = users.filter(u => !u.isTestAccount);
  const testUsers = users.filter(u => u.isTestAccount);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif tracking-wider uppercase text-warm-800">
          Users
        </h1>
        <p className="text-warm-500 mt-1">
          Manage and view all registered customers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{pagination.total}</p>
              <p className="text-xs text-warm-500">Total Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">
                {realUsers.filter((u) => u.tenant.plan === "complete").length}
                <span className="text-sm text-warm-400 ml-1">
                  / {users.filter((u) => u.tenant.plan === "complete").length}
                </span>
              </p>
              <p className="text-xs text-warm-500">Paid (real / total)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">
                {realUsers.filter((u) => u.emailOptIn).length}
              </p>
              <p className="text-xs text-warm-500">Subscribed (real)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">
                {realUsers.filter((u) => u.tenant.weddingDate).length}
              </p>
              <p className="text-xs text-warm-500">With Date (real)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-lg bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-lg">
              <FlaskConical className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-light text-amber-800">{testUsers.length}</p>
              <p className="text-xs text-amber-600">Test Accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-warm-200 rounded-lg mb-6">
        <div className="p-4 flex items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, name, or wedding name..."
                className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500"
              />
            </div>
          </form>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-warm-400" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 text-sm"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={() => fetchUsers(pagination.page)}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Wedding
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-warm-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-warm-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-warm-50 transition-colors ${user.isTestAccount ? 'bg-amber-50/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-warm-800">{user.name || "—"}</p>
                          {user.isTestAccount && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-200 text-amber-800">
                              <FlaskConical className="w-3 h-3" />
                              TEST
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-warm-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-warm-800">{user.tenant.displayName || "—"}</p>
                      {user.tenant.weddingDate && (
                        <p className="text-xs text-warm-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(user.tenant.weddingDate)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        user.tenant.plan === "complete"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-warm-100 text-warm-600"
                      }`}
                    >
                      {user.tenant.plan === "complete" && <Crown className="w-3 h-3" />}
                      {user.tenant.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.emailOptIn ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <Mail className="w-4 h-4" />
                        Subscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warm-400 text-sm">
                        <MailX className="w-4 h-4" />
                        {user.unsubscribedAt ? "Unsubscribed" : "Not opted in"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-warm-600" title={formatDate(user.createdAt)}>
                      {timeAgo(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTestAccount(user.id, user.isTestAccount)}
                        className={user.isTestAccount ? "border-amber-300 text-amber-700 hover:bg-amber-100" : ""}
                        title={user.isTestAccount ? "Unmark as test account" : "Mark as test account"}
                      >
                        <FlaskConical className="w-4 h-4" />
                      </Button>
                      
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => deleteUser(user.id, user.tenant.id)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isDeleting ? "..." : "Delete"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-300"
                          title="Delete user and all data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-warm-200 flex items-center justify-between bg-warm-50">
            <p className="text-sm text-warm-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-warm-600 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || isLoading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">About Test Accounts</p>
          <p className="text-amber-700">
            Test accounts are excluded from your real stats (shown with "real" label). 
            Use this to mark demo/test accounts that shouldn&apos;t count towards your metrics. 
            Deleting a user removes all their data permanently.
          </p>
        </div>
      </div>
    </div>
  );
}
