"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  RefreshCw,
  Store,
  Star,
  Heart,
  Plus,
  Edit,
  Trash2,
  BadgeCheck,
  Sparkles,
  Filter,
  MapPin,
  ExternalLink,
  Inbox,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Globe,
  Building2,
  Mail,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VendorProfile, VendorRequest, VendorClaimToken } from "@/lib/db/schema";

const CATEGORIES = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "venue", label: "Venue" },
  { value: "caterer", label: "Caterer" },
  { value: "florist", label: "Florist" },
  { value: "dj", label: "DJ" },
  { value: "musician", label: "Musician" },
  { value: "wedding-planner", label: "Wedding Planner" },
  { value: "hair-makeup", label: "Hair & Makeup" },
  { value: "officiant", label: "Officiant" },
  { value: "rentals", label: "Rentals" },
  { value: "bakery", label: "Bakery" },
  { value: "stationery", label: "Stationery" },
  { value: "transportation", label: "Transportation" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

interface VendorFormData {
  name: string;
  slug: string;
  category: string;
  description: string;
  city: string;
  state: string;
  priceRange: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  profileImage: string;
  coverImage: string;
  isVerified: boolean;
  isFeatured: boolean;
}

const emptyFormData: VendorFormData = {
  name: "",
  slug: "",
  category: "",
  description: "",
  city: "",
  state: "",
  priceRange: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  profileImage: "",
  coverImage: "",
  isVerified: false,
  isFeatured: false,
};

type VendorRequestWithTenant = VendorRequest & {
  tenant?: { displayName: string | null } | null;
  vendorProfile?: { id: string; name: string; slug: string } | null;
};

const REQUEST_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800" },
  added: { label: "Added", color: "bg-green-100 text-green-800" },
  declined: { label: "Declined", color: "bg-red-100 text-red-800" },
};

const CLAIM_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Email", color: "bg-yellow-100 text-yellow-800" },
  verified: { label: "Email Verified", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

type ClaimWithVendor = VendorClaimToken & {
  vendor?: { id: string; name: string; slug: string } | null;
};

interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  types?: string[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Vendor requests state
  const [requests, setRequests] = useState<VendorRequestWithTenant[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("pending");

  // Claims state
  const [claims, setClaims] = useState<ClaimWithVendor[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("verified");

  // Enrichment dialog state
  const [enrichVendor, setEnrichVendor] = useState<VendorProfile | null>(null);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const response = await fetch(`/api/admin/vendors?${params}`);
      if (!response.ok) throw new Error("Failed to fetch vendors");

      const data = await response.json();
      setVendors(data);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      toast.error("Failed to fetch vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await fetch("/api/vendors/requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch vendor requests:", err);
      toast.error("Failed to fetch vendor requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const params = new URLSearchParams();
      if (claimStatusFilter) params.set("status", claimStatusFilter);
      const response = await fetch(`/api/admin/vendors/claims?${params}`);
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error("Failed to fetch vendor claims:", err);
      toast.error("Failed to fetch vendor claims");
    } finally {
      setIsLoadingClaims(false);
    }
  };

  // Enrichment functions
  const openEnrichDialog = (vendor: VendorProfile) => {
    setEnrichVendor(vendor);
    setPlaceSearch(vendor.name);
    setPlaceResults([]);
  };

  const searchPlaces = async () => {
    if (!placeSearch.trim()) return;
    setIsSearchingPlaces(true);
    try {
      const params = new URLSearchParams({ query: placeSearch });
      if (enrichVendor?.city) params.set("location", `${enrichVendor.city}, ${enrichVendor.state || ""}`);
      const response = await fetch(`/api/admin/vendors/enrich?${params}`);
      if (!response.ok) throw new Error("Failed to search");
      const data = await response.json();
      setPlaceResults(data.results || []);
    } catch (err) {
      toast.error("Failed to search Google Places");
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const enrichFromPlace = async (placeId: string, tier: "free" | "premium" = "free") => {
    if (!enrichVendor) return;
    setIsEnriching(true);
    try {
      const response = await fetch("/api/admin/vendors/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: enrichVendor.id, placeId, tier }),
      });
      if (!response.ok) throw new Error("Failed to enrich");
      toast.success("Vendor enriched from Google Places");
      setEnrichVendor(null);
      fetchVendors();
    } catch (err) {
      toast.error("Failed to enrich vendor");
    } finally {
      setIsEnriching(false);
    }
  };

  // Claim actions
  const approveClaim = async (claimId: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/claims/${claimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!response.ok) throw new Error("Failed to approve");
      toast.success("Claim approved - vendor will receive registration email");
      fetchClaims();
    } catch (err) {
      toast.error("Failed to approve claim");
    }
  };

  const rejectClaim = async (claimId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/claims/${claimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", adminNotes: reason }),
      });
      if (!response.ok) throw new Error("Failed to reject");
      toast.success("Claim rejected");
      fetchClaims();
    } catch (err) {
      toast.error("Failed to reject claim");
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchRequests();
    fetchClaims();
  }, [categoryFilter]);

  useEffect(() => {
    fetchClaims();
  }, [claimStatusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const openCreateForm = () => {
    setEditingVendor(null);
    setFormData(emptyFormData);
    setIsFormOpen(true);
  };

  const openEditForm = (vendor: VendorProfile) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      slug: vendor.slug,
      category: vendor.category,
      description: vendor.description || "",
      city: vendor.city || "",
      state: vendor.state || "",
      priceRange: vendor.priceRange || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      website: vendor.website || "",
      instagram: vendor.instagram || "",
      profileImage: vendor.profileImage || "",
      coverImage: vendor.coverImage || "",
      isVerified: vendor.isVerified,
      isFeatured: vendor.isFeatured,
    });
    setIsFormOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleFormChange = (field: keyof VendorFormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === "name" && !editingVendor) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.category) {
      toast.error("Name, slug, and category are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingVendor
        ? `/api/admin/vendors/${editingVendor.id}`
        : "/api/admin/vendors";
      const method = editingVendor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save vendor");

      toast.success(editingVendor ? "Vendor updated" : "Vendor created");
      setIsFormOpen(false);
      fetchVendors();
    } catch (err) {
      console.error("Failed to save vendor:", err);
      toast.error("Failed to save vendor");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setVendors(vendors.filter((v) => v.id !== vendorId));
      setDeleteConfirm(null);
      toast.success("Vendor deleted");
    } catch (err) {
      toast.error("Failed to delete vendor");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVerified = async (vendor: VendorProfile) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !vendor.isVerified }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setVendors(
        vendors.map((v) =>
          v.id === vendor.id ? { ...v, isVerified: !v.isVerified } : v
        )
      );
      toast.success(vendor.isVerified ? "Unverified vendor" : "Verified vendor");
    } catch (err) {
      toast.error("Failed to update vendor");
    }
  };

  const toggleFeatured = async (vendor: VendorProfile) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !vendor.isFeatured }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setVendors(
        vendors.map((v) =>
          v.id === vendor.id ? { ...v, isFeatured: !v.isFeatured } : v
        )
      );
      toast.success(vendor.isFeatured ? "Unfeatured vendor" : "Featured vendor");
    } catch (err) {
      toast.error("Failed to update vendor");
    }
  };

  // Request actions
  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/vendors/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setRequests(
        requests.map((r) =>
          r.id === requestId
            ? { ...r, status, resolvedAt: status === "added" || status === "declined" ? new Date() : null }
            : r
        )
      );
      toast.success(`Request marked as ${status}`);
    } catch (err) {
      toast.error("Failed to update request");
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/vendors/requests/${requestId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setRequests(requests.filter((r) => r.id !== requestId));
      toast.success("Request deleted");
    } catch (err) {
      toast.error("Failed to delete request");
    }
  };

  // Filter requests by status
  const filteredRequests = requestStatusFilter
    ? requests.filter((r) => r.status === requestStatusFilter)
    : requests;

  // Stats
  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const pendingClaimsCount = claims.filter((c) => c.status === "verified").length;
  const verifiedCount = vendors.filter((v) => v.isVerified).length;
  const featuredCount = vendors.filter((v) => v.isFeatured).length;
  const categoryCounts = vendors.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-wider uppercase text-warm-800">
            Vendors
          </h1>
          <p className="text-warm-500 mt-1">
            Manage the vendor directory for Stem
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{vendors.length}</p>
              <p className="text-xs text-warm-500">Total Vendors</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BadgeCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{verifiedCount}</p>
              <p className="text-xs text-warm-500">Verified</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{featuredCount}</p>
              <p className="text-xs text-warm-500">Featured</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">
                {Object.keys(categoryCounts).length}
              </p>
              <p className="text-xs text-warm-500">Categories</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${pendingRequestsCount > 0 ? "bg-orange-100" : "bg-warm-100"}`}>
              <Inbox className={`w-5 h-5 ${pendingRequestsCount > 0 ? "text-orange-600" : "text-warm-400"}`} />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{pendingRequestsCount}</p>
              <p className="text-xs text-warm-500">Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-warm-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${pendingClaimsCount > 0 ? "bg-emerald-100" : "bg-warm-100"}`}>
              <FileCheck className={`w-5 h-5 ${pendingClaimsCount > 0 ? "text-emerald-600" : "text-warm-400"}`} />
            </div>
            <div>
              <p className="text-2xl font-light text-warm-800">{pendingClaimsCount}</p>
              <p className="text-xs text-warm-500">Claims</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors" className="gap-2">
            <Store className="w-4 h-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Inbox className="w-4 h-4" />
            Requests
            {pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="claims" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Claims
            {pendingClaimsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                {pendingClaimsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white border border-warm-200 rounded-lg">
            <div className="p-4 flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, city, or description..."
                    className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500"
                  />
                </div>
              </form>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-warm-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={fetchVendors}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

      {/* Vendors Table */}
      <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-warm-50 border-b border-warm-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Location
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Stats
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                Status
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
                  Loading vendors...
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-warm-400">
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-warm-100 relative shrink-0">
                        {vendor.profileImage ? (
                          <Image
                            src={vendor.profileImage}
                            alt={vendor.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-5 h-5 text-warm-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-warm-800">{vendor.name}</p>
                          {vendor.website && (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-warm-400 hover:text-warm-600"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-warm-500">/{vendor.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {CATEGORIES.find((c) => c.value === vendor.category)?.label ||
                        vendor.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {vendor.city || vendor.state ? (
                      <div className="flex items-center gap-1 text-sm text-warm-600">
                        <MapPin className="w-3 h-3" />
                        {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <span className="text-warm-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3 h-3 fill-current" />
                        {vendor.averageRating ? (vendor.averageRating / 10).toFixed(1) : "—"}
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart className="w-3 h-3" />
                        {vendor.saveCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVerified(vendor)}
                        className={`p-1.5 rounded-md transition-colors ${
                          vendor.isVerified
                            ? "bg-green-100 text-green-600"
                            : "bg-warm-100 text-warm-400 hover:bg-warm-200"
                        }`}
                        title={vendor.isVerified ? "Remove verification" : "Verify vendor"}
                      >
                        <BadgeCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFeatured(vendor)}
                        className={`p-1.5 rounded-md transition-colors ${
                          vendor.isFeatured
                            ? "bg-amber-100 text-amber-600"
                            : "bg-warm-100 text-warm-400 hover:bg-warm-200"
                        }`}
                        title={vendor.isFeatured ? "Remove featured" : "Feature vendor"}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEnrichDialog(vendor)}
                        title="Enrich from Google Places"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Building2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(vendor)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {deleteConfirm === vendor.id ? (
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
                            onClick={() => deleteVendor(vendor.id)}
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
                          onClick={() => setDeleteConfirm(vendor.id)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-300"
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
      </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Requests Filters */}
          <div className="bg-white border border-warm-200 rounded-lg">
            <div className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-warm-400" />
                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="added">Added</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div className="flex-1" />

              <Button variant="outline" size="sm" onClick={fetchRequests}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRequests ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Vendor Info
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {isLoadingRequests ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-warm-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-warm-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No vendor requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-warm-800">{request.vendorName}</p>
                          {request.website && (
                            <a
                              href={request.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              {request.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                          {request.notes && (
                            <p className="text-xs text-warm-500 mt-1">{request.notes}</p>
                          )}
                          {request.searchQuery && (
                            <p className="text-xs text-warm-400 mt-1">
                              Searched: &quot;{request.searchQuery}&quot;
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {CATEGORIES.find((c) => c.value === request.category)?.label ||
                            request.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {request.city || request.state ? (
                          <div className="flex items-center gap-1 text-sm text-warm-600">
                            <MapPin className="w-3 h-3" />
                            {[request.city, request.state].filter(Boolean).join(", ")}
                          </div>
                        ) : (
                          <span className="text-warm-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {request.tenant?.displayName || (
                            <span className="text-warm-400">Anonymous</span>
                          )}
                          <p className="text-xs text-warm-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            REQUEST_STATUS_LABELS[request.status || "pending"]?.color
                          }`}
                        >
                          {REQUEST_STATUS_LABELS[request.status || "pending"]?.label}
                        </span>
                        {request.vendorProfile && (
                          <p className="text-xs text-green-600 mt-1">
                            Linked to: {request.vendorProfile.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, "contacted")}
                                title="Mark as contacted"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, "added")}
                                className="text-green-600 hover:bg-green-50"
                                title="Mark as added"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, "declined")}
                                className="text-red-600 hover:bg-red-50"
                                title="Mark as declined"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {request.status === "contacted" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, "added")}
                                className="text-green-600 hover:bg-green-50"
                                title="Mark as added"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, "declined")}
                                className="text-red-600 hover:bg-red-50"
                                title="Mark as declined"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRequest(request.id)}
                            className="text-warm-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          {/* Claims Filters */}
          <div className="bg-white border border-warm-200 rounded-lg">
            <div className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-warm-400" />
                <select
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending Email</option>
                  <option value="verified">Email Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex-1" />

              <Button variant="outline" size="sm" onClick={fetchClaims}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingClaims ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Claims Table */}
          <div className="bg-white border border-warm-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Claim Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {isLoadingClaims ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-warm-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading claims...
                    </td>
                  </tr>
                ) : claims.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-warm-400">
                      <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No vendor claims found
                    </td>
                  </tr>
                ) : (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-warm-800">{claim.vendor?.name || "Unknown"}</p>
                          {claim.vendor?.slug && (
                            <p className="text-xs text-warm-500">/{claim.vendor.slug}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-warm-600">
                          <Mail className="w-3 h-3" />
                          {claim.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            CLAIM_STATUS_LABELS[claim.status || "pending"]?.color
                          }`}
                        >
                          {CLAIM_STATUS_LABELS[claim.status || "pending"]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-warm-600">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </p>
                        {claim.verifiedAt && (
                          <p className="text-xs text-warm-400">
                            Verified: {new Date(claim.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {claim.status === "verified" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveClaim(claim.id)}
                                className="text-green-600 hover:bg-green-50"
                                title="Approve claim"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) rejectClaim(claim.id, reason);
                                }}
                                className="text-red-600 hover:bg-red-50"
                                title="Reject claim"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Vendor Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="e.g., Golden Hour Studios"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleFormChange("slug", e.target.value)}
                placeholder="e.g., golden-hour-studios"
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleFormChange("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select
                value={formData.priceRange}
                onValueChange={(v) => handleFormChange("priceRange", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Describe the vendor's services..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                placeholder="e.g., Los Angeles"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleFormChange("state", e.target.value)}
                placeholder="e.g., CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder="contact@vendor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleFormChange("website", e.target.value)}
                placeholder="https://vendor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleFormChange("instagram", e.target.value)}
                placeholder="vendorhandle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL</Label>
              <Input
                id="profileImage"
                value={formData.profileImage}
                onChange={(e) => handleFormChange("profileImage", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => handleFormChange("coverImage", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => handleFormChange("isVerified", e.target.checked)}
                  className="w-4 h-4 rounded border-warm-300"
                />
                <BadgeCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm">Verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleFormChange("isFeatured", e.target.checked)}
                  className="w-4 h-4 rounded border-warm-300"
                />
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm">Featured</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : editingVendor ? "Save Changes" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Places Enrichment Dialog */}
      <Dialog open={!!enrichVendor} onOpenChange={() => setEnrichVendor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Enrich from Google Places
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-warm-50 p-3 rounded-lg">
              <p className="font-medium text-warm-800">{enrichVendor?.name}</p>
              {enrichVendor?.city && (
                <p className="text-sm text-warm-500">
                  {enrichVendor.city}, {enrichVendor.state}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Search Google Places</Label>
              <div className="flex gap-2">
                <Input
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  placeholder="Business name..."
                  onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
                />
                <Button onClick={searchPlaces} disabled={isSearchingPlaces}>
                  {isSearchingPlaces ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {placeResults.length > 0 && (
              <div className="space-y-2">
                <Label>Select a business to import</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {placeResults.map((place) => (
                    <div
                      key={place.placeId}
                      className="p-3 border border-warm-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => enrichFromPlace(place.placeId, "free")}
                    >
                      <p className="font-medium text-warm-800">{place.name}</p>
                      <p className="text-sm text-warm-500">{place.address}</p>
                      {place.types && (
                        <div className="flex gap-1 mt-1">
                          {place.types.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEnriching && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                <span className="text-warm-600">Enriching vendor...</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrichVendor(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
