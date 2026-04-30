import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { niches } from "@/db/schema";
import {
  TOP_DEMO_STAGES,
  TOP_DEMO_STAGE_COLORS,
  TOP_DEMO_STAGE_LABELS,
  isTopDemoStage,
  type TopDemoStage,
} from "@/lib/pipeline";
import { requireStaff } from "@/lib/auth";
import { updateTopDemoFromForm } from "@/app/actions/update-top-demo";

type Params = Promise<{ city: string; slug: string }>;

export default async function TopDemoReviewPage({
  params,
}: {
  params: Params;
}) {
  await requireStaff();

  const { city: cityParam, slug: slugParam } = await params;
  const city = decodeURIComponent(cityParam);
  const slug = decodeURIComponent(slugParam);

  const [niche] = await db
    .select()
    .from(niches)
    .where(and(eq(niches.city, city), eq(niches.slug, slug)))
    .limit(1);

  if (!niche) notFound();

  const stage: TopDemoStage = isTopDemoStage(niche.topDemoStage)
    ? niche.topDemoStage
    : "not_started";
  const colors = TOP_DEMO_STAGE_COLORS[stage];

  return (
    <div className="ld-wrap">
      <Link href={`/pipeline/${city}/${slug}`} className="ld-back">
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
        back to {slug} pipeline
      </Link>

      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            TOP DEMO · {city.toUpperCase()}
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            <em>{slug}</em> flagship
          </h1>
          <p className="ld-subline">
            One shared site sent to every lead in this niche. Lock in the URL,
            angle, and review notes here. Currently:{" "}
            <b style={{ color: colors.accent }}>
              {TOP_DEMO_STAGE_LABELS[stage]}
            </b>
            .
          </p>
        </div>
      </div>

      <h2 className="ld-section-h">
        Flagship <em>review</em>
        <span className="ld-meta">edit and save</span>
      </h2>

      <form
        action={updateTopDemoFromForm}
        style={{
          display: "grid",
          gap: 18,
          padding: "24px 28px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 14,
          marginBottom: 28,
        }}
      >
        <input type="hidden" name="nicheId" value={niche.id} />

        <Field label="Stage">
          <select
            name="topDemoStage"
            defaultValue={stage}
            style={inputStyle}
          >
            {TOP_DEMO_STAGES.map((s) => (
              <option key={s} value={s}>
                {TOP_DEMO_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Demo URL"
          hint="The single URL every cold email links to. Absolute or relative (e.g. /my-site/afg/index.html)."
        >
          <input
            type="text"
            name="topDemoUrl"
            defaultValue={niche.topDemoUrl ?? ""}
            placeholder="/my-site/afg/index.html"
            style={inputStyle}
          />
        </Field>

        <Field
          label="Design angle"
          hint="The concept or hook for this niche flagship."
        >
          <input
            type="text"
            name="topDemoDesignAngle"
            defaultValue={niche.topDemoDesignAngle ?? ""}
            placeholder="AFG-style scrolling hero, video-led, dark mode"
            style={inputStyle}
          />
        </Field>

        <Field
          label="Review notes"
          hint="What still needs fixing before this goes out in cold emails."
        >
          <textarea
            name="topDemoReviewNotes"
            defaultValue={niche.topDemoReviewNotes ?? ""}
            rows={6}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Link
            href={`/pipeline/${city}/${slug}`}
            style={{
              height: 40,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "#fff",
              color: "inherit",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            style={{
              height: 40,
              padding: "0 22px",
              borderRadius: 10,
              border: "1px solid var(--brand)",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 500,
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "#fff",
  font: "inherit",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      {hint ? (
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{hint}</span>
      ) : null}
      {children}
    </label>
  );
}
