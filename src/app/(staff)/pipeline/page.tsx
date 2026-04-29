import Link from "next/link";
import { count, asc } from "drizzle-orm";
import { db } from "@/db";
import { leads, niches } from "@/db/schema";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  stageTintStyle,
  type PipelineStage,
} from "@/lib/pipeline";
import { NicheIcon } from "./niche-icons";

const NICHE_STATUS_LABEL: Record<string, string> = {
  queue: "queued",
  in_progress: "scraping",
  done: "done",
};

type NicheTotals = {
  id: string;
  city: string;
  slug: string;
  status: string;
  total: number;
  stageCounts: Record<PipelineStage, number>;
};

function emptyStageCounts(): Record<PipelineStage, number> {
  return {
    scraped: 0,
    site_built: 0,
    reviewed: 0,
    emailed: 0,
    replied: 0,
    signed_up: 0,
  };
}

export default async function PipelineLandingPage() {
  const [allNiches, perNicheStageRows, [totalLeadsRow]] = await Promise.all([
    db.select().from(niches).orderBy(asc(niches.city), asc(niches.slug)),
    db
      .select({
        nicheId: leads.nicheId,
        stage: leads.pipelineStage,
        n: count(),
      })
      .from(leads)
      .groupBy(leads.nicheId, leads.pipelineStage),
    db.select({ n: count() }).from(leads),
  ]);

  const nicheMap = new Map<string, NicheTotals>();
  for (const n of allNiches) {
    nicheMap.set(n.id, {
      id: n.id,
      city: n.city,
      slug: n.slug,
      status: n.status,
      total: 0,
      stageCounts: emptyStageCounts(),
    });
  }
  for (const row of perNicheStageRows) {
    if (!row.nicheId) continue;
    const entry = nicheMap.get(row.nicheId);
    if (!entry) continue;
    if ((PIPELINE_STAGES as readonly string[]).includes(row.stage)) {
      entry.stageCounts[row.stage as PipelineStage] = row.n;
    }
    entry.total += row.n;
  }
  const nicheList = [...nicheMap.values()];
  const totalLeads = totalLeadsRow?.n ?? 0;
  const inFlight = nicheList.reduce(
    (acc, n) =>
      acc +
      n.stageCounts.site_built +
      n.stageCounts.reviewed +
      n.stageCounts.emailed +
      n.stageCounts.replied,
    0
  );

  return (
    <div className="ld-wrap">
      {/* Hero */}
      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            PIPELINE
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            Pick a <em>niche</em> to work
          </h1>
          <p className="ld-subline">
            {nicheList.length}{" "}
            {nicheList.length === 1 ? "niche" : "niches"} loaded from the
            scraper. Click a niche to see its leads laid out across the six
            pipeline stages, and move them along as you go.
          </p>
          <span className="ld-sync-pill">
            <span className="ld-pip" />
            In flight<em>
              {inFlight} {inFlight === 1 ? "lead" : "leads"} active
            </em>
          </span>
        </div>

        <div className="ld-kpi">
          <div className="ld-label">
            <span className="ld-ic">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
            </span>
            ACTIVE PIPELINE
          </div>
          <div className="ld-big">
            {inFlight}
            <span className="ld-small">/ {totalLeads}</span>
          </div>
          <div className="ld-ghost">
            {String(inFlight).padStart(2, "0")}
          </div>
          <div className="ld-bar">
            <span
              style={
                {
                  "--scale": totalLeads ? inFlight / totalLeads : 0,
                } as React.CSSProperties
              }
            />
          </div>
          <div className="ld-meta">
            past scraped, before won
            <b>
              {nicheList.length}{" "}
              {nicheList.length === 1 ? "niche" : "niches"}
            </b>
          </div>
        </div>
      </div>

      {/* Niche grid */}
      <h2 className="ld-section-h">
        Niches <em>in flight</em>
        <span className="ld-meta">click any niche to open its pipeline</span>
      </h2>

      {nicheList.length === 0 ? (
        <div
          className="ld-ledger-foot"
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "40px 0",
          }}
        >
          No niches yet. Run <code>npm run sync</code> to import from the
          scraper folder.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 18,
            marginBottom: 8,
          }}
        >
          {nicheList.map((n, i) => {
            const href = `/pipeline/${encodeURIComponent(
              n.city
            )}/${encodeURIComponent(n.slug)}`;
            return (
              <Link
                key={n.id}
                href={href}
                className="ld-big-card t-pipe"
                style={{ textDecoration: "none" }}
              >
                <div className="ld-head">
                  <span className="ld-idx">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ld-badge">
                    <span className="ld-pip" />
                    {NICHE_STATUS_LABEL[n.status] ?? n.status}
                  </span>
                </div>
                <div className="ld-well" style={{ height: 130 }}>
                  <NicheIcon slug={n.slug} />
                </div>
                <h3>
                  {n.city} · {n.slug}
                </h3>
                <p className="ld-desc">
                  {n.total} {n.total === 1 ? "lead" : "leads"} total ·{" "}
                  {n.stageCounts.site_built} demo built ·{" "}
                  {n.stageCounts.emailed} emailed ·{" "}
                  {n.stageCounts.signed_up} won
                </p>
                <div className="ld-foot">
                  <span className="ld-ct">
                    {n.stageCounts.scraped} waiting on a demo
                  </span>
                  <span className="ld-cta">
                    Open pipeline{" "}
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pipeline-wide stage strip */}
      <h2 className="ld-section-h">
        Across <em>all niches</em>
        <span className="ld-meta">{totalLeads} total leads</span>
      </h2>
      <div
        className="ld-strip"
        style={{ gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)` }}
      >
        {PIPELINE_STAGES.map((stage) => {
          const n = nicheList.reduce(
            (acc, ni) => acc + ni.stageCounts[stage],
            0
          );
          const tintStyle = stageTintStyle(stage);
          return (
            <div key={stage} className="ld-stat" style={tintStyle}>
              <div className="ld-row">
                <span className="ld-ic">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

