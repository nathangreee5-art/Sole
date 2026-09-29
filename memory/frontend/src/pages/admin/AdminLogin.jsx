import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { useApp } from "@/context/AppContext";
import { login } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.user.role !== "admin") { toast.error("This account is not an admin."); setLoading(false); return; }
      loginUser(res.token, res.user);
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ss-bg)] px-4 ss-noise">
      <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
      <div className="relative w-full max-w-md ss-card p-8">
        <Logo className="h-12" />
        <h1 className="mt-6 font-display text-3xl text-[var(--ss-fg)]">Admin sign in</h1>
        <p className="text-sm text-[var(--ss-muted)] mt-1">Manage orders, pricing, shipping and content.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label className="text-[var(--ss-muted)]">Email</Label><Input data-testid="admin-login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <div><Label className="text-[var(--ss-muted)]">Password</Label><Input data-testid="admin-login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <Button type="submit" disabled={loading} data-testid="admin-login-submit-button" className="w-full bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"><Lock className="mr-2 h-4 w-4" /> {loading ? "Signing in..." : "Sign in"}</Button>
        </form>
      </div>
    </div>
  );
}
