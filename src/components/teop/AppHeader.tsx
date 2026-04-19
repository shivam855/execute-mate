import { Link, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { pathname } = useLocation();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));
  return (
    <header className="sticky top-0 z-40 border-b border-border surface/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight">TEOP</span>
          <span className="hidden font-mono text-xs text-muted-foreground md:inline">/ test execution orchestration</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive("/") ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/executions"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive("/executions") ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListChecks className="h-4 w-4" /> Executions
          </Link>
        </nav>
      </div>
    </header>
  );
}
