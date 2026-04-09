import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Phone } from "lucide-react";
import { toast } from "sonner";
import { signupOwner, signupPlayer } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/context/AuthContext";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"user" | "owner">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginPlayer, loginOwner, user, token, isReady } = useAuth();

  const goToLoginAfterSignup = () => {
    setPassword("");
    setName("");
    setPhone("");
    setIsLogin(true);
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    if (!isReady || !user || !token) return;
    if (location.pathname !== "/auth") return;
    const from = (location.state as { from?: string } | null)?.from;
    if (from && typeof from === "string" && from !== "/auth") {
      navigate(from, { replace: true });
      return;
    }
    navigate(user.is_owner ? "/owner/dashboard" : "/bookings", { replace: true });
  }, [isReady, user, token, navigate, location.state, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        toast.error("Please fill in name, email, phone, and password.");
        return;
      }
      setIsSubmitting(true);
      try {
        const body = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        };
        if (role === "user") {
          await signupPlayer(body);
        } else {
          await signupOwner(body);
        }
        toast.success("Account created. Sign in with your email and password.");
        goToLoginAfterSignup();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Signup failed";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === "owner") {
        await loginOwner({ email: email.trim(), password });
        toast.success("Welcome back!");
      } else {
        await loginPlayer({ email: email.trim(), password });
        toast.success("Welcome back!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-primary/20" />
        <div className="relative z-10 p-12 text-secondary-foreground max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block mb-8">
              <h1 className="font-display font-black text-4xl tracking-tight">
                <span className="text-primary">PLAY</span>SPOT
              </h1>
            </Link>
            <h2 className="font-display font-bold text-3xl mb-4">
              {role === "user" ? "Find & Book Your Next Match" : "Manage Your Grounds Like a Pro"}
            </h2>
            <p className="text-secondary-foreground/70 text-lg leading-relaxed">
              {role === "user"
                ? "Discover the best sports grounds in your city. Book slots instantly and pay at the ground."
                : "List your grounds, manage slots, track bookings, and grow your business with our powerful dashboard."}
            </p>
          </motion.div>

          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-20 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link to="/">
              <h1 className="font-display font-black text-2xl tracking-tight">
                <span className="text-primary">PLAY</span><span className="text-secondary">SPOT</span>
              </h1>
            </Link>
          </div>

          <h2 className="font-display font-bold text-2xl mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isLogin ? "Sign in to continue booking" : "Join us and start playing today"}
          </p>

          <div className="flex bg-muted rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                role === "user" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              🏏 Player
            </button>
            <button
              type="button"
              onClick={() => setRole("owner")}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                role === "owner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              🏟️ Ground Owner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                {isLogin ? (
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full mt-6" disabled={isSubmitting}>
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
