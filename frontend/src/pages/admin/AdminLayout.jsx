import React from "react";
import { NavLink, useNavigate, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, LogOut, ExternalLink, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, loadingUser, logout } = useApp();
  const navigate = useNavigate();

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-[var(--ss-bg)]"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[var(--ss-bg)] flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--ss-border)] bg-[var(--ss-bg-2)] sticky top-0 h-screen">
        <div className="p-5 border-b border-[var(--ss-border)]"><Logo className="h-10" /></div>
        <nav className="p-3 flex-1 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`admin-nav-${n.label.toLowerCase()}`}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${isActive ? "bg-[rgba(59,130,246,0.12)] text-[var(--ss-mint)]" : "text-[var(--ss-muted)] hover:text-[var(--ss-fg)]"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--ss-border)] space-y-2">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-[var(--ss-muted)] hover:text-[var(--ss-fg)]"><ExternalLink className="h-4 w-4" /> View website</a>
          <button onClick={() => { logout(); navigate("/admin/login"); }} className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-[var(--ss-muted)] hover:text-[#ff9aa4]"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[var(--ss-border)] bg-[var(--ss-bg-2)] px-4 h-14">
          <Logo className="h-8" />
          <div className="flex items-center gap-3">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `text-sm ${isActive ? "text-[var(--ss-mint)]" : "text-[var(--ss-muted)]"}`}>{n.label}</NavLink>
            ))}
            <button onClick={() => { logout(); navigate("/admin/login"); }} className="text-[var(--ss-muted)]"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl"><Outlet /></div>
      </div>
    </div>
  );
}
