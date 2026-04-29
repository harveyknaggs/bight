// Per-niche illustration shown on each niche card on /pipeline.
// Falls back to a generic kanban icon when the slug isn't recognised.

export function NicheIcon({ slug }: { slug: string }) {
  const normalized = slug.toLowerCase().trim();

  if (
    normalized === "hairdressers" ||
    normalized === "hairdresser" ||
    normalized === "barbers" ||
    normalized === "barber" ||
    normalized === "salons" ||
    normalized === "salon"
  ) {
    return <ScissorsIcon />;
  }

  return <KanbanIcon />;
}

function ScissorsIcon() {
  return (
    <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
      {/* blades crossing through the pivot at (85, 70) */}
      <path
        d="M62 98 L 126 20"
        stroke="#155e75"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M108 98 L 44 20"
        stroke="#155e75"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* finger holes — drawn after blades so their fill masks the inside of the loops */}
      <circle cx="62" cy="98" r="14" fill="#fff" stroke="#155e75" strokeWidth="3.5" />
      <circle cx="108" cy="98" r="14" fill="#fff" stroke="#155e75" strokeWidth="3.5" />

      {/* pivot */}
      <circle cx="85" cy="70" r="3.5" fill="#155e75" />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg width="170" height="130" viewBox="0 0 170 130" fill="none">
      {/* col 1 — scraped */}
      <rect x="16" y="22" width="28" height="86" rx="6" fill="#fff" stroke="#a0c5cf" strokeWidth="1.5" />
      <rect x="16" y="22" width="28" height="10" rx="6" fill="#dbe9ed" />
      <rect className="ld-liftA" x="20" y="38" width="20" height="12" rx="3" fill="#eaf2f7" />
      <rect className="ld-liftA" x="20" y="54" width="20" height="12" rx="3" fill="#eaf2f7" opacity="0.7" />

      {/* col 2 */}
      <rect x="50" y="22" width="28" height="86" rx="6" fill="#fff" stroke="#a0c5cf" strokeWidth="1.5" />
      <rect x="50" y="22" width="28" height="10" rx="6" fill="#dbe9ed" />
      <rect className="ld-liftB" x="54" y="40" width="20" height="12" rx="3" fill="#dbe9ed" />

      {/* col 3 */}
      <rect x="84" y="22" width="28" height="86" rx="6" fill="#fff" stroke="#a0c5cf" strokeWidth="1.5" />
      <rect x="84" y="22" width="28" height="10" rx="6" fill="#dbe9ed" />
      <rect className="ld-liftC" x="88" y="42" width="20" height="12" rx="3" fill="#155e75" opacity="0.22" />
      <rect className="ld-liftC" x="88" y="60" width="20" height="12" rx="3" fill="#155e75" opacity="0.14" />

      {/* col 4 — won (highlighted) */}
      <rect x="118" y="22" width="28" height="86" rx="6" fill="#155e75" stroke="#0e3e4d" strokeWidth="1.5" />
      <rect x="118" y="22" width="28" height="10" rx="6" fill="#0e3e4d" />
      <rect x="122" y="40" width="20" height="12" rx="3" fill="#fff" opacity="0.92" />
      <rect x="122" y="58" width="20" height="12" rx="3" fill="#fff" opacity="0.7" />
    </svg>
  );
}
