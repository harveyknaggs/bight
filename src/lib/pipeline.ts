export const PIPELINE_STAGES = [
  "scraped",
  "site_built",
  "reviewed",
  "emailed",
  "replied",
  "signed_up",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  scraped: "Scraped",
  site_built: "Demo Built",
  reviewed: "Reviewed",
  emailed: "Email Sent",
  replied: "Replied",
  signed_up: "Won",
};

export const STAGE_TINTS: Record<PipelineStage, string> = {
  scraped: "s-scrap",
  site_built: "s-build",
  reviewed: "s-review",
  emailed: "s-sent",
  replied: "s-won",
  signed_up: "s-lost",
};

type PillStyle = { background: string; color: string };

export const STAGE_PILL_STYLES: Record<PipelineStage, PillStyle> = {
  scraped: { background: "var(--c-purple-soft)", color: "var(--c-purple)" },
  site_built: { background: "var(--c-amber-soft)", color: "var(--c-amber)" },
  reviewed: { background: "var(--c-teal-soft)", color: "var(--c-teal)" },
  emailed: { background: "var(--c-blue-soft)", color: "var(--c-blue)" },
  replied: { background: "var(--brand-soft)", color: "var(--brand-dark)" },
  signed_up: { background: "var(--brand-soft)", color: "var(--brand-dark)" },
};

export const STAGE_COLORS: Record<
  PipelineStage,
  { accent: string; accentSoft: string }
> = {
  scraped: { accent: "var(--c-purple)", accentSoft: "var(--c-purple-soft)" },
  site_built: { accent: "var(--c-amber)", accentSoft: "var(--c-amber-soft)" },
  reviewed: { accent: "var(--c-teal)", accentSoft: "var(--c-teal-soft)" },
  emailed: { accent: "var(--c-blue)", accentSoft: "var(--c-blue-soft)" },
  replied: { accent: "var(--brand)", accentSoft: "var(--brand-soft)" },
  signed_up: { accent: "var(--brand-dark)", accentSoft: "var(--brand-soft)" },
};

export function stageTintStyle(stage: PipelineStage): React.CSSProperties {
  const { accent, accentSoft } = STAGE_COLORS[stage];
  return {
    "--accent": accent,
    "--accent-soft": accentSoft,
  } as React.CSSProperties;
}

export function isPipelineStage(value: unknown): value is PipelineStage {
  return (
    typeof value === "string" &&
    (PIPELINE_STAGES as readonly string[]).includes(value)
  );
}

export function nextStage(stage: PipelineStage): PipelineStage | null {
  const i = PIPELINE_STAGES.indexOf(stage);
  if (i === -1 || i === PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[i + 1];
}

export function prevStage(stage: PipelineStage): PipelineStage | null {
  const i = PIPELINE_STAGES.indexOf(stage);
  if (i <= 0) return null;
  return PIPELINE_STAGES[i - 1];
}
