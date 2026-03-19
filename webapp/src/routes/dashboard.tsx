import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowRight,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Zap,
  BarChart3,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import {
  subscribeToDashboardStats,
  subscribeToAllCashRequests,
  deleteAllCashRequests,
  recordToArray,
  type DBCashRequest,
} from "@/lib/firebase-db";
import {
  DashboardStats,
  statusLabels,
  statusColors,
  UserRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, PieChart } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<(DBCashRequest & { id: string })[]>([]);
  const { uid, userProfile } = useAuth();
  const userRole = userProfile?.role || null;
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Generate CSV from local request data
      const allRequests = requests;
      if (allRequests.length === 0) {
        toast({ title: "No data", description: "No requests to export" });
        return;
      }
      const headers = ["Request #", "Purpose", "Amount", "Status", "Requester", "Created"];
      const rows = allRequests.map(r => [
        r.requestNumber, r.purpose, r.amount, r.status, r.requesterName, r.createdAt
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash_requests_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "Export downloaded successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!uid || !userRole) return;

    const unsubStats = subscribeToDashboardStats(
      (s) => {
        setStats(s);
        setIsLoading(false);
      },
      uid,
      userRole
    );

    const unsubRequests = subscribeToAllCashRequests((data) => {
      let arr = recordToArray(data);
      // Filter by user if STAFF
      if (userRole === "STAFF") {
        arr = arr.filter(r => r.requesterId === uid);
      }
      // Sort by newest first and take top 5
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(arr.slice(0, 5));
      setIsLoading(false);
    });

    return () => {
      unsubStats();
      unsubRequests();
    };
  }, [uid, userRole]);

  const handleResetAllRequests = async () => {
    setIsResetting(true);
    try {
      await deleteAllCashRequests();
      toast({
        title: "Success",
        description: "All requests have been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to reset requests:", error);
      toast({
        title: "Error",
        description: "Failed to delete requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const statCards = [
    {
      label: "Total Requests",
      value: stats?.totalRequests || 0,
      icon: BarChart3,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      gradient: "from-blue-500/20 to-blue-600/5",
      iconBg: "bg-blue-500/20",
      glowClass: "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]",
    },
    {
      label: "Pending",
      value: stats?.pendingRequests || 0,
      icon: Clock,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      gradient: "from-orange-500/20 to-orange-600/5",
      iconBg: "bg-orange-500/20",
      glowClass: "group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]",
    },
    {
      label: "Approved",
      value: stats?.approvedRequests || 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      gradient: "from-emerald-500/20 to-emerald-600/5",
      iconBg: "bg-emerald-500/20",
      glowClass: "group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]",
    },
    {
      label: "Rejected",
      value: stats?.rejectedRequests || 0,
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      gradient: "from-red-500/20 to-red-600/5",
      iconBg: "bg-red-500/20",
      glowClass: "group-hover:shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-9 w-52 shimmer rounded-xl mb-3" />
              <div className="h-5 w-80 shimmer rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 shimmer rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 shimmer rounded-2xl" />
            ))}
          </div>
          <div className="h-96 shimmer rounded-2xl" />
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
        className="space-y-8"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Dashboard
              </h1>
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/20">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Live
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-lg font-bold tracking-wide">
              {userRole === UserRole.STAFF
                ? "PRECISION LIQUIDITY MANAGEMENT"
                : "REAL-TIME ENTERPRISE CASH FLOW"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-destructive/5 hover:bg-destructive/10 text-destructive border-destructive/20 hover:border-destructive/30"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-border">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-foreground text-xl">
                          Reset All Requests
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-muted-foreground text-base">
                        This action cannot be undone. This will permanently delete all
                        cash requests from the system, including pending, approved, and
                        rejected requests.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                      <AlertDialogCancel className="bg-muted/50 border-border hover:bg-muted hover:border-border">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetAllRequests}
                        disabled={isResetting}
                        className="bg-destructive hover:bg-destructive/90 text-white border-0"
                      >
                        {isResetting ? "Deleting..." : "Delete All Requests"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {userRole === UserRole.STAFF && (
              <Link to="/new-request">
                <Button className="btn-glow bg-gradient-to-r from-primary to-accent text-white shadow-glow-md h-12 px-8">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  New Request
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className={cn(
                "glass-card-hover relative h-full overflow-hidden transition-all duration-700",
                stat.borderColor
              )}>
                {/* Cyber Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-20 transition-opacity duration-700",
                  stat.gradient
                )} />

                <div className="relative p-8 flex items-start justify-between">
                  <div className="space-y-4 z-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-6xl font-black text-foreground tracking-tighter number-display drop-shadow-glow-sm">
                        {stat.value}
                      </p>
                    </div>
                  </div>

                  {/* Icon Container with Glass Glow */}
                  <div className={cn(
                    "p-5 rounded-2xl transition-all duration-700 shadow-elevation-2",
                    stat.iconBg,
                    "border border-border/50 group-hover:scale-110 group-hover:shadow-primary/40 group-hover:border-primary/20"
                  )}>
                    <stat.icon className={cn("w-8 h-8", stat.color)} />
                  </div>
                </div>

                {/* Bottom Glow Line */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                  "bg-gradient-to-r from-transparent via-current to-transparent",
                  stat.color
                )} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Amount Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* Total Amount Card */}
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group glass-card-hover relative border-primary/20 overflow-hidden"
          >
            {/* Animated Glow Effect */}
            <div className="absolute -inset-24 bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse-soft" />
            
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent opacity-60" />

            <div className="relative p-12">
              <div className="flex items-center gap-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 rounded-3xl blur-3xl opacity-20 group-hover:opacity-60 transition-all duration-700 scale-150" />
                  <div className="relative p-7 rounded-3xl bg-primary/10 border border-primary/30 shadow-inner group-hover:border-primary/50 transition-colors duration-700">
                    <Wallet className="w-12 h-12 text-primary drop-shadow-glow-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-black mb-3 uppercase tracking-[0.3em]">Total Volume</p>
                  <p className="text-6xl md:text-7xl font-black text-foreground tracking-tighter number-display drop-shadow-glow">
                    {formatCurrency(stats?.totalAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group glass-card-hover relative border-orange-500/20 overflow-hidden"
          >
            {/* Animated Glow Effect */}
            <div className="absolute -inset-24 bg-orange-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse-soft" />

            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-transparent opacity-60" />

            <div className="relative p-12">
              <div className="flex items-center gap-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400/50 rounded-3xl blur-3xl opacity-20 group-hover:opacity-60 transition-all duration-700 scale-150" />
                  <div className="relative p-7 rounded-3xl bg-orange-500/10 border border-orange-400/30 shadow-inner group-hover:border-orange-500/50 transition-colors duration-700">
                    <Clock className="w-12 h-12 text-orange-400 drop-shadow-glow-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-black mb-3 uppercase tracking-[0.3em]">Pending Exposure</p>
                  <p className="text-6xl md:text-7xl font-black text-foreground tracking-tighter number-display drop-shadow-glow">
                    {formatCurrency(stats?.pendingAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Requests */}
        <motion.div variants={itemVariants}>
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {userRole === UserRole.STAFF ? "Recent Requests" : "Requests to Review"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {requests.length > 0 ? `${requests.length} most recent` : "No requests yet"}
                    </p>
                  </div>
                </div>
                <Link to="/requests">
                  <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 group h-10">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-5">
                    <div className="absolute inset-0 bg-muted/30 rounded-2xl blur-xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50">
                      <Zap className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  </div>
                  <p className="text-foreground font-medium mb-2">No requests yet</p>
                  <p className="text-sm text-muted-foreground mb-5">Get started by creating your first cash request</p>
                  {userRole === UserRole.STAFF && (
                    <Link to="/new-request">
                      <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold btn-glow">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Request
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link to={`/requests/${request.id}`} className="block">
                        <motion.div
                          whileHover={{ x: 8, scale: 1.005 }}
                          transition={{ duration: 0.3, ease: "smooth" }}
                          className="group relative flex items-center justify-between p-5 rounded-2xl bg-muted/5 hover:bg-muted/30 border border-border/30 hover:border-border shadow-sm hover:shadow-elevation-2 transition-all duration-500"
                        >
                          {/* Left accent */}
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full transition-all duration-500 shadow-glow-sm",
                            request.status === "APPROVED" ? "bg-success shadow-success/40" :
                              request.status.startsWith("REJECTED") ? "bg-destructive shadow-destructive/40" : "bg-warning shadow-warning/40",
                            "opacity-20 group-hover:opacity-100 group-hover:h-14"
                          )} />

                          <div className="flex-1 min-w-0 pl-6">
                            <div className="flex items-center gap-4 mb-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground tracking-wider">
                                {request.requestNumber}
                              </span>
                              <span
                                className={cn(
                                  "px-3 py-1 text-[10px] uppercase tracking-widest rounded-full font-bold border",
                                  statusColors[request.status]
                                )}
                              >
                                {statusLabels[request.status]}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors truncate pr-4">
                              {request.purpose}
                            </p>
                          </div>
                          <div className="text-right ml-4 flex items-center gap-6">
                            <div>
                              <p className="text-2xl font-black text-foreground number-display tracking-tight">
                                {formatCurrency(request.amount)}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {new Date(request.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/10 border border-border/30 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500">
                              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
