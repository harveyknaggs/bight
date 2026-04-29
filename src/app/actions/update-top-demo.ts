"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { niches } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { isTopDemoStage, type TopDemoStage } from "@/lib/pipeline";

export type TopDemoFields = {
  topDemoUrl?: string | null;
  topDemoStage?: TopDemoStage;
  topDemoDesignAngle?: string | null;
  topDemoReviewNotes?: string | null;
};

export async function updateTopDemo(nicheId: string, fields: TopDemoFields) {
  await requireStaff();

  if (fields.topDemoStage && !isTopDemoStage(fields.topDemoStage)) {
    throw new Error(`Invalid top demo stage: ${fields.topDemoStage}`);
  }

  const [current] = await db
    .select({
      city: niches.city,
      slug: niches.slug,
      topDemoStage: niches.topDemoStage,
    })
    .from(niches)
    .where(eq(niches.id, nicheId))
    .limit(1);

  if (!current) throw new Error(`Niche not found: ${nicheId}`);

  const now = new Date();
  const update: Record<string, unknown> = {};

  if ("topDemoUrl" in fields) update.topDemoUrl = fields.topDemoUrl ?? null;
  if ("topDemoDesignAngle" in fields)
    update.topDemoDesignAngle = fields.topDemoDesignAngle ?? null;
  if ("topDemoReviewNotes" in fields)
    update.topDemoReviewNotes = fields.topDemoReviewNotes ?? null;

  if (fields.topDemoStage && fields.topDemoStage !== current.topDemoStage) {
    update.topDemoStage = fields.topDemoStage;
    if (fields.topDemoStage === "building") update.topDemoBuiltAt = now;
    if (fields.topDemoStage === "reviewed") update.topDemoReviewedAt = now;
  }

  if (Object.keys(update).length === 0) return;

  await db.update(niches).set(update).where(eq(niches.id, nicheId));

  revalidatePath(`/pipeline/${current.city}/${current.slug}`);
  revalidatePath(`/pipeline/${current.city}/${current.slug}/top-demo`);
}

export async function updateTopDemoFromForm(formData: FormData) {
  const nicheId = String(formData.get("nicheId") ?? "");
  if (!nicheId) throw new Error("Missing nicheId");

  const stageRaw = String(formData.get("topDemoStage") ?? "");
  const urlRaw = String(formData.get("topDemoUrl") ?? "").trim();
  const angleRaw = String(formData.get("topDemoDesignAngle") ?? "").trim();
  const notesRaw = String(formData.get("topDemoReviewNotes") ?? "").trim();

  const fields: TopDemoFields = {
    topDemoUrl: urlRaw === "" ? null : urlRaw,
    topDemoDesignAngle: angleRaw === "" ? null : angleRaw,
    topDemoReviewNotes: notesRaw === "" ? null : notesRaw,
  };
  if (isTopDemoStage(stageRaw)) fields.topDemoStage = stageRaw;

  await updateTopDemo(nicheId, fields);

  const [n] = await db
    .select({ city: niches.city, slug: niches.slug })
    .from(niches)
    .where(eq(niches.id, nicheId))
    .limit(1);
  if (n) redirect(`/pipeline/${n.city}/${n.slug}`);
}
