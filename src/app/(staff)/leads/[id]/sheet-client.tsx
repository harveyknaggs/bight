"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SheetData = {
  title: string;
  sub: string;
  tint: string;
  accent: string;
  body: React.ReactNode;
};

export type SheetCatalog = Record<string, SheetData>;

const SheetContext = createContext<{ open: (key: string) => void }>({
  open: () => {},
});

const ActiveStatContext = createContext<{
  activeStat: string | null;
  setActiveStat: (k: string) => void;
}>({ activeStat: null, setActiveStat: () => {} });

export function LeadSheetProvider({
  catalog,
  children,
  initialActive,
}: {
  catalog: SheetCatalog;
  children: React.ReactNode;
  initialActive?: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeStat, setActiveStat] = useState<string | null>(initialActive ?? null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = openKey ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openKey]);

  const data = openKey ? catalog[openKey] : null;

  return (
    <SheetContext.Provider value={{ open: (k) => setOpenKey(k) }}>
      <ActiveStatContext.Provider value={{ activeStat, setActiveStat }}>
        {children}
      </ActiveStatContext.Provider>

      <div
        className={`ld-scrim${openKey ? " show" : ""}`}
        onClick={() => setOpenKey(null)}
        aria-hidden
      />
      <aside
        className={`ld-sheet${openKey ? " show" : ""}`}
        style={
          data
            ? ({
                "--sheet-tint": data.tint,
                "--sheet-accent": data.accent,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="ld-sheet-h">
          <div>
            <h2>{data?.title ?? ""}</h2>
            <div className="ld-sub">{data?.sub ?? ""}</div>
          </div>
          <button
            className="ld-close"
            type="button"
            onClick={() => setOpenKey(null)}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="ld-body">{data?.body}</div>
      </aside>
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  sheetKey,
  children,
  className,
  asStat,
  statKey,
}: {
  sheetKey: string;
  children: React.ReactNode;
  className?: string;
  asStat?: boolean;
  statKey?: string;
}) {
  const { open } = useContext(SheetContext);
  const { activeStat, setActiveStat } = useContext(ActiveStatContext);
  const isActive = Boolean(asStat && statKey && activeStat === statKey);

  return (
    <button
      type="button"
      className={`${className ?? ""}${isActive ? " is-active" : ""}`}
      onClick={() => {
        if (asStat && statKey) setActiveStat(statKey);
        open(sheetKey);
      }}
    >
      {children}
    </button>
  );
}
