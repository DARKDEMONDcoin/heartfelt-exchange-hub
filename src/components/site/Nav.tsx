import { LogoMark } from "@/components/site/LogoMark";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { label: "الموظفون", to: "/employees" },
  { label: "الحلول", to: "/use-cases" },
  { label: "المزايا", to: "/features" },
  { label: "التكاملات", to: "/integrations" },
  { label: "كيف يعمل", to: "/how-it-works" },
  { label: "الأسعار", to: "/pricing" },
  { label: "قصص النجاح", to: "/stories" },
  { label: "المدونة", to: "/blog" },
] as const;

export function Nav({ variant = "over" }: { variant?: "over" | "solid" }) {
  const [open, setOpen] = useState(false);
  const solid = variant === "solid";

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 py-4 text-white",
        solid && "text-foreground",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5">
        <Link to="/" className="nav-floating-control pointer-events-auto group flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 sm:gap-2.5 sm:pe-4">
          <LogoMark className="size-8 sm:size-11" size={44} />
          <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">سهل</span>
        </Link>

        <ul className="pointer-events-auto hidden items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={cn(
                  "nav-floating-control relative rounded-full px-2.5 py-2 text-sm font-medium transition-colors",
                  solid ? "text-ink-soft hover:text-primary" : "text-white/90 hover:text-white",
                )}
                activeProps={{
                  className: solid ? "text-primary font-bold" : "text-white font-bold",
                }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="pointer-events-auto hidden items-center gap-2 xl:flex">
          <Link
            to="/app"
            className={cn(
              "nav-floating-control rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              solid ? "text-ink-soft hover:text-primary" : "text-white/90 hover:text-white",
            )}
          >
            جرّب الموظفين
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" as const }}
            className={cn(
              "nav-floating-control rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              solid ? "text-ink-soft hover:text-primary" : "text-white/90 hover:text-white",
            )}
          >
            دخول
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" as const }}
            className={cn(
              "group relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold transition-transform duration-300 hover:-translate-y-0.5",
              solid ? "bg-foreground text-background" : "bg-white text-ink",
            )}
          >
            <span className="relative z-10">أنشئ حسابك</span>
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
          className={cn(
            "nav-floating-control pointer-events-auto size-11 rounded-full xl:hidden",
            solid ? "text-foreground" : "text-white",
          )}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      <div
        className={cn(
          "pointer-events-auto transition-[max-height,opacity] duration-500 ease-out xl:hidden",
          open
            ? "max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain opacity-100"
            : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        <div className="nav-glass-sheet mx-3 my-3 max-w-[26rem] p-4 text-foreground md:mx-auto">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-semibold tracking-wide text-foreground/55">تنقّل</span>
            <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.72rem] font-bold text-foreground/70" style={{ border: "1px solid color-mix(in oklab, var(--foreground) 14%, transparent)" }}>
              <LogoMark className="size-5" size={20} /> سهل
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-1.5">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  onClick={() => setOpen(false)}
                  to={l.to}
                  className="nav-glass-item block px-3.5 py-2.5 text-[0.95rem] font-medium"
                  activeProps={{ className: "nav-glass-item is-active font-bold" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-glass-divider my-3.5" />
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              onClick={() => setOpen(false)}
              to="/auth"
              search={{ mode: "signin" as const }}
              className="nav-glass-cta block rounded-xl px-3.5 py-2.5 text-center font-bold text-foreground"
            >
              تسجيل الدخول
            </Link>
            <Link
              onClick={() => setOpen(false)}
              to="/auth"
              search={{ mode: "signup" as const }}
              className="nav-glass-cta-primary block rounded-xl px-3.5 py-2.5 text-center font-bold text-primary-foreground"
            >
              أنشئ حسابك
            </Link>
            <Link
              onClick={() => setOpen(false)}
              to="/app"
              className="nav-glass-cta-aurora col-span-2 block rounded-xl px-3.5 py-2.5 text-center font-bold text-primary-foreground"
            >
              جرّب الموظفين مجانًا الآن ←
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
