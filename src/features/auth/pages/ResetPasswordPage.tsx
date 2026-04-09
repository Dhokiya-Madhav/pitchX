import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordWithToken,
  validateResetToken,
} from "@/features/auth/api/authApi";

const MIN_LEN = 8;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token")?.trim() ?? "";
  const missingToken = token.length === 0;

  const [tokenOk, setTokenOk] = useState<boolean | null>(missingToken ? false : null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await validateResetToken(token);
        if (!cancelled) setTokenOk(true);
      } catch {
        if (!cancelled) setTokenOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || tokenOk !== true) return;
    if (password.length < MIN_LEN) {
      toast.error(`Password must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithToken(token, password);
      toast.success("Password updated. You can sign in.");
      navigate("/auth", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
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
          <h2 className="font-display font-bold text-3xl mb-4">Choose a new password</h2>
          <p className="text-secondary-foreground/70 text-lg leading-relaxed">
            Use at least {MIN_LEN} characters. After saving, sign in with your new password.
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

          <h2 className="font-display font-bold text-2xl mb-2">Reset password</h2>

          {!missingToken && tokenOk === null && (
            <p className="text-muted-foreground text-sm mb-6">Checking your link…</p>
          )}

          {(missingToken || tokenOk === false) && (
            <div className="space-y-4">
              <p className="text-destructive text-sm">
                {missingToken
                  ? "Missing reset token. Open the link from your email."
                  : "This reset link is invalid or has expired. Request a new one."}
              </p>
              <Link to="/auth/forgot-password">
                <Button variant="outline" className="w-full">
                  Request new link
                </Button>
              </Link>
            </div>
          )}

          {tokenOk === true && (
            <form onSubmit={onSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="rp-password">New password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rp-password"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={MIN_LEN}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">At least {MIN_LEN} characters</p>
              </div>
              <div>
                <Label htmlFor="rp-confirm">Confirm password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rp-confirm"
                    type="password"
                    className="pl-10"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={MIN_LEN}
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
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

export default ResetPasswordPage;
