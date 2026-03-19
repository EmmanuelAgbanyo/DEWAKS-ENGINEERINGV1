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
  Pencil,
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
import { useAuth } from "@/components/AuthProvider";
import {
  subscribeToAllCashRequests,
  recordToArray,
  type DBCashRequest,
} from "@/lib/firebase-db";
import {
  statusLabels,
  statusColors,
  urgencyColors,
  UserRole,
  CashRequestStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditRequestDialog } from "@/components/EditRequestDialog";

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

export default function Requests() {
  const [requests, setRequests] = useState<(DBCashRequest & { id: string })[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<(DBCashRequest & { id: string })[]>([]);
  const { uid, userProfile } = useAuth();
  const userRole = userProfile?.role || null;
  const userId = uid;
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<(DBCashRequest & { id: string }) | null>(null);

  useEffect(() => {
    if (!uid || !userRole) return;
    const unsub = subscribeToAllCashRequests((data) => {
      let arr = recordToArray(data);
      // STAFF sees only their own; ADMIN/MANAGER sees all
      if (userRole === "STAFF") {
        arr = arr.filter(r => r.requesterId === uid);
      }
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(arr);
      setIsLoading(false);
    });
    return () => unsub();
  }, [uid, userRole]);

  useEffect(() => {
    let filtered = [...requests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.requestNumber.toLowerCase().includes(query) ||
          r.purpose.toLowerCase().includes(query) ||
          r.requesterName.toLowerCase().includes(query)
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
        <div className="p-2 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
      );
    }
    if (status.startsWith("REJECTED")) {
      return (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="w-4 h-4 text-destructive" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
        <Clock className="w-4 h-4 text-warning" />
      </div>
    );
  };

  const canEditRequest = (request: DBCashRequest & { id: string }) => {
    return (
      userRole === UserRole.STAFF &&
      userId === request.requesterId &&
      request.status === CashRequestStatus.PENDING_ADMIN
    );
  };

  const handleEditClick = (e: React.MouseEvent, request: CashRequest) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRequest(request);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Real-time subscription auto-updates
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <div className="h-9 w-52 shimmer rounded-xl mb-3" />
            <div className="h-5 w-80 shimmer rounded-lg" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-12 flex-1 shimmer rounded-xl" />
            <div className="h-12 w-48 shimmer rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 shimmer rounded-2xl" />
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
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {userRole === UserRole.STAFF ? "My Requests" : "Review Requests"}
            </h1>
            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <span className="text-sm font-medium text-muted-foreground">
                {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-base">
            {userRole === UserRole.STAFF
              ? "Track the status of your cash requests"
              : "Review and process pending cash requests"}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search by request #, purpose, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] focus:border-primary/50 focus:bg-white/[0.05] rounded-xl transition-all text-base"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 h-12 bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12] rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-2xl border-white/[0.08]">
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
            <div className="glass-card p-16 text-center">
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 bg-muted/30 rounded-2xl blur-xl" />
                <div className="relative w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center border border-white/[0.06]">
                  <FileText className="w-10 h-10 text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-foreground font-medium text-lg mb-2">No requests found</p>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first request"}
              </p>
              {userRole === UserRole.STAFF && !searchQuery && statusFilter === "all" && (
                <Link to="/new-request">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold btn-glow">
                    Create Request
                  </Button>
                </Link>
              )}
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
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    className="group relative overflow-hidden glass-card cursor-pointer hover:border-white/[0.1] transition-all duration-300"
                  >
                    {/* Left status indicator */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                      request.status === "APPROVED" ? "bg-success" :
                        request.status.startsWith("REJECTED") ? "bg-destructive" : "bg-warning",
                      "opacity-40 group-hover:opacity-100"
                    )} />

                    {/* Hover glow */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                      request.status === "APPROVED" ? "bg-gradient-to-r from-success/5 via-transparent to-transparent" :
                        request.status.startsWith("REJECTED") ? "bg-gradient-to-r from-destructive/5 via-transparent to-transparent" :
                          "bg-gradient-to-r from-warning/5 via-transparent to-transparent"
                    )} />

                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            {getStatusIcon(request.status)}
                            <span className="font-semibold text-foreground text-base">
                              {request.requestNumber}
                            </span>
                            <span
                              className={cn(
                                "px-3 py-1 text-xs rounded-full font-medium border",
                                statusColors[request.status]
                              )}
                            >
                              {statusLabels[request.status]}
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.04] border border-white/[0.08]",
                                urgencyColors[request.urgency]
                              )}
                            >
                              {request.urgency}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 mb-2.5 font-medium">
                            {request.purpose}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-xs font-medium">{request.categoryName}</span>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="text-xs">
                              {userRole !== UserRole.STAFF
                                ? `By ${request.requesterName}`
                                : new Date(request.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold text-foreground text-xl tracking-tight number-display">
                              {formatCurrency(request.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(request.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short"
                              })}
                            </p>
                          </div>
                          {canEditRequest(request) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                              onClick={(e) => handleEditClick(e, request)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          <div className="p-2.5 rounded-xl bg-white/[0.02] group-hover:bg-primary/10 transition-colors">
                            <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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

      <EditRequestDialog
        request={selectedRequest}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  );
}
