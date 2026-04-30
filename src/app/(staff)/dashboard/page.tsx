import Link from "next/link";
import { db } from "@/db";
import { leads, websites, outreach, clients, niches } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

const STAGE_LABELS: Record<string, string> = {
  scraped: "Scraped",
  site_built: "Demo Built",
  reviewed: "Reviewed",
  emailed: "Sent",
  replied: "Replied",
  signed_up: "Won",
};

export default async function DashboardPage() {
  const [
    [totalLeadsRow],
    [sitesBuiltRow],
    [emailsSentRow],
    [payingClientsRow],
    [nichesRow],
    stageCounts,
    recentLeads,
  ] = await Promise.all([
    db.select({ n: count() }).from(leads),
    db.select({ n: count() }).from(websites).where(eq(websites.status, "built")),
    db.select({ n: count() }).from(outreach),
    db.select({ n: count() }).from(clients).where(eq(clients.plan, "paid")),
    db.select({ n: count() }).from(niches),
    db
      .select({ stage: leads.pipelineStage, n: count() })
      .from(leads)
      .groupBy(leads.pipelineStage),
    db
      .select({
        id: leads.id,
        name: leads.name,
        category: leads.category,
        suburb: leads.suburb,
        pipelineStage: leads.pipelineStage,
        createdAt: leads.createdAt,
        city: niches.city,
        nicheSlug: niches.slug,
      })
      .from(leads)
      .leftJoin(niches, eq(leads.nicheId, niches.id))
      .orderBy(desc(leads.createdAt))
      .limit(5),
  ]);

  const totalLeads = totalLeadsRow?.n ?? 0;
  const sitesBuilt = sitesBuiltRow?.n ?? 0;
  const emailsSent = emailsSentRow?.n ?? 0;
  const payingClients = payingClientsRow?.n ?? 0;
  const nichesTotal = nichesRow?.n ?? 0;
  const stageMap = Object.fromEntries(stageCounts.map((s) => [s.stage, s.n]));
  const stagesToShow = ["scraped", "site_built", "emailed", "replied", "signed_up"] as const;
  const tints = ["s-scrap", "s-build", "s-sent", "s-won", "s-lost"];

  return (
    <div className="ld-wrap">
      {/* Hero */}
      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            DASHBOARD
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            Pipeline at a <em>glance</em>
          </h1>
          <p className="ld-subline">
            {totalLeads} leads scraped across {nichesTotal}{" "}
            {nichesTotal === 1 ? "niche" : "niches"}. {sitesBuilt} demo{" "}
            {sitesBuilt === 1 ? "site" : "sites"} built, {emailsSent} cold{" "}
            {emailsSent === 1 ? "email" : "emails"} sent, {payingClients} paying{" "}
            {payingClients === 1 ? "client" : "clients"}.
          </p>
          <span className="ld-sync-pill">
            <span className="ld-pip" />
            Live<em>updated just now</em>
          </span>
        </div>

        <div className="ld-kpi">
          <div className="ld-label">
            <span className="ld-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </span>
            ACTIVE LEADS
          </div>
          <div className="ld-big">
            {totalLeads}
            <span className="ld-small">/ {totalLeads}</span>
          </div>
          <div className="ld-ghost">{String(totalLeads).padStart(2, "0")}</div>
          <div className="ld-bar">
            <span style={{ "--scale": 1 } as React.CSSProperties} />
          </div>
          <div className="ld-meta">
            {payingClients} paying<b>{nichesTotal} {nichesTotal === 1 ? "niche" : "niches"}</b>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="ld-section-h">
        Quick <em>actions</em>
        <span className="ld-meta">3 things to do next</span>
      </h2>
      <div className="ld-pair" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Link href="/leads" className="ld-big-card t-demo" style={{ textDecoration: "none" }}>
          <div className="ld-head">
            <span className="ld-idx">01</span>
            <span className="ld-badge">
              <span className="ld-pip" />
              {totalLeads} leads
            </span>
          </div>
          <div className="ld-well">
            <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
              <rect className="ld-liftA" x="14" y="20" width="92" height="68" rx="10" fill="#fff" stroke="#c8e3d2" strokeWidth="1.5" />
              <rect className="ld-liftA" x="14" y="20" width="92" height="14" rx="10" fill="#e9f4ed" />
              <line x1="22" y1="48" x2="98" y2="48" stroke="#c8e3d2" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="22" y1="58" x2="84" y2="58" stroke="#c8e3d2" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
              <line x1="22" y1="68" x2="92" y2="68" stroke="#c8e3d2" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
              <rect className="ld-liftC" x="58" y="38" width="98" height="74" rx="12" fill="#1f6f4a" stroke="#14523a" strokeWidth="1.5" />
              <rect className="ld-liftC" x="58" y="38" width="98" height="14" rx="12" fill="#14523a" />
              <line x1="68" y1="62" x2="146" y2="62" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="68" y1="74" x2="138" y2="74" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
              <line x1="68" y1="86" x2="122" y2="86" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
            </svg>
          </div>
          <h3>Browse all leads</h3>
          <p className="ld-desc">
            Open the lead ledger. Filter by niche, drill into any business to see scraped
            data, draft emails, and demo status.
          </p>
          <div className="ld-foot">
            <span className="ld-ct">{stageMap.scraped ?? 0} need a demo</span>
            <span className="ld-cta">
              Open leads{" "}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>

        <Link href="/pricing" className="ld-big-card t-pipe" style={{ textDecoration: "none" }}>
          <div className="ld-head">
            <span className="ld-idx">02</span>
            <span className="ld-badge">
              <span className="ld-pip" />
              draft
            </span>
          </div>
          <div className="ld-well">
            <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
              {/* Back tag (lighter) */}
              <g className="ld-liftA">
                <path d="M28 32 L 70 32 L 88 50 L 88 108 L 28 108 Z" fill="#fff" stroke="#c8e3d2" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="74" cy="42" r="4" fill="#fff" stroke="#c8e3d2" strokeWidth="1.5" />
                <text x="50" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1f6f4a" fontFamily="system-ui, sans-serif">$</text>
              </g>
              {/* Front tag (dark, primary) */}
              <g className="ld-liftC">
                <path d="M70 18 L 124 18 L 148 42 L 148 110 L 70 110 Z" fill="#1f6f4a" stroke="#14523a" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="128" cy="30" r="5" fill="#14523a" stroke="#14523a" strokeWidth="1.5" />
                <text x="106" y="74" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">$1,995</text>
                <text x="106" y="94" textAnchor="middle" fontSize="11" fontWeight="600" fill="#d4f0e2" fontFamily="system-ui, sans-serif">+$49/mo</text>
              </g>
            </svg>
          </div>
          <h3>Pricing plan</h3>
          <p className="ld-desc">
            Setup fee plus monthly hosting tiers, what each fee includes, the
            cold outreach pitch, and Year 1 maths.
          </p>
          <div className="ld-foot">
            <span className="ld-ct">$1,995 + $49/mo default</span>
            <span className="ld-cta">
              View plan{" "}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>

        <Link href="/import" className="ld-big-card t-review" style={{ textDecoration: "none" }}>
          <div className="ld-head">
            <span className="ld-idx">03</span>
            <span className="ld-badge">
              <span className="ld-pip" />
              run anytime
            </span>
          </div>
          <div className="ld-well">
            <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
              <rect className="ld-liftA" x="20" y="22" width="58" height="72" rx="8" fill="#fff" stroke="#e0d2f5" strokeWidth="1.5" />
              <line x1="28" y1="38" x2="68" y2="38" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="28" y1="50" x2="62" y2="50" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="28" y1="62" x2="66" y2="62" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
              <path className="ld-liftB" d="M84 60 l28 0 m-12 -10 l12 10 -12 10" stroke="#6d28d9" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect className="ld-liftC" x="116" y="22" width="36" height="72" rx="8" fill="#6d28d9" stroke="#4c1d95" strokeWidth="1.5" />
              <line x1="124" y1="38" x2="144" y2="38" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="124" y1="50" x2="142" y2="50" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
              <line x1="124" y1="62" x2="146" y2="62" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
            </svg>
          </div>
          <h3>Sync new leads</h3>
          <p className="ld-desc">
            Pull the latest scraper output into the database. Idempotent on
            google_place_id, safe to run any time.
          </p>
          <div className="ld-foot">
            <span className="ld-ct">npm run sync</span>
            <span className="ld-cta">
              Open import{" "}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
      </div>

      {/* Stage strip */}
      <h2 className="ld-section-h">
        Pipeline <em>stages</em>
        <span className="ld-meta">click to drill in</span>
      </h2>
      <div className="ld-strip">
        {stagesToShow.map((stage, i) => {
          const n = stageMap[stage] ?? 0;
          return (
            <Link
              key={stage}
              href="/leads"
              className={`ld-stat ${tints[i]}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
              </div>
              <div className="ld-label">{STAGE_LABELS[stage]}</div>
              <div className="ld-figure">{n}</div>
              <div className="ld-meta-row">
                <span>
                  {totalLeads
                    ? `${Math.round((n / totalLeads) * 100)}% of pipeline`
                    : "no leads yet"}
                </span>
                <span className="ld-v">
                  Open
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <h2 className="ld-section-h">
        Recent <em>leads</em>
        <span className="ld-meta">last 5 synced</span>
      </h2>
      <div className="ld-ledger">
        {recentLeads.length === 0 ? (
          <div className="ld-ledger-foot" style={{ padding: "40px 0" }}>
            No leads yet. Run <code>npm run sync</code> to import from the scraper folder.
          </div>
        ) : (
          recentLeads.map((r) => (
            <Link
              key={r.id}
              href={`/leads/${r.id}`}
              className="ld-row-item"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="ld-left">
                <div className="ld-name">
                  {r.name}{" "}
                  <span
                    className="ld-pill"
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
                </div>
                <div className="ld-sub">
                  {[
                    r.city && r.nicheSlug ? `${r.city}/${r.nicheSlug}` : null,
                    r.suburb,
                    r.category,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="ld-right">
                <div className="ld-v">{new Date(r.createdAt).toLocaleDateString()}</div>
                <div className="ld-d">
                  {new Date(r.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <span className="ld-ext" aria-label="Open">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </Link>
          ))
        )}
        <div className="ld-ledger-foot">
          showing {recentLeads.length} of {totalLeads} · open the leads page for full list
        </div>
      </div>
    </div>
  );
}
