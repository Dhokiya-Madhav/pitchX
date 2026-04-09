import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/features/auth/api/authApi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const message = await requestPasswordReset(em);
      setDone(true);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-primary/20" />
        <div className="relative z-10 p-12 text-secondary-foreground max-w-lg">
          <Link to="/" className="inline-block mb-8">
            <h1 className="font-display font-black text-4xl tracking-tight">
              <span className="text-primary">PLAY</span>SPOT
            </h1>
          </Link>
          <h2 className="font-display font-bold text-3xl mb-4">Reset your password</h2>
          <p className="text-secondary-foreground/70 text-lg leading-relaxed">
            Players and ground owners use the same reset flow. Enter the email you sign in with and
            we&apos;ll send a link if an account exists.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link to="/">
              <h1 className="font-display font-black text-2xl tracking-tight">
                <span className="text-primary">PLAY</span>
                <span className="text-secondary">SPOT</span>
              </h1>
            </Link>
          </div>

          <h2 className="font-display font-bold text-2xl mb-2">Forgot password</h2>
          <p className="text-muted-foreground mb-6">
            {done
              ? "Check your inbox for the reset link."
              : "We’ll email you a link to choose a new password."}
          </p>

          {!done ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fp-email"
                    type="email"
                    className="pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists for this email, you will receive reset instructions shortly.
            </p>
          )}

          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
