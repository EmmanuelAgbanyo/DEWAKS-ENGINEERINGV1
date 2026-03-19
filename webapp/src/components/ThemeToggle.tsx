import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  collapsed?: boolean;
}

export function ThemeToggle({ className, collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative flex items-center rounded-xl transition-all duration-300 overflow-hidden",
        collapsed
          ? "justify-center w-12 h-12 mx-auto"
          : "gap-3 px-4 py-3 w-full",
        "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Cyber Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Cyber Mode"}
    >
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ rotate: isDark ? 360 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {isDark ? (
          <Sun className={cn("transition-all duration-300", collapsed ? "w-5 h-5" : "w-4 h-4")} />
        ) : (
          <Moon className={cn("transition-all duration-300", collapsed ? "w-5 h-5" : "w-4 h-4")} />
        )}
      </motion.div>

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="text-xs font-medium whitespace-nowrap"
        >
          {isDark ? "Light Mode" : "Cyber Mode"}
        </motion.span>
      )}
    </button>
  );
}
