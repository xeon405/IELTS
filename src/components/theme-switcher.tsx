"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";

import { cn } from "@/lib/utils";
import { readStoredTheme, persistTheme, THEMES, type ThemeId } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [theme, setTheme] = useState<ThemeId>(() => readStoredTheme());

  function select(id: ThemeId) {
    persistTheme(id);
    setTheme(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Change theme"
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition",
            variant === "dark"
              ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
              : "border-[#d8c8a8] bg-white/80 text-[#17342f] hover:bg-white",
          )}
        >
          <Palette className="h-4 w-4" />
          <span className="hidden xl:inline">Theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => select(option.id)}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <span
              aria-hidden
              className="h-8 w-8 shrink-0 rounded-xl border border-black/5 shadow-inner"
              style={{ background: option.swatch }}
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#17342f]">{option.label}</span>
              <span className="block truncate text-xs text-[#8b8f88]">{option.tagline}</span>
            </span>
            {theme === option.id ? (
              <Check className="ml-auto h-4 w-4 shrink-0 text-[#2f7151]" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}