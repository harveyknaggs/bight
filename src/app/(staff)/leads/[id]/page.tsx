import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { leads, niches, reviews, websites, clients, notes } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { LeadSheetProvider, SheetTrigger, type SheetCatalog } from "./sheet-client";

type Params = Promise<{ id: string }>;

const STAGE_INFO: Record<
  string,
  { stepNum: string; label: string }
> = {
  scraped: { stepNum: "01", label: "Scraped" },
  site_built: { stepNum: "02", label: "Demo Build" },
  reviewed: { stepNum: "03", label: "Reviewed" },
  emailed: { stepNum: "04", label: "Email Sent" },
  replied: { stepNum: "05", label: "Replied" },
  signed_up: { stepNum: "06", label: "Won" },
};

const TRACKED_FIELDS: Array<keyof typeof leads.$inferSelect> = [
  "name",
  "category",
  "phone",
  "email",
  "website",
  "fullAddress",
  "googleRating",
  "reviewCount",
  "workingHours",
  "googlePlaceUrl",
  "googlePhotos",
];

function scrapeQuality(lead: typeof leads.$inferSelect) {
  const filled = TRACKED_FIELDS.filter((k) => {
    const v = lead[k];
    if (v == null) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    return true;
  }).length;
  return { filled, total: TRACKED_FIELDS.length, pct: filled / TRACKED_FIELDS.length };
}

function formatMonthDay(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function todaysDayName() {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ];
}

function parseWorkingHours(text: string | null) {
  if (!text) return [] as Array<{ day: string; hours: string; today: boolean }>;
  const today = todaysDayName();
  return text
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(/^([A-Za-z]+)(?:\([^)]+\))?\s*:\s*(.+?)\s*$/);
      if (!m) return null;
      const day = m[1].trim();
      return {
        day,
        hours: m[2].replace(/\s*Hours might differ\s*/i, "").trim(),
        today: day.toLowerCase() === today,
      };
    })
    .filter((x): x is { day: string; hours: string; today: boolean } => Boolean(x));
}

