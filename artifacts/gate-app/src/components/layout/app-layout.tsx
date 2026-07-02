import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Briefcase,
  Users,
  ImageIcon,
  HelpCircle,
  BookOpen,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin", "manager", "supervisor", "crew"] },
  { label: "Estimates", href: "/estimates", icon: <FileText size={18} />, roles: ["admin", "manager", "supervisor"] },
  { label: "Invoices", href: "/invoices", icon: <Receipt size={18} />, roles: ["admin", "manager"] },
  { label: "Jobs", href: "/jobs", icon: <Briefcase size={18} />, roles: ["admin", "manager", "supervisor", "crew"] },
  { label: "Time Tracking", href: "/time-entries", icon: <Clock size={18} />, roles: ["admin", "manager", "supervisor", "crew"] },
  { label: "Team", href: "/users", icon: <Users size={18} />, roles: ["admin", "manager"] },
  { label: "Portfolio", href: "/portfolio", icon: <ImageIcon size={18} />, roles: ["admin", "manager"] },
  { label: "Blog", href: "/blog", icon: <BookOpen size={18} />, roles: ["admin", "manager"] },
  { label: "FAQ", href: "/faq", icon: <HelpCircle size={18} />, roles: ["admin", "manager"] },
  { label: "Settings", href: "/settings", icon: <Settings size={18} />, roles: ["admin"] },
  // Client items
  { label: "My Estimates", href: "/client/estimates", icon: <FileText size={18} />, roles: ["client"] },
  { label: "My Invoices", href: "/client/invoices", icon: <Receipt size={18} />, roles: ["client"] },
  { label: "My Jobs", href: "/client/jobs", icon: <Briefcase size={18} />, roles: ["client"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role ?? "client";
  const navItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    supervisor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    crew: "bg-green-500/20 text-green-400 border-green-500/30",
    client: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:flex"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AG</span>
            </div>
            <div>
              <p className="font-semibold text-sidebar-foreground text-sm leading-tight">Automatic Gate</p>
              <p className="text-xs text-sidebar-foreground/60">&amp; Entryways</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-sm border font-medium capitalize", roleBadgeColor[role])}>
                    {role}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut size={14} className="mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={18} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm">{user?.firstName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut size={14} className="mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
