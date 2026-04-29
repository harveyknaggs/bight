import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, niches } from "@/db/schema";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  TOP_DEMO_STAGE_COLORS,
  TOP_DEMO_STAGE_LABELS,
  isPipelineStage,
  isTopDemoStage,
  stageTintStyle,
  type PipelineStage,
  type TopDemoStage,
} from "@/lib/pipeline";
import { PipelineBoard, type BoardLead } from "./pipeline-board";

type Params = Promise<{ city: string; slug: string }>;

export default async function NichePipelinePage({
  params,
}: {
  params: Params;
}) {
  const { city: cityParam, slug: slugParam } = await params;
  const city = decodeURIComponent(cityParam);
  const slug = decodeURIComponent(slugParam);

  const [niche] = await db
    .select()
    .from(niches)
    .where(and(eq(niches.city, city), eq(niches.slug, slug)))
    .limit(1);

  if (!niche) notFound();

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      category: leads.category,
      suburb: leads.suburb,
      fullAddress: leads.fullAddress,
      phone: leads.phone,
      hasWebsite: leads.hasWebsite,
      googleRating: leads.googleRating,
      reviewCount: leads.reviewCount,
      pipelineStage: leads.pipelineStage,
    })
    .from(leads)
    .where(eq(leads.nicheId, niche.id))
    .orderBy(asc(leads.pipelineStage), desc(leads.googleRating));

  const boardLeads: BoardLead[] = rows
    .filter((r) => isPipelineStage(r.pipelineStage))
    .map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      suburb: r.suburb,
      fullAddress: r.fullAddress,
      phone: r.phone,
      hasWebsite: r.hasWebsite,
      googleRating: r.googleRating,
      reviewCount: r.reviewCount,
      pipelineStage: r.pipelineStage as PipelineStage,
    }));

  const stageCounts = new Map<PipelineStage, number>();
  for (const stage of PIPELINE_STAGES) stageCounts.set(stage, 0);
  for (const lead of boardLeads) {
    stageCounts.set(
      lead.pipelineStage,
      (stageCounts.get(lead.pipelineStage) ?? 0) + 1
    );
  }

  const total = boardLeads.length;
  const inFlight =
    (stageCounts.get("site_built") ?? 0) +
    (stageCounts.get("reviewed") ?? 0) +
    (stageCounts.get("emailed") ?? 0) +
    (stageCounts.get("replied") ?? 0);
  const won = stageCounts.get("signed_up") ?? 0;

  return (
    <div className="ld-wrap">
      <Link href="/pipeline" className="ld-back">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        all niches
      </Link>

      {/* Hero */}
      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            PIPELINE · {city.toUpperCase()}
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            <em>{slug}</em> in flight
          </h1>
          <p className="ld-subline">
            {total} {total === 1 ? "lead" : "leads"} in this niche.{" "}
            {inFlight} active in the pipeline, {won}{" "}
            {won === 1 ? "win" : "wins"}. Drag a card from one column to the
            next to move a lead along.
          </p>
          <span className="ld-sync-pill">
            <span className="ld-pip" />
            Niche<em>
              {city} · {slug}
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
            IN FLIGHT
          </div>
          <div className="ld-big">
            {inFlight}
            <span className="ld-small">/ {total}</span>
          </div>
          <div className="ld-ghost">{String(inFlight).padStart(2, "0")}</div>
          <div className="ld-bar">
            <span
              style={
                {
                  "--scale": total ? inFlight / total : 0,
                } as React.CSSProperties
              }
            />
          </div>
          <div className="ld-meta">
            {stageCounts.get("scraped") ?? 0} need a demo
            <b>
              {won} {won === 1 ? "win" : "wins"}
            </b>
          </div>
        </div>
      </div>

      {/* Top demo (niche flagship) */}
      <h2 className="ld-section-h">
        Top <em>demo</em>
        <span className="ld-meta">one shared flagship for this niche</span>
      </h2>
      <TopDemoCard
        nicheId={niche.id}
        city={city}
        slug={slug}
        topDemoUrl={niche.topDemoUrl}
        topDemoStage={
          isTopDemoStage(niche.topDemoStage)
            ? niche.topDemoStage
            : "not_started"
        }
        topDemoDesignAngle={niche.topDemoDesignAngle}
        topDemoReviewedAt={niche.topDemoReviewedAt}
      />

      {/* Stage strip */}
      <h2 className="ld-section-h">
        By <em>stage</em>
        <span className="ld-meta">{total} total in this niche</span>
      </h2>
      <div
        className="ld-strip"
        style={{
          gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`,
        }}
      >
        {PIPELINE_STAGES.map((stage) => {
          const n = stageCounts.get(stage) ?? 0;
          return (
            <div key={stage} className="ld-stat" style={stageTintStyle(stage)}>
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
                  {total
                    ? `${Math.round((n / total) * 100)}% of niche`
                    : "no leads"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      <h2 className="ld-section-h">
        Pipeline <em>board</em>
        <span className="ld-meta">drag a card to change its stage</span>
      </h2>
      <PipelineBoard initialLeads={boardLeads} />
    </div>
  );
}

function TopDemoCard({
  nicheId,
  city,
  slug,
  topDemoUrl,
  topDemoStage,
  topDemoDesignAngle,
  topDemoReviewedAt,
}: {
  nicheId: string;
  city: string;
  slug: string;
  topDemoUrl: string | null;
  topDemoStage: TopDemoStage;
  topDemoDesignAngle: string | null;
  topDemoReviewedAt: Date | null;
}) {
  const colors = TOP_DEMO_STAGE_COLORS[topDemoStage];
  const stageLabel = TOP_DEMO_STAGE_LABELS[topDemoStage];
  const reviewedLine = topDemoReviewedAt
    ? `reviewed ${new Date(topDemoReviewedAt).toLocaleDateString()}`
    : "not reviewed yet";

  return (
    <Link
      href={`/pipeline/${city}/${slug}/top-demo`}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 24,
        alignItems: "center",
        padding: "20px 24px",
        borderRadius: 14,
        background: colors.accentSoft,
        border: "1px solid var(--line)",
        textDecoration: "none",
        color: "inherit",
        marginBottom: 28,
      }}
      data-niche-id={nicheId}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colors.accent,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Niche flagship · {stageLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {topDemoUrl ? (
            <>
              Live at <em>{topDemoUrl}</em>
            </>
          ) : (
            <em>No flagship URL set</em>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {topDemoDesignAngle
            ? topDemoDesignAngle
            : "No design angle yet — review the flagship to lock one in."}
          {" · "}
          {reviewedLine}
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: colors.accent,
          whiteSpace: "nowrap",
        }}
      >
        Open review →
      </div>
    </Link>
  );
}
