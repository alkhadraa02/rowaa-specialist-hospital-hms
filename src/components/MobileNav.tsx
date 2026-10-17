"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type NavItem = { href: string; label: string };

export function MobileNav({ items, openLabel, closeLabel, menuTitle }: { items: NavItem[]; openLabel: string; closeLabel: string; menuTitle: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm lg:hidden"
        aria-label={openLabel}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-ink/50" style={{ zIndex: "var(--z-overlay)" }} onClick={() => setOpen(false)} aria-hidden="true" />
          <nav
            id="mobile-drawer"
            aria-label={menuTitle}
            className="fixed inset-y-0 end-0 flex w-[min(86vw,340px)] flex-col gap-1 overflow-y-auto bg-surface p-4 shadow-xl"
            style={{ zIndex: "var(--z-drawer)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <strong>{menuTitle}</strong>
              <button type="button" className="btn btn-ghost btn-sm" aria-label={closeLabel} onClick={() => setOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {items.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-surface-2">
                {i.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
