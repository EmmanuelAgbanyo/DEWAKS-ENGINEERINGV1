import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Banknote,
  Shield,
  UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthProvider";
import {
  subscribeToCashRequest,
  updateCashRequest,
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

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uid, userProfile } = useAuth();
  const userRole = userProfile?.role || null;
  const userId = uid;
  const [request, setRequest] = useState<(DBCashRequest & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToCashRequest(id, (data) => {
      if (data) {
        setRequest({ ...data, id });
      } else {
        setRequest(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleReview = async (action: "approve" | "reject" | "disburse") => {
    if (action === "reject" && !comment.trim()) {
      setShowRejectModal(true);
      return;
    }

    if (!id || !userRole || !userProfile) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updates: Partial<DBCashRequest> = {};

      if (action === "disburse") {
        updates.status = "DISBURSED";
        updates.disbursedId = uid;
        updates.disbursedName = userProfile.name;
        updates.disbursedAt = now;
      } else if (action === "approve") {
        if (userRole === UserRole.ADMIN && request?.status === CashRequestStatus.PENDING_ADMIN) {
          updates.status = "PENDING_MANAGER";
          updates.adminId = uid;
          updates.adminName = userProfile.name;
          updates.adminComment = comment.trim() || null;
          updates.adminReviewedAt = now;
        } else {
          // Manager final approval or manager reviewing PENDING_ADMIN (direct)
          updates.status = "APPROVED";
          if (request?.status === CashRequestStatus.PENDING_ADMIN) {
            // Manager doing direct approval
            updates.adminId = uid;
            updates.adminName = userProfile.name;
            updates.adminComment = comment.trim() || null;
            updates.adminReviewedAt = now;
          }
          updates.managerId = uid;
          updates.managerName = userProfile.name;
          updates.managerComment = comment.trim() || null;
          updates.managerReviewedAt = now;
        }
      } else {
        // Reject
        if (userRole === UserRole.ADMIN) {
          updates.status = "REJECTED_BY_ADMIN";
          updates.adminId = uid;
          updates.adminName = userProfile.name;
          updates.adminComment = comment.trim();
          updates.adminReviewedAt = now;
        } else {
          updates.status = "REJECTED_BY_MANAGER";
          updates.managerId = uid;
          updates.managerName = userProfile.name;
          updates.managerComment = comment.trim();
          updates.managerReviewedAt = now;
        }
      }

      await updateCashRequest(id, updates);
      setComment("");
      setShowRejectModal(false);
    } catch (error) {
      console.error("Failed to review request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReview = () => {
    if (!request || !userRole) return false;

    // Admin can review PENDING_ADMIN
    if (userRole === UserRole.ADMIN && request.status === CashRequestStatus.PENDING_ADMIN) {
      return true;
    }
    // Manager can review PENDING_ADMIN (skip admin) or PENDING_MANAGER
    if (userRole === UserRole.MANAGER &&
      (request.status === CashRequestStatus.PENDING_ADMIN || request.status === CashRequestStatus.PENDING_MANAGER)) {
      return true;
    }
    return false;
  };

  const canDisburse = () => {
    if (!request || !userRole) return false;
    return (
      (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) &&
      request.status === CashRequestStatus.APPROVED
    );
  };

  const canEditRequest = () => {
    if (!request || !userRole || !userId) return false;
    return (
      userRole === UserRole.STAFF &&
      userId === request.requesterId &&
      request.status === CashRequestStatus.PENDING_ADMIN
    );
  };

  const handleEditSuccess = () => {
    // Real-time subscription auto-updates
  };

  const getStatusIcon = (status: string) => {
    if (status === "DISBURSED") {
      return (
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_hsl(190,90%,50%,0.2)]">
          <CheckCircle2 className="w-6 h-6 text-cyan-400" />
        </div>
      );
    }
    if (status === "APPROVED") {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
      );
    }
    if (status.startsWith("REJECTED")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
        <Clock className="w-6 h-6 text-amber-400" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-10 w-24 shimmer rounded-lg" />
          <div className="h-32 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">Request not found</p>
          <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          <div className="flex items-center gap-5">
            {getStatusIcon(request.status)}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {request.requestNumber}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-full inline-block",
                    statusColors[request.status]
                  )}
                >
                  {statusLabels[request.status]}
                </span>
                <span className={cn("text-sm font-medium", urgencyColors[request.urgency])}>
                  {request.urgency} Priority
                </span>
              </div>
            </div>
            {canEditRequest() && (
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
                className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Request
              </Button>
            )}
          </div>
        </div>

        {/* Amount Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="relative text-center">
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Amount Requested</p>
            <p className="text-5xl font-bold text-gradient-gold tracking-tight">
              {formatCurrency(request.amount)}
            </p>
          </div>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Request Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purpose */}
            <div className="md:col-span-2 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Purpose</span>
              </div>
              <p className="text-foreground font-medium text-lg">{request.purpose}</p>
            </div>

            {/* Category */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">Category</span>
              </div>
              <p className="text-foreground font-medium">{request.categoryName}</p>
            </div>

            {/* Urgency */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Urgency Level</span>
              </div>
              <p className={cn("font-semibold", urgencyColors[request.urgency])}>
                {request.urgency}
              </p>
            </div>

            {/* Requester */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Requested By</span>
              </div>
              <p className="text-foreground font-medium">{request.requesterName}</p>
              <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
            </div>

            {/* Date */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Submitted</span>
              </div>
              <p className="text-foreground font-medium">{formatDate(request.createdAt)}</p>
            </div>

            {/* Description */}
            {request.description && (
              <div className="md:col-span-2 p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Additional Details</span>
                </div>
                <p className="text-foreground/90 leading-relaxed">
                  {request.description}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Review Timeline */}
        {(request.adminId || request.managerId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Approval Timeline
            </h3>
            <div className="space-y-4">
              {request.disbursedAt && (
                <div className="flex gap-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/30 shadow-[0_0_20px_hsl(190,90%,50%,0.05)]">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_hsl(190,90%,50%,0.2)] shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Disbursed
                    </p>
                    <p className="text-sm text-cyan-400/80">
                      by {request.disbursedName} • {formatDate(request.disbursedAt)}
                    </p>
                  </div>
                </div>
              )}
              {request.adminId && (
                <div className="flex gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      request.status === "REJECTED_BY_ADMIN"
                        ? "bg-red-500/20 border border-red-500/30"
                        : "bg-emerald-500/20 border border-emerald-500/30"
                    )}
                  >
                    {request.status === "REJECTED_BY_ADMIN" ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Admin Review
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {request.adminName} • {request.adminReviewedAt && formatDate(request.adminReviewedAt)}
                    </p>
                    {request.adminComment && (
                      <p className="text-sm text-foreground/80 mt-3 p-3 bg-secondary/40 rounded-lg border-l-2 border-primary/50">
                        "{request.adminComment}"
                      </p>
                    )}
                  </div>
                </div>
              )}
              {request.managerId && (
                <div className="flex gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      request.status === "REJECTED_BY_MANAGER"
                        ? "bg-red-500/20 border border-red-500/30"
                        : "bg-emerald-500/20 border border-emerald-500/30"
                    )}
                  >
                    {request.status === "REJECTED_BY_MANAGER" ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Manager Approval
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {request.managerName} • {request.managerReviewedAt && formatDate(request.managerReviewedAt)}
                    </p>
                    {request.managerComment && (
                      <p className="text-sm text-foreground/80 mt-3 p-3 bg-secondary/40 rounded-lg border-l-2 border-primary/50">
                        "{request.managerComment}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Disburse Action */}
        {canDisburse() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 border-2 border-cyan-500/30 shadow-[0_0_30px_hsl(190,90%,50%,0.05)]"
          >
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-400" />
              Disburse Funds
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
               <p className="text-muted-foreground max-w-lg">
                 Mark this approved request as successfully disbursed. This action indicates the money has been completely transferred to the requester's account.
               </p>
               <Button
                  onClick={() => handleReview("disburse")}
                  disabled={isSubmitting}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/30 shrink-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Mark as Disbursed
                </Button>
            </div>
          </motion.div>
        )}

        {/* Review Actions */}
        {canReview() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 border-2 border-primary/20"
          >
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Review This Request
            </h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Add a comment (optional for approval, required for rejection)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-secondary/30 border-border/50 focus:border-primary/50 min-h-[100px] resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!comment.trim()) {
                      setShowRejectModal(true);
                    } else {
                      handleReview("reject");
                    }
                  }}
                  disabled={isSubmitting}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {userRole === UserRole.ADMIN
                    ? "Approve & Forward"
                    : request?.status === CashRequestStatus.PENDING_ADMIN
                      ? "Approve (Direct)"
                      : "Final Approve"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card p-6 max-w-md w-full border-2 border-red-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rejection Reason Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please provide a reason for rejecting this request.
                  </p>
                </div>
              </div>
              <Textarea
                placeholder="Enter rejection reason..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-secondary/30 border-border/50 focus:border-red-500/50 min-h-[120px] mb-4 resize-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="border-border hover:bg-secondary/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReview("reject")}
                  disabled={!comment.trim() || isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      <EditRequestDialog
        request={request}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  );
}
