"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activity, leads } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import {
  isPipelineStage,
  STAGE_LABELS,
  type PipelineStage,
} from "@/lib/pipeline";

export async function updateLeadStage(leadId: string, newStage: PipelineStage) {
  await requireStaff();

  if (!isPipelineStage(newStage)) {
    throw new Error(`Invalid pipeline stage: ${newStage}`);
  }

  const [current] = await db
    .select({ pipelineStage: leads.pipelineStage })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!current) throw new Error(`Lead not found: ${leadId}`);
  const fromStage = current.pipelineStage as PipelineStage;
  if (fromStage === newStage) return;

  await db
    .update(leads)
    .set({ pipelineStage: newStage, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(activity).values({
    leadId,
    kind: "stage_changed",
    summary: `Moved from ${STAGE_LABELS[fromStage] ?? fromStage} to ${STAGE_LABELS[newStage]}`,
    meta: { from: fromStage, to: newStage },
  });

  revalidatePath("/pipeline", "layout");
  revalidatePath(`/leads/${leadId}`);
}
