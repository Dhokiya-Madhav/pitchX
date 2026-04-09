import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { shellNavLinks } from "@/features/shell/api/shellApi";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserInitials } from "@/features/auth/lib/userDisplay";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const links = [...shellNavLinks];
  const profileHref = user?.is_owner ? "/owner/profile" : "/profile";
  const profileActive =
    location.pathname === "/profile" || location.pathname === "/owner/profile";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-black text-xl tracking-tight">
          <span className="text-primary">PLAY</span><span className="text-secondary">SPOT</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {token && user?.is_owner && (
            <Link
              to="/owner/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith("/owner")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {token && user ? (
            <>
              <Link
                to={profileHref}
                className="hidden sm:flex items-center gap-2 rounded-lg pr-1 text-muted-foreground hover:text-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm max-w-[140px] truncate hidden lg:inline">{user.name}</span>
              </Link>
              <Link
                to={profileHref}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  profileActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Profile
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>

        <button type="button" className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          {token && user?.is_owner && (
            <Link
              to="/owner/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Dashboard
            </Link>
          )}
          <div className="pt-2 flex flex-col gap-2">
            {token && user ? (
              <>
                <Link to={profileHref} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign Up Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
