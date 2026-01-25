import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  Tag,
  UserCog,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.role) {
          setUserRole(data.data.role);
        }
      })
      .catch(console.error);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [UserRole.STAFF, UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      label: "New Request",
      href: "/new-request",
      icon: PlusCircle,
      roles: [UserRole.STAFF],
    },
    {
      label: "My Requests",
      href: "/requests",
      icon: FileText,
      roles: [UserRole.STAFF],
    },
    {
      label: "Review Requests",
      href: "/requests",
      icon: FileText,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      label: "All Requests",
      href: "/all-requests",
      icon: FileText,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      label: "User Management",
      href: "/users",
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      label: "Finances",
      href: "/finances",
      icon: LineChart,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      label: "Categories",
      href: "/categories",
      icon: Tag,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole as typeof UserRole.STAFF)
  );

  const roleLabels: Record<string, { label: string; color: string }> = {
    STAFF: { label: "Staff", color: "text-muted-foreground" },
    ADMIN: { label: "Administrator", color: "text-primary" },
    MANAGER: { label: "Manager", color: "text-accent" },
  };

  const sidebarWidth = isCollapsed ? 80 : 288; // 20 (5rem) vs 72 (18rem)

  return (
    <div className="min-h-screen relative bg-background selection:bg-primary/20">
      {/* Background */}
      <div className="fixed inset-0 bg-background" />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/6 via-primary/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-accent/4 via-accent/2 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-primary/3 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <motion.aside
        initial={false}
        animate={{
          width: window.innerWidth >= 1024 ? sidebarWidth : "100%",
          x: window.innerWidth >= 1024 ? 0 : (sidebarOpen ? 0 : "-100%")
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full border-r border-white/[0.05] transition-all duration-300",
          !sidebarOpen && "lg:block hidden", // Ensure visible on desktop
          sidebarOpen && "block lg:block",  // Visible when toggled on mobile
          // Width handled by motion.aside or CSS for mobile override
          "w-72 lg:w-auto"
        )}
        style={{ width: isCollapsed ? '5rem' : '18rem' }} // Fallback/Static width
      >
        <div className={cn(
          "flex flex-col h-full relative overflow-hidden bg-[#020617] border-r border-white/[0.05]",
          isCollapsed ? "px-2" : "px-4"
        )}>

          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

          {/* Header / Logo */}
          <div className={cn(
            "relative border-b border-white/[0.05] flex items-center transition-all duration-300",
            isCollapsed ? "h-20 justify-center p-0" : "h-24 p-6"
          )}>
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl blur-lg opacity-35" />
                <div className={cn(
                  "relative rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden transition-all duration-300",
                  isCollapsed ? "w-10 h-10" : "w-12 h-12"
                )}>
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap"
                  >
                    <h1 className="font-bold text-lg text-white tracking-tight">Dewaks</h1>
                    <p className="text-xs text-blue-200/60 font-medium">Cashflow System</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {filteredNavItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center rounded-xl transition-all duration-300 relative overflow-hidden",
                    isCollapsed ? "justify-center w-12 h-12 mx-auto px-0" : "gap-3 px-4 py-3 w-full",
                    isActive
                      ? "text-white"
                      : "text-blue-200/60 hover:text-white hover:bg-white/[0.05]"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active background - Premium Gradient */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-xl border border-primary/20"
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {/* Active Indicator Strip (Left) with Glow */}
                  {isActive && (
                    <motion.div
                      layoutId="activeStrip"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary),0.8)]"
                    />
                  )}

                  <div className={cn(
                    "relative transition-all duration-300 z-10 flex items-center justify-center top-[1px]",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110" : "group-hover:text-white group-hover:scale-105"
                  )}>
                    <item.icon className={cn(
                      "transition-all duration-300",
                      isCollapsed ? "w-5 h-5" : "w-4 h-4"
                    )} />
                  </div>

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={cn(
                        "relative font-medium text-sm whitespace-nowrap z-10 transition-transform duration-300",
                        !isActive && "group-hover:translate-x-1"
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section & Collapse Toggle */}
          <div className="p-4 border-t border-white/[0.05] space-y-2">

            {/* User Profile Card */}
            <div className={cn(
              "relative rounded-xl overflow-hidden transition-all duration-300",
              isCollapsed ? "p-2 w-10 h-10 mx-auto bg-white/[0.02]" : "p-3 bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.05]"
            )}>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 flex-shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {(session?.user?.name || "U")[0].toUpperCase()}
                  </span>
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-white text-xs truncate">
                      {session?.user?.name?.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-blue-200/60 truncate uppercase tracking-wider font-semibold">
                      {userRole}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Manage Profile */}
            <Link to="/profile" title="Manage Profile" className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-blue-200/80 hover:text-white hover:bg-white/[0.05] h-9 mt-1 transition-all",
                  isCollapsed ? "justify-center px-0" : ""
                )}
              >
                <UserCog className={cn("w-4 h-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && <span className="text-xs font-medium">Manage Profile</span>}
              </Button>
            </Link>

            {/* Sign Out */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-9 transition-all",
                isCollapsed ? "justify-center px-0" : ""
              )}
              title="Sign Out"
            >
              <LogOut className={cn("w-4 h-4", isCollapsed ? "mr-0" : "mr-2")} />
              {!isCollapsed && <span className="text-xs font-medium">Sign Out</span>}
            </Button>

            {/* Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-full h-8 items-center justify-center rounded-lg hover:bg-white/[0.05] text-blue-200/40 hover:text-white transition-colors mt-2"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest"><ChevronRight className="w-3 h-3 rotate-180" /> <span>Collapse</span></div>}
            </button>

          </div>

        </div>
      </motion.aside>

      {/* Main content */}
      <motion.div
        className="relative min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: window.innerWidth >= 1024 ? (isCollapsed ? '5rem' : '18rem') : '0px' }}
      >
        {/* Mobile header */}
        <header className="sticky top-0 z-30 lg:hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-card/90 backdrop-blur-2xl border-b border-white/[0.05]" />
            <div className="relative px-4 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-white/5 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <span className="font-bold text-foreground">Dewaks</span>
              <div className="w-9" /> {/* Spacer */}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </motion.div>
    </div>
  );
}
