"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Theme = "light" | "dark";

function getDomain(input: string) {
  try {
    const u = new URL(input);
    return u.hostname;
  } catch {
    return input;
  }
}

function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    const t = (document.documentElement.dataset.theme as Theme) || "light";
    return t === "dark" ? "dark" : "light";
  });
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      const t = (el.dataset.theme as Theme) || "light";
      setTheme(t === "dark" ? "dark" : "light");
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function SiteCard({
  name,
  url,
  logoUrl,
  lightLogoUrl,
  darkLogoUrl,
  className,
}: {
  name: string;
  url: string;
  logoUrl?: string | null;
  lightLogoUrl?: string | null;
  darkLogoUrl?: string | null;
  className?: string;
}) {
  const domain = getDomain(url);
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const theme = useTheme();

  const themedLogo = useMemo(() => {
    if (theme === "dark")
      return (
        (darkLogoUrl && darkLogoUrl.trim()) ||
        (lightLogoUrl && lightLogoUrl.trim()) ||
        (logoUrl && logoUrl.trim()) ||
        ""
      );
    return (
      (lightLogoUrl && lightLogoUrl.trim()) ||
      (darkLogoUrl && darkLogoUrl.trim()) ||
      (logoUrl && logoUrl.trim()) ||
      ""
    );
  }, [theme, lightLogoUrl, darkLogoUrl, logoUrl]);

  const [src, setSrc] = useState<string>(themedLogo || fallbackFavicon);

  useEffect(() => {
    setSrc(themedLogo || fallbackFavicon);
  }, [themedLogo, fallbackFavicon]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      aria-label={`Open ${name}`}
    >
      <Image
        src={src || "/placeholder-logo.svg"}
        alt={`${name} logo`}
        width={128}
        height={128}
        unoptimized
        className="h-8 w-15 shrink-0 object-contain"
        onError={() => {
          if (src !== fallbackFavicon) setSrc(fallbackFavicon);
        }}
      />
      <span className="text-sm font-medium truncate">{name}</span>
      {/* <span className="ml-auto text-xs text-muted-foreground group-hover:text-foreground truncate">
        {domain}
      </span> */}
    </a>
  );
}
