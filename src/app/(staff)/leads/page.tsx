import Link from "next/link";
import { db } from "@/db";
import { leads, niches } from "@/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";

const STAGE_LABELS: Record<string, string> = {
  scraped: "Scraped",
  site_built: "Demo Built",
  reviewed: "Reviewed",
  emailed: "Email Sent",
  replied: "Replied",
  signed_up: "Won",
};

export default async function LeadsPage() {
  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      category: leads.category,
      suburb: leads.suburb,
      fullAddress: leads.fullAddress,
      phone: leads.phone,
      email: leads.email,
      hasWebsite: leads.hasWebsite,
      googleRating: leads.googleRating,
      reviewCount: leads.reviewCount,
      pipelineStage: leads.pipelineStage,
      city: niches.city,
      nicheSlug: niches.slug,
    })
    .from(leads)
    .leftJoin(niches, eq(leads.nicheId, niches.id))
    .orderBy(desc(leads.createdAt));

  const stageCounts = await db
    .select({ stage: leads.pipelineStage, n: count() })
    .from(leads)
    .groupBy(leads.pipelineStage);

  const stageMap = Object.fromEntries(stageCounts.map((s) => [s.stage, s.n]));
  const stagesToShow = ["scraped", "site_built", "emailed", "replied", "signed_up"] as const;

  const withWebsite = await db
    .select({ n: count() })
    .from(leads)
    .where(eq(leads.hasWebsite, true));
  const totalRating = await db
    .select({ avg: sql<string>`avg(${leads.googleRating})::text` })
    .from(leads);
  const avgRating = parseFloat(totalRating[0]?.avg ?? "0");

  // Group leads by niche for the "By niche" section
  const byNiche = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.city && r.nicheSlug ? `${r.city}/${r.nicheSlug}` : "uncategorised";
    if (!byNiche.has(key)) byNiche.set(key, []);
    byNiche.get(key)!.push(r);
  }

  return (
    <div className="ld-wrap">
      {/* Hero */}
      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            ALL LEADS
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            Every business <em>in flight</em>
          </h1>
          <p className="ld-subline">
            {rows.length} {rows.length === 1 ? "lead" : "leads"} synced from the scraper
            across {byNiche.size} {byNiche.size === 1 ? "niche" : "niches"}. Click any row
            to open the full lead detail.
          </p>
          <span className="ld-sync-pill">
            <span className="ld-pip" />
            Last sync<em>{rows[0] ? "just now" : "never"}</em>
          </span>
        </div>

        <div className="ld-kpi">
          <div className="ld-label">
            <span className="ld-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-6" />
              </svg>
            </span>
            TOTAL LEADS
          </div>
          <div className="ld-big">
            {rows.length}
            <span className="ld-small">/ {rows.length}</span>
          </div>
          <div className="ld-ghost">{String(rows.length).padStart(2, "0")}</div>
          <div className="ld-bar">
            <span style={{ "--scale": 1 } as React.CSSProperties} />
          </div>
          <div className="ld-meta">
            {withWebsite[0]?.n ?? 0} have a current site
            <b>avg {avgRating ? avgRating.toFixed(1) : "—"} ★</b>
          </div>
        </div>
      </div>

      {/* Pipeline stage strip */}
      <h2 className="ld-section-h">
        By <em>stage</em>
        <span className="ld-meta">{rows.length} total</span>
      </h2>
      <div className="ld-strip">
        {stagesToShow.map((stage, i) => {
          const tints = ["s-scrap", "s-build", "s-sent", "s-won", "s-lost"];
          const n = stageMap[stage] ?? 0;
          return (
            <div key={stage} className={`ld-stat ${tints[i]}`}>
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5v14" />
                  </svg>
                </span>
              </div>
              <div className="ld-label">{STAGE_LABELS[stage] ?? stage}</div>
              <div className="ld-figure">{n}</div>
              <div className="ld-meta-row">
                <span>{n === 0 ? "none yet" : n === 1 ? "lead" : "leads"}</span>
                <span className="ld-v">
                  Filter
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* All leads ledger */}
      <h2 className="ld-section-h">
        Lead <em>ledger</em>
        <span className="ld-meta">grouped by niche</span>
      </h2>
      <div className="ld-ledger">
        <div className="ld-toolbar">
          <input className="ld-search" placeholder="Search by business name, suburb, phone..." />
          <span className="ld-pulled">
            <span className="ld-pip" />
            v1 · synced from scraper
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="ld-ledger-foot" style={{ padding: "40px 0" }}>
            No leads yet. Run <code>npm run sync</code> to import from the scraper folder.
          </div>
        ) : (
          [...byNiche.entries()].map(([nicheKey, nicheRows]) => (
            <div key={nicheKey}>
              <div className="ld-grp">
                <span className="ld-left">
                  <span className="ld-toggle">−</span>
                  {nicheKey}
                </span>
                <span className="ld-right">
                  {nicheRows.length} {nicheRows.length === 1 ? "lead" : "leads"}
                </span>
              </div>
              {nicheRows.map((r) => (
                <Link
                  key={r.id}
                  href={`/leads/${r.id}`}
                  className="ld-row-item"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="ld-left">
                    <div className="ld-name">
                      {r.name}
                      <span
                        className={`ld-pill ${
                          r.pipelineStage === "scraped"
                            ? ""
                            : r.pipelineStage === "signed_up"
                            ? ""
                            : "warn"
                        }`}
                        style={{
                          background:
                            r.pipelineStage === "signed_up"
                              ? "var(--brand-soft)"
                              : r.pipelineStage === "scraped"
                              ? "var(--c-purple-soft)"
                              : "var(--c-blue-soft)",
                          color:
                            r.pipelineStage === "signed_up"
                              ? "var(--brand-dark)"
                              : r.pipelineStage === "scraped"
                              ? "var(--c-purple)"
                              : "var(--c-blue)",
                        }}
                      >
                        {STAGE_LABELS[r.pipelineStage] ?? r.pipelineStage}
                      </span>
                      {!r.hasWebsite && (
                        <span className="ld-pill empty">no site</span>
                      )}
                    </div>
                    <div className="ld-sub">
                      {[r.category, r.suburb ?? r.fullAddress?.split(",").slice(-2, -1)[0]?.trim(), r.phone]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="ld-right">
                    <div className="ld-v">
                      {r.googleRating ? `${r.googleRating} ★` : "—"}
                    </div>
                    <div className="ld-d">
                      {r.reviewCount ? `${r.reviewCount} reviews` : "no reviews"}
                    </div>
                  </div>
                  <span className="ld-ext" aria-label="Open">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          ))
        )}

        <div className="ld-ledger-foot">
          {rows.length} {rows.length === 1 ? "lead" : "leads"} shown · ledger v1
        </div>
      </div>
    </div>
  );
}
