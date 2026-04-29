"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  isPipelineStage,
  type PipelineStage,
} from "@/lib/pipeline";
import { updateLeadStage } from "@/app/actions/update-lead-stage";

export type BoardLead = {
  id: string;
  name: string;
  category: string | null;
  suburb: string | null;
  fullAddress: string | null;
  phone: string | null;
  hasWebsite: boolean | null;
  googleRating: string | null;
  reviewCount: number | null;
  pipelineStage: PipelineStage;
};

export function PipelineBoard({ initialLeads }: { initialLeads: BoardLead[] }) {
  const [leads, setLeads] = useState<BoardLead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const byStage = new Map<PipelineStage, BoardLead[]>();
  for (const stage of PIPELINE_STAGES) byStage.set(stage, []);
  for (const lead of leads) byStage.get(lead.pipelineStage)?.push(lead);

  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const leadId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !isPipelineStage(overId)) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.pipelineStage === overId) return;

    const previous = lead.pipelineStage;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, pipelineStage: overId } : l
      )
    );

    startTransition(async () => {
      try {
        await updateLeadStage(leadId, overId);
      } catch (err) {
        console.error("Failed to update stage", err);
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, pipelineStage: previous } : l
          )
        );
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="pipe-board">
        {PIPELINE_STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            leads={byStage.get(stage) ?? []}
            draggingId={activeId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <CardSurface lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  leads,
  draggingId,
}: {
  stage: PipelineStage;
  leads: BoardLead[];
  draggingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const colors = STAGE_COLORS[stage];
  return (
    <div
      ref={setNodeRef}
      className={`pipe-col${isOver ? " is-over" : ""}`}
      style={
        {
          "--accent": colors.accent,
          "--accent-soft": colors.accentSoft,
        } as React.CSSProperties
      }
    >
      <div className="pipe-col-h">
        <span className="pipe-col-label">{STAGE_LABELS[stage]}</span>
        <span className="pipe-col-count">{leads.length}</span>
      </div>
      <div className="pipe-col-body">
        {leads.length === 0 ? (
          <div className="pipe-empty">drop a lead here</div>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.id}
              lead={lead}
              isGhost={draggingId === lead.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  lead,
  isGhost,
}: {
  lead: BoardLead;
  isGhost: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <CardSurface lead={lead} ghost={isGhost} />
    </div>
  );
}

function CardSurface({
  lead,
  dragging,
  ghost,
}: {
  lead: BoardLead;
  dragging?: boolean;
  ghost?: boolean;
}) {
  const sub = [
    lead.category,
    lead.suburb ?? lead.fullAddress?.split(",").slice(-2, -1)[0]?.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  const className = `pipe-card${dragging ? " is-drag" : ""}${
    ghost ? " is-ghost" : ""
  }`;

  return (
    <Link
      href={`/leads/${lead.id}`}
      className={className}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="pipe-card-name">{lead.name}</div>
      {sub && <div className="pipe-card-sub">{sub}</div>}
      <div className="pipe-card-foot">
        <span>
          {lead.googleRating ? `${lead.googleRating} ★` : "no rating"}
          {lead.reviewCount ? ` · ${lead.reviewCount}` : ""}
        </span>
        {!lead.hasWebsite && <span className="ld-pill">no site</span>}
      </div>
    </Link>
  );
}
