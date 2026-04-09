import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Plus,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserInitials } from "@/features/auth/lib/userDisplay";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type OwnerShellTab =
  | "dashboard"
  | "grounds"
  | "slots"
  | "bookings"
  | "add-ground";

const sidebarItems: { id: OwnerShellTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "grounds", label: "My Grounds", icon: MapPin },
  { id: "slots", label: "Manage Slots", icon: Calendar },
  { id: "bookings", label: "Bookings", icon: Users },
  { id: "add-ground", label: "Add Ground", icon: Plus },
];

interface OwnerShellLayoutProps {
  title: string;
  children: ReactNode;
  /** When null (e.g. on /owner/profile), no dashboard tab is highlighted. */
  activeTab: OwnerShellTab | null;
  onSelectTab: (tab: OwnerShellTab) => void;
}

export function OwnerShellLayout({
  title,
  children,
  activeTab,
  onSelectTab,
}: OwnerShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname === "/owner/profile";
  const initials = getUserInitials(user?.name ?? "");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="font-display font-black text-xl">
            <span className="text-sidebar-primary">PLAY</span>SPOT
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.id && !isProfileActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <Link
            to="/owner/profile"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isProfileActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </nav>

        <div className="absolute bottom-6 left-3 right-3 space-y-1">
          <Link to="/">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              Back to Site
            </button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 min-h-screen">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
          <button type="button" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display font-bold text-lg capitalize">{title}</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/owner/profile" className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Profile</TooltipContent>
          </Tooltip>
        </header>

        {children}
      </main>
    </div>
  );
}
