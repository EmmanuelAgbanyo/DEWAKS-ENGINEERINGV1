import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
  Download,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { CashRequest, statusLabels, statusColors, urgencyColors } from "@/lib/types";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function AllRequests() {
  const [requests, setRequests] = useState<CashRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestsData = await api.get<CashRequest[]>("/api/cash-requests/all");
        setRequests(requestsData);
        setFilteredRequests(requestsData);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.requestNumber.toLowerCase().includes(query) ||
          r.purpose.toLowerCase().includes(query) ||
          r.requester.name.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (r) =>
            r.status === "PENDING_ADMIN" || r.status === "PENDING_MANAGER"
        );
      } else if (statusFilter === "approved") {
        filtered = filtered.filter((r) => r.status === "APPROVED");
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter(
          (r) =>
            r.status === "REJECTED_BY_ADMIN" || r.status === "REJECTED_BY_MANAGER"
        );
      }
    }

    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, requests]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED") {
      return (
        <div className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      );
    }
    if (status.startsWith("REJECTED")) {
      return (
        <div className="p-1.5 rounded-lg bg-red-400/10 border border-red-400/20">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        </div>
      );
    }
    return (
      <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Request #",
      "Date",
      "Requester",
      "Purpose",
      "Category",
      "Amount",
      "Status",
      "Urgency",
    ];
    const rows = filteredRequests.map((r) => [
      r.requestNumber,
      new Date(r.createdAt).toLocaleDateString(),
      r.requester.name,
      r.purpose,
      r.category,
      r.amount.toString(),
      statusLabels[r.status],
      r.urgency,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cash-requests-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-48 shimmer rounded-lg mb-2" />
              <div className="h-4 w-72 shimmer rounded-lg" />
            </div>
            <div className="h-10 w-32 shimmer rounded-xl" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 shimmer rounded-2xl" />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-11 flex-1 shimmer rounded-xl" />
            <div className="h-11 w-48 shimmer rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 shimmer rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">All Requests</h1>
              <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs font-medium text-muted-foreground">
                  {filteredRequests.length} records
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Complete overview of all cash flow requests
            </p>
          </div>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{requests.length}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] p-5 hover:border-amber-400/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
              </div>
              <p className="text-3xl font-bold text-amber-400">
                {requests.filter((r) => r.status.startsWith("PENDING")).length}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] p-5 hover:border-emerald-400/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-muted-foreground font-medium">Approved</p>
              </div>
              <p className="text-3xl font-bold text-emerald-400">
                {requests.filter((r) => r.status === "APPROVED").length}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] p-5 hover:border-red-400/20 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs text-muted-foreground font-medium">Rejected</p>
              </div>
              <p className="text-3xl font-bold text-red-400">
                {requests.filter((r) => r.status.startsWith("REJECTED")).length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search by request #, purpose, or requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] focus:border-primary/50 focus:bg-white/[0.05] rounded-xl transition-all"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] p-16 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-muted/30 rounded-2xl blur-xl" />
                <div className="relative w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center border border-white/[0.06]">
                  <FileText className="w-10 h-10 text-muted-foreground/60" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium mb-2">No requests found</p>
              <p className="text-sm text-muted-foreground/60">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search filters"
                  : "No cash requests have been submitted yet"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-3">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                variants={itemVariants}
              >
                <Link to={`/requests/${request.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.005, x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-background/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.12] cursor-pointer transition-all duration-300"
                  >
                    {/* Left status indicator */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                      request.status === "APPROVED" ? "bg-emerald-400" :
                        request.status.startsWith("REJECTED") ? "bg-red-400" : "bg-amber-400",
                      "opacity-50 group-hover:opacity-100"
                    )} />

                    {/* Hover glow */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                      request.status === "APPROVED" ? "bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent" :
                        request.status.startsWith("REJECTED") ? "bg-gradient-to-r from-red-500/5 via-transparent to-transparent" :
                          "bg-gradient-to-r from-amber-500/5 via-transparent to-transparent"
                    )} />

                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {getStatusIcon(request.status)}
                            <span className="font-semibold text-foreground">
                              {request.requestNumber}
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-0.5 text-xs rounded-full font-medium border",
                                statusColors[request.status]
                              )}
                            >
                              {statusLabels[request.status]}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full bg-white/5 border border-white/10",
                                urgencyColors[request.urgency]
                              )}
                            >
                              {request.urgency}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 mb-2 truncate font-medium">
                            {request.purpose}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="text-xs">By {request.requester.name}</span>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs">{request.category.name}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold text-foreground text-lg tracking-tight">
                              {formatCurrency(request.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="p-2 rounded-xl bg-white/[0.03] group-hover:bg-primary/10 transition-colors">
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