function buildSubline(lead: typeof leads.$inferSelect, city: string | null) {
  const parts: string[] = [];
  if (city) parts.push(`${city.charAt(0).toUpperCase() + city.slice(1)} ${lead.category ?? "business"}`);
  else parts.push(lead.category ?? "Local business");
  if (!lead.hasWebsite) parts.push("with no website");
  let s = parts.join(" ");
  if (lead.reviewCount && lead.googleRating) {
    s += `. ${lead.reviewCount} reviews averaging ${lead.googleRating} ★ on Google`;
  }
  s += ` — strong candidate for an auto-built demo and cold pitch today.`;
  return s;
}

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const [lead] = await db
    .select({ lead: leads, city: niches.city, nicheSlug: niches.slug })
    .from(leads)
    .leftJoin(niches, eq(leads.nicheId, niches.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!lead) notFound();

  const [review] = await db.select().from(reviews).where(eq(reviews.leadId, id)).limit(1);
  const [website] = await db.select().from(websites).where(eq(websites.leadId, id)).limit(1);
  const [client] = await db.select().from(clients).where(eq(clients.leadId, id)).limit(1);
  const [notesCountRow] = await db
    .select({ n: count() })
    .from(notes)
    .where(eq(notes.leadId, id));
  const recentNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.leadId, id))
    .orderBy(desc(notes.createdAt))
    .limit(3);

  const l = lead.lead;
  const stage = STAGE_INFO[l.pipelineStage] ?? STAGE_INFO.scraped;
  const quality = scrapeQuality(l);
  const photos = (l.googlePhotos ?? []) as string[];
  const subline = buildSubline(l, lead.city);
  const hours = parseWorkingHours(l.workingHours as string | null);
  const notesCount = notesCountRow?.n ?? 0;

  // ----- Sheet contents -----
  const catalog: SheetCatalog = {
    contact: {
      title: "Contact & location",
      sub: "Auto-extracted",
      tint: "#eef3fb",
      accent: "#2563eb",
      body: (
        <dl className="ld-kv">
          <dt>Phone</dt>
          <dd className="num">{l.phone ?? <span className="ld-empty">— not listed</span>}</dd>
          <dt>Email</dt>
          <dd>
            {l.email ? (
              l.email
            ) : (
              <>
                <span className="ld-empty">— not listed</span>
                <span className="ld-needs">missing</span>
              </>
            )}
          </dd>
          <dt>Website</dt>
          <dd>
            {l.website ? (
              <a href={l.website} target="_blank" rel="noreferrer">
                {l.website}
              </a>
            ) : (
              <span className="ld-empty">— no website</span>
            )}
          </dd>
          <dt>Address</dt>
          <dd>{l.fullAddress ?? <span className="ld-empty">—</span>}</dd>
          <dt>Suburb</dt>
          <dd>{l.suburb ?? <span className="ld-empty">—</span>}</dd>
          <dt>Postcode</dt>
          <dd className="num">{l.postalCode ?? <span className="ld-empty">—</span>}</dd>
        </dl>
      ),
    },
    google: {
      title: "Google profile",
      sub: `Synced ${new Date(l.updatedAt).toLocaleDateString()}`,
      tint: "#fdf4e6",
      accent: "#d97706",
      body: (
        <>
          <dl className="ld-kv">
            <dt>Rating</dt>
            <dd>
              {l.googleRating ? (
                <>
                  <span className="ld-stars">★★★★★</span>{" "}
                  <b className="num">{l.googleRating}</b>{" "}
                  <span style={{ color: "var(--muted)" }}>· {l.reviewCount ?? 0} reviews</span>
                </>
              ) : (
                <span className="ld-empty">—</span>
              )}
            </dd>
            <dt>Maps</dt>
            <dd>
              {l.googlePlaceUrl ? (
                <a href={l.googlePlaceUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps ↗
                </a>
              ) : (
                <span className="ld-empty">—</span>
              )}
            </dd>
            {hours.length > 0 ? (
              <>
                <dt>Working hours</dt>
                <dd>
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "110px 1fr",
                      gap: "6px 14px",
                      fontSize: "12.5px",
                      marginTop: 4,
                    }}
                  >
                    {hours.map((h) => (
                      <span
                        key={h.day}
                        style={{ display: "contents", color: h.today ? "var(--brand-dark)" : undefined }}
                      >
                        <dt
                          style={{
                            color: h.today ? "var(--brand-dark)" : "var(--ink-2)",
                            fontWeight: h.today ? 500 : 500,
                          }}
                        >
                          {h.day}
                        </dt>
                        <dd
                          style={{
                            color: h.today ? "var(--brand-dark)" : "var(--muted)",
                            fontWeight: h.today ? 500 : 400,
                            margin: 0,
                          }}
                        >
                          {h.hours}
                          {h.today ? " · open today" : ""}
                        </dd>
                      </span>
                    ))}
                  </dl>
                </dd>
              </>
            ) : null}
          </dl>
          {photos.length > 0 ? (
            <>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  color: "var(--muted)",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                Google photos
              </div>
              <div className="ld-photos">
                {photos.slice(0, 6).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="ld-ph"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" />
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </>
      ),
    },
    review: {
      title: "Cold email draft",
      sub: review?.coldEmailDraft ? "From review.md" : "Not drafted yet",
      tint: "#f3eefb",
      accent: "#6d28d9",
      body: (
        <>
          {review?.bookingFallback ? (
            <div className="ld-note-block">{review.bookingFallback}</div>
          ) : null}
          {review?.coldEmailDraft ? (
            <pre className="ld-draft">{review.coldEmailDraft}</pre>
          ) : (
            <div className="ld-draft">
              No draft yet. Add a <code>review.md</code> with a <code>## Cold email
              draft</code> section in the lead&apos;s scraper folder, then run{" "}
              <code>npm run sync</code>.
            </div>
          )}
        </>
      ),
    },
    demo: {
      title: "Build demo site",
      sub: website ? `Status: ${website.status}` : "~ 90 seconds",
      tint: "#e9f4ed",
      accent: "#14523a",
      body: (
        <>
          <div
            style={{
              aspectRatio: "16 / 10",
              borderRadius: 12,
              background: "linear-gradient(135deg, #1a0f0a, #44291f)",
              display: "grid",
              placeItems: "center",
              color: "#d4d2c5",
              fontFamily: "var(--font-fraunces), serif",
              fontStyle: "italic",
              marginBottom: 14,
            }}
          >
            {website?.demoUrl ? (
              <a
                href={website.demoUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#d4d2c5" }}
              >
                Open {website.demoUrl}
              </a>
            ) : (
              "No demo built yet"
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "#fff",
                font: "inherit",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Configure
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--brand)",
                background: "var(--brand)",
                color: "#fff",
                font: "inherit",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Build now
            </button>
          </div>
        </>
      ),
    },
    client: {
      title: "Client account",
      sub: client ? "Linked" : "Not linked yet",
      tint: "#fbeaef",
      accent: "#be123c",
      body: client ? (
        <dl className="ld-kv">
          <dt>Name</dt>
          <dd>
            <b>{client.contactName ?? "—"}</b>
          </dd>
          <dt>Email</dt>
          <dd>{client.contactEmail}</dd>
          <dt>Plan</dt>
          <dd>{client.plan}</dd>
          <dt>Signed up</dt>
          <dd className="num">
            {client.signedUpAt ? new Date(client.signedUpAt).toLocaleDateString() : "—"}
          </dd>
        </dl>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "32px 8px 20px",
            color: "var(--muted-2)",
            fontSize: 14,
            fontFamily: "var(--font-fraunces), serif",
            fontStyle: "italic",
          }}
        >
          No client account linked.
        </div>
      ),
    },
    notes: {
      title: "Notes",
      sub: notesCount > 0 ? `${notesCount} note${notesCount === 1 ? "" : "s"}` : "No notes yet",
      tint: "#f4f1ea",
      accent: "#6b5a2a",
      body:
        recentNotes.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {recentNotes.map((n) => (
              <li
                key={n.id}
                style={{
                  background: "#fffaf0",
                  border: "1px dashed #f4dca8",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#6b4513",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {n.authorRole === "client" ? "Client" : "Staff"} ·{" "}
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                {n.body}
              </li>
            ))}
          </ul>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "32px 8px 20px",
              color: "var(--muted-2)",
              fontSize: 14,
              fontFamily: "var(--font-fraunces), serif",
              fontStyle: "italic",
            }}
          >
            No notes yet — jot a thought after the call.
          </div>
        ),
    },
  };

  return (
    <>
      <LeadSheetProvider catalog={catalog} initialActive="scraped">
        <div className="ld-wrap">
          <Link className="ld-back" href="/leads">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Leads
          </Link>

          {/* Hero */}
          <div className="ld-hero">
            <div>
              <div className="ld-stage-line">
                <span className="ld-dash" />
                STAGE {stage.stepNum} / {stage.label.toUpperCase()}
                <span className="ld-dash" />
              </div>
              <h1 className="ld-biz">
                {(() => {
                  const words = (l.name ?? "").split(/\s+/);
                  if (words.length === 1) return <em>{words[0]}</em>;
                  return (
                    <>
                      {words.slice(0, -1).join(" ")} <em>{words[words.length - 1]}</em>
                    </>
                  );
                })()}
              </h1>
              <p className="ld-subline">{subline}</p>
              <span className="ld-sync-pill">
                <span className="ld-pip" />
                Google sync<em>updated {new Date(l.updatedAt).toLocaleDateString()}</em>
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
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </span>
                SCRAPE QUALITY
              </div>
              <div className="ld-big">
                <span className="ld-pre">★</span>
                {l.googleRating ?? "—"}
                <span className="ld-small">/5</span>
              </div>
              <div className="ld-ghost">{stage.stepNum}</div>
              <div className="ld-bar">
                <span style={{ "--scale": quality.pct } as React.CSSProperties} />
              </div>
              <div className="ld-meta">
                {Math.round(quality.pct * 100)}% of fields captured
                <b>{l.reviewCount ?? 0} reviews</b>
              </div>
            </div>
          </div>

          {/* Get started */}
          <h2 className="ld-section-h">
            Get <em>started</em>
            <span className="ld-meta">2 actions</span>
          </h2>
          <div className="ld-pair">
            <SheetTrigger sheetKey="demo" className="ld-big-card t-demo">
              <div className="ld-head">
                <span className="ld-idx">01</span>
                <span className="ld-badge">
                  <span className="ld-pip" />
                  recommended
                </span>
              </div>
              <div className="ld-well">
                <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
                  <rect className="ld-liftA" x="14" y="20" width="92" height="68" rx="10" fill="#fff" stroke="#c8e3d2" strokeWidth="1.5" />
                  <rect className="ld-liftA" x="14" y="20" width="92" height="14" rx="10" fill="#e9f4ed" />
                  <circle cx="22" cy="27" r="2" fill="#1f6f4a" />
                  <circle cx="29" cy="27" r="2" fill="#1f6f4a" opacity=".5" />
                  <line className="ld-liftA" x1="24" y1="48" x2="92" y2="48" stroke="#c8e3d2" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="ld-liftA" x1="24" y1="58" x2="78" y2="58" stroke="#c8e3d2" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
                  <rect className="ld-liftC" x="58" y="38" width="98" height="74" rx="12" fill="#1f6f4a" stroke="#14523a" strokeWidth="1.5" />
                  <rect className="ld-liftC" x="58" y="38" width="98" height="14" rx="12" fill="#14523a" />
                  <circle cx="66" cy="45" r="2" fill="#fff" />
                  <circle cx="73" cy="45" r="2" fill="#fff" opacity=".6" />
                  <line className="ld-liftC" x1="68" y1="66" x2="146" y2="66" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="ld-liftC" x1="68" y1="78" x2="130" y2="78" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
                  <rect className="ld-liftC" x="68" y="90" width="36" height="10" rx="5" fill="#fff" opacity=".95" />
                </svg>
              </div>
              <h3>Build demo site</h3>
              <p className="ld-desc">
                Auto-generate a polished one-pager from the Google profile. Hosted on a temp
                domain, ready to send in roughly 90 seconds.
              </p>
              <div className="ld-foot">
                <span className="ld-ct">~ 90 sec to build</span>
                <span className="ld-cta">
                  Build now{" "}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>

            <SheetTrigger sheetKey="review" className="ld-big-card t-review">
              <div className="ld-head">
                <span className="ld-idx">02</span>
                <span className="ld-badge">
                  <span className="ld-pip" />
                  {review?.coldEmailDraft ? "AI draft" : "no draft"}
                </span>
              </div>
              <div className="ld-well">
                <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
                  <rect className="ld-liftA" x="14" y="22" width="80" height="82" rx="8" fill="#fff" stroke="#e0d2f5" strokeWidth="1.5" />
                  <line x1="24" y1="38" x2="84" y2="38" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="50" x2="76" y2="50" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="62" x2="80" y2="62" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="74" x2="68" y2="74" stroke="#e0d2f5" strokeWidth="2.5" strokeLinecap="round" />
                  <rect className="ld-liftC" x="64" y="38" width="92" height="80" rx="10" fill="#6d28d9" stroke="#4c1d95" strokeWidth="1.5" />
                  <line className="ld-liftC" x1="74" y1="56" x2="146" y2="56" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                  <line className="ld-liftC" x1="74" y1="68" x2="138" y2="68" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
                  <line className="ld-liftC" x1="74" y1="80" x2="124" y2="80" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
                  <rect className="ld-liftC" x="74" y="92" width="44" height="14" rx="7" fill="#fff" opacity=".95" />
                  <path className="ld-liftC" d="M82 99 l3 3 6-6" stroke="#6d28d9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Send cold pitch</h3>
              <p className="ld-desc">
                Open the AI-drafted email — subject, body and placeholders for owner name and
                demo link. Tweak it then fire away.
              </p>
              <div className="ld-foot">
                <span className="ld-ct">{review?.coldEmailDraft ? "draft ready" : "no draft yet"}</span>
                <span className="ld-cta">
                  Open draft{" "}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>
          </div>

          {/* Lead status strip */}
          <h2 className="ld-section-h">
            Lead <em>status</em>
            <span className="ld-meta">tap to filter</span>
          </h2>
          <div className="ld-strip">
            <SheetTrigger sheetKey="contact" className="ld-stat s-scrap" asStat statKey="scraped">
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </span>
                <span className="ld-dot" />
              </div>
              <div className="ld-label">Scraped</div>
              <div className="ld-figure">{formatMonthDay(l.createdAt)}</div>
              <div className="ld-meta-row">
                <span>auto-extracted</span>
                <span className="ld-v">
                  Open
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>

            <SheetTrigger sheetKey="google" className="ld-stat s-build" asStat statKey="google">
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14 14 0 010 20M2 12h20" />
                  </svg>
                </span>
                <span className="ld-dot" />
              </div>
              <div className="ld-label">Google</div>
              <div className="ld-figure">
                {l.reviewCount ?? "—"}
                <span className="ld-small">rev</span>
              </div>
              <div className="ld-meta-row">
                <span>{l.googleRating ? `${l.googleRating} ★ rating` : "no rating"}</span>
                <span className="ld-v">
                  View
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>

            <SheetTrigger sheetKey="contact" className="ld-stat s-sent" asStat statKey="email">
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <span className="ld-dot" />
              </div>
              <div className="ld-label">Email</div>
              <div
                className="ld-figure"
                style={l.email ? undefined : { fontSize: 22, paddingTop: 6 }}
              >
                {l.email ?? "missing"}
              </div>
              <div className="ld-meta-row">
                <span>{l.email ? "from listing" : "not on listing"}</span>
                <span className="ld-v">
                  {l.email ? "Open" : "Find"}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>

            <SheetTrigger sheetKey="client" className="ld-stat s-won" asStat statKey="client">
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0116 0" />
                  </svg>
                </span>
                <span className="ld-dot" />
              </div>
              <div className="ld-label">Client</div>
              <div className="ld-figure">
                {client ? "1" : "0"}
                <span className="ld-small">{client?.plan ?? "none"}</span>
              </div>
              <div className="ld-meta-row">
                <span>
                  {client?.signedUpAt
                    ? `signed up ${new Date(client.signedUpAt).toLocaleDateString()}`
                    : "not signed up"}
                </span>
                <span className="ld-v">
                  Open
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>

            <SheetTrigger sheetKey="notes" className="ld-stat s-lost" asStat statKey="notes">
              <div className="ld-row">
                <span className="ld-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <span className="ld-dot" />
              </div>
              <div className="ld-label">Notes</div>
              <div className="ld-figure">{notesCount}</div>
              <div className="ld-meta-row">
                <span>{notesCount > 0 ? `${notesCount} entry${notesCount === 1 ? "" : "s"}` : "nothing yet"}</span>
                <span className="ld-v">
                  {notesCount > 0 ? "Open" : "Add"}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </SheetTrigger>
          </div>

          {/* Lead ledger */}
          <h2 className="ld-section-h">
            Lead <em>ledger</em>
            <span className="ld-meta">scraped fields &amp; history</span>
          </h2>
          <div className="ld-ledger">
            <div className="ld-toolbar">
              <input className="ld-search" placeholder="Search by field, source, or value..." />
              <span className="ld-pulled">
                <span className="ld-pip" />
                v1 · pulled from Google
              </span>
            </div>

            <Group title="Contact & location" count={4}>
              <RowItem
                name="Phone"
                pillKind={l.phone ? "ok" : "warn"}
                pillText={l.phone ? "verified" : "missing"}
                src="SRC-001 · Google business listing"
                value={l.phone}
                detail={l.fullAddress?.split(",")[0]?.trim() ?? null}
              />
              <RowItem
                name="Email"
                pillKind={l.email ? "ok" : "warn"}
                pillText={l.email ? "verified" : "missing"}
                src="SRC-002 · scrape"
                value={l.email}
                detail={l.email ? null : "try owner socials"}
              />
              <RowItem
                name="Website"
                pillKind={l.website ? "ok" : "empty"}
                pillText={l.website ? "verified" : "none"}
                src="SRC-003 · listing URL field"
                value={l.website}
                detail={l.website ? null : "prime opportunity"}
              />
              <RowItem
                name="Category"
                pillKind={l.category ? "ok" : "empty"}
                pillText={l.category ? "verified" : "none"}
                src="SRC-004 · Google category"
                value={l.category}
                detail={null}
              />
            </Group>

            <Group title="Address & locality" count={3}>
              <RowItem
                name="Street address"
                pillKind={l.fullAddress ? "ok" : "empty"}
                pillText={l.fullAddress ? "verified" : "none"}
                src="SRC-005 · Maps geocode"
                value={l.fullAddress}
                detail={l.suburb && l.postalCode ? `${l.suburb} · ${l.postalCode}` : null}
              />
              <RowItem
                name="Working hours"
                pillKind={l.workingHours ? "ok" : "empty"}
                pillText={l.workingHours ? "verified" : "none"}
                src={`SRC-006 · ${hours.length} days observed`}
                value={hours.find((h) => h.today)?.hours ?? "—"}
                detail={hours.find((h) => h.today) ? "today's hours" : null}
              />
              <RowItem
                name="Google photos"
                pillKind={photos.length > 0 ? "ok" : "empty"}
                pillText={photos.length > 0 ? "verified" : "none"}
                src={`SRC-007 · ${photos.length} images cached`}
                value={`${photos.length} photo${photos.length === 1 ? "" : "s"}`}
                detail={null}
              />
            </Group>

            <Group title="Google profile" count={2}>
              <RowItem
                name="Rating"
                pillKind={l.googleRating ? "ok" : "empty"}
                pillText={l.googleRating ? "verified" : "none"}
                src="SRC-008 · Google reviews"
                value={l.googleRating ? `${l.googleRating} ★` : "—"}
                detail={l.reviewCount ? `${l.reviewCount} reviews` : null}
              />
              <RowItem
                name="Maps URL"
                pillKind={l.googlePlaceUrl ? "ok" : "empty"}
                pillText={l.googlePlaceUrl ? "verified" : "none"}
                src="SRC-009 · place link"
                value={l.googlePlaceUrl ? "linked" : "—"}
                detail={null}
                href={l.googlePlaceUrl}
              />
            </Group>

            <div className="ld-ledger-foot">
              {quality.filled} of {quality.total} fields captured · ledger v1
            </div>
          </div>
        </div>
      </LeadSheetProvider>
    </>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="ld-grp">
        <span className="ld-left">
          <span className="ld-toggle">−</span>
          {title}
        </span>
        <span className="ld-right">{count} fields</span>
      </div>
      {children}
    </>
  );
}

function RowItem({
  name,
  pillKind,
  pillText,
  src,
  value,
  detail,
  href,
}: {
  name: string;
  pillKind: "ok" | "warn" | "empty";
  pillText: string;
  src: string;
  value: React.ReactNode;
  detail: React.ReactNode;
  href?: string | null;
}) {
  const pillClass =
    pillKind === "warn" ? "ld-pill warn" : pillKind === "empty" ? "ld-pill empty" : "ld-pill";
  return (
    <div className="ld-row-item">
      <div className="ld-left">
        <div className="ld-name">
          {name} <span className={pillClass}>{pillText}</span>
        </div>
        <div className="ld-sub">{src}</div>
      </div>
      <div className="ld-right">
        <div
          className="ld-v"
          style={
            value === null || value === undefined || value === "—"
              ? { color: "var(--muted-2)", fontStyle: "italic" }
              : undefined
          }
        >
          {value || "—"}
        </div>
        {detail ? <div className="ld-d">{detail}</div> : null}
      </div>
      {href ? (
        <a className="ld-ext" href={href} target="_blank" rel="noreferrer" aria-label="Open">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      ) : (
        <button type="button" className="ld-ext" aria-label="Open">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      )}
    </div>
  );
}

