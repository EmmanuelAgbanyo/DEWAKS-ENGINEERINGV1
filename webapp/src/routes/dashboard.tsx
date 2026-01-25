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
import { api } from "@/lib/api";
import {
  DashboardStats,
  CashRequest,
  statusLabels,
  statusColors,
  UserRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, PieChart } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<CashRequest[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.raw("/api/reports/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
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

  const fetchData = async () => {
    try {
      const [statsData, requestsData, userData] = await Promise.all([
        api.get<DashboardStats>("/api/cash-requests/stats"),
        api.get<CashRequest[]>("/api/cash-requests"),
        api.get<{ id: string; role: string }>("/api/users/me"),
      ]);
      setStats(statsData);
      setRequests(requestsData.slice(0, 5));
      setUserRole(userData.role);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetAllRequests = async () => {
    setIsResetting(true);
    try {
      await api.delete("/api/cash-requests/reset-all");
      toast({
        title: "Success",
        description: "All requests have been deleted successfully.",
      });
      await fetchData();
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
            <p className="text-muted-foreground text-base">
              {userRole === UserRole.STAFF
                ? "Track your cash requests and monitor their status"
                : "Overview of all cash flow requests and activity"}
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
                  <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-white/10">
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
                      <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20">
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
                <Button className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 border-0 btn-glow h-11 px-5">
                  <PlusCircle className="w-4 h-4 mr-2" />
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
                "relative h-full overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500",
                "bg-[#0f172a]/40 hover:bg-[#0f172a]/60", // Darker glass base
                stat.borderColor,
                stat.glowClass
              )}>
                {/* Gradient Background Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity duration-500",
                  stat.gradient
                )} />

                {/* Glass Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative p-6 flex items-start justify-between">
                  <div className="space-y-3 z-10">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-white tracking-tight number-display drop-shadow-md">
                        {stat.value}
                      </p>
                      {stat.value > 0 && (
                        <span className={cn("flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5", stat.color)}>
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icon Container with Glow */}
                  <div className={cn(
                    "p-3.5 rounded-xl transition-all duration-300 shadow-lg",
                    stat.iconBg,
                    "border border-white/5",
                    "group-hover:scale-110 group-hover:shadow-current/20"
                  )}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
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
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-900/10"
          >
            <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-xl transition-colors hover:bg-[#0f172a]/80" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 opacity-50" />

            <div className="relative p-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity scale-125" />
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 ring-1 ring-blue-500/20 shadow-inner">
                    <Wallet className="w-8 h-8 text-blue-400 drop-shadow-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-base text-white/90 font-medium mb-1 tracking-wide">Total Amount Requested</p>
                  <p className="text-4xl md:text-5xl font-bold text-white tracking-tight number-display drop-shadow-md">
                    {formatCurrency(stats?.totalAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pending Amount Card */}
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-900/10"
          >
            <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-xl transition-colors hover:bg-[#0f172a]/80" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 opacity-50" />

            <div className="relative p-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity scale-125" />
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/30 ring-1 ring-orange-500/20 shadow-inner">
                    <Clock className="w-8 h-8 text-orange-400 drop-shadow-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-base text-white/90 font-medium mb-1 tracking-wide">Pending Amount</p>
                  <p className="text-4xl md:text-5xl font-bold text-white tracking-tight number-display drop-shadow-md">
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
            <div className="p-6 border-b border-white/[0.06]">
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
                    <div className="relative w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center border border-white/[0.06]">
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
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                          className="group relative flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all duration-300"
                        >
                          {/* Left accent */}
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-300",
                            request.status === "APPROVED" ? "bg-success" :
                              request.status.startsWith("REJECTED") ? "bg-destructive" : "bg-warning",
                            "opacity-40 group-hover:opacity-100 group-hover:h-10"
                          )} />

                          <div className="flex-1 min-w-0 pl-4">
                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
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
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {request.purpose}
                            </p>
                          </div>
                          <div className="text-right ml-4 flex items-center gap-4">
                            <div>
                              <p className="font-semibold text-foreground number-display">
                                {formatCurrency(request.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {new Date(request.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short"
                                })}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.02] group-hover:bg-primary/10 transition-colors">
                              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
