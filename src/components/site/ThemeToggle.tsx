import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const BROWSER_THEME = "#C1663A";

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = BROWSER_THEME;
  });
  localStorage.setItem("sahl-theme", dark ? "dark" : "light");
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("sahl-theme");
    const initial = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(initial);
    setTheme(initial);
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={dark ? "استخدام الوضع الفاتح" : "استخدام الوضع الداكن"}
      title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      className="size-10 rounded-full border border-border/70 bg-card/50"
      onClick={() => {
        const next = !dark;
        setDark(next);
        setTheme(next);
      }}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}