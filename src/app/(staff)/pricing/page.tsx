type Tier = {
  name: string;
  price: string;
  when: string;
};

const setupTiers: Tier[] = [
  { name: "Floor", price: "NZ$1,500", when: "Client is hesitant or first ever sale" },
  { name: "Sweet spot", price: "NZ$1,995", when: "Default. Psychological under-$2K" },
  { name: "Stretch", price: "NZ$2,995", when: "Site includes bookings + CMS" },
];

const hostingTiers: Tier[] = [
  { name: "Floor", price: "NZ$29/mo", when: "Conversion is the priority" },
  { name: "Sweet spot", price: "NZ$39 to NZ$49/mo", when: "Default" },
  { name: "Stretch", price: "NZ$59/mo", when: "Bundle business email + domain" },
];

const setupIncludes = [
  "Custom site (the demo they already saw)",
  "Domain registered in their name",
  "Hosting set up on Railway",
  "Business email (1 mailbox, hello@theirbiz.co.nz)",
  "Up to 2 rounds of revisions",
  "Go-live within 7 days",
];

const hostingIncludes = [
  "Hosting + domain renewal + email",
  "SSL + uptime monitoring",
  "Up to 2 small content edits per month (hours, prices, a new review)",
  "Continued access to Harvey for questions",
];

const upsells = [
  { item: "Add online booking", price: "+$30/mo" },
  { item: "Photo refresh / new shoot", price: "$300 one-off" },
  { item: "Bigger redesign next year", price: "$800 one-off" },
  { item: "Run their Google Ads", price: "$200/mo plus ad spend" },
];

const justifiers = [
  "Online booking (Setmore / Square Appointments / Booksy embed)",
  "Live Google Reviews pull (refresh weekly via the scraper)",
  "CMS so client can self-edit (Decap CMS or Sanity, free tier)",
  "Domain + business email + hosting bundled",
  "Custom photography (partner with local photographer, $300 upsell)",
  "Local SEO setup (schema, GBP optimisation, local keywords)",
  "Analytics dashboard (Plausible or weekly email summary)",
  "SMS lead alerts (Twilio, costs $5/mo, charges $20/mo)",
];

function TierCard({ tier, highlight }: { tier: Tier; highlight?: boolean }) {
  return (
    <div
      className="ld-stat"
      style={{
        background: highlight ? "var(--brand-soft)" : "#fff",
        border: highlight ? "1px solid var(--brand-dark)" : "1px solid var(--line)",
      }}
    >
      <div className="ld-label">{tier.name}</div>
      <div className="ld-figure" style={{ fontSize: 28 }}>
        {tier.price}
      </div>
      <div className="ld-meta-row">
        <span>{tier.when}</span>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const conversion = 0.1;
  const emails = 100;
  const clients = Math.round(emails * conversion);
  const setupTotal = clients * 1995;
  const recurringTotal = clients * 49 * 12;
  const year1Total = setupTotal + recurringTotal;

  return (
    <div className="ld-wrap">
      {/* Hero */}
      <div className="ld-hero">
        <div>
          <div className="ld-stage-line">
            <span className="ld-dash" />
            PRICING PLAN
            <span className="ld-dash" />
          </div>
          <h1 className="ld-biz">
            Big yes once, <em>small yes forever</em>
          </h1>
          <p className="ld-subline">
            One upfront setup fee, then a small monthly hosting fee. Working
            draft, not yet tested with real clients. Saved 2026-04-29.
          </p>
          <span className="ld-sync-pill">
            <span className="ld-pip" />
            Status<em>working draft</em>
          </span>
        </div>

        <div className="ld-kpi">
          <div className="ld-label">DEFAULT OFFER</div>
          <div className="ld-big">
            $1,995
            <span className="ld-small">+ $49/mo</span>
          </div>
          <div className="ld-ghost">$$</div>
          <div className="ld-bar">
            <span style={{ "--scale": 1 } as React.CSSProperties} />
          </div>
          <div className="ld-meta">
            sweet spot tier<b>under $2K psych</b>
          </div>
        </div>
      </div>

      {/* Setup fee */}
      <h2 className="ld-section-h">
        Setup fee <em>(one-off)</em>
        <span className="ld-meta">never go under $1,500</span>
      </h2>
      <div className="ld-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {setupTiers.map((t) => (
          <TierCard key={t.name} tier={t} highlight={t.name === "Sweet spot"} />
        ))}
      </div>

      {/* Monthly hosting */}
      <h2 className="ld-section-h">
        Monthly <em>hosting</em>
        <span className="ld-meta">under $50/mo is the magic zone</span>
      </h2>
      <div className="ld-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {hostingTiers.map((t) => (
          <TierCard key={t.name} tier={t} highlight={t.name === "Sweet spot"} />
        ))}
      </div>

      {/* What each fee includes */}
      <h2 className="ld-section-h">
        What each fee <em>includes</em>
        <span className="ld-meta">at the default tiers</span>
      </h2>
      <div className="ld-pair">
        <div className="ld-big-card t-demo">
          <div className="ld-head">
            <span className="ld-idx">01</span>
            <span className="ld-badge">
              <span className="ld-pip" />
              setup $1,995
            </span>
          </div>
          <h3>Setup</h3>
          <ul style={{ marginTop: 12, paddingLeft: 18, lineHeight: 1.7 }}>
            {setupIncludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="ld-big-card t-review">
          <div className="ld-head">
            <span className="ld-idx">02</span>
            <span className="ld-badge">
              <span className="ld-pip" />
              hosting $49/mo
            </span>
          </div>
          <h3>Monthly hosting</h3>
          <ul style={{ marginTop: 12, paddingLeft: 18, lineHeight: 1.7 }}>
            {hostingIncludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p
            className="ld-desc"
            style={{ marginTop: 12, fontStyle: "italic" }}
          >
            The hosting fee is really paying for &quot;someone who knows the site
            and answers when I email.&quot; That is the real value, not the
            server cost.
          </p>
        </div>
      </div>

      {/* Cold outreach pitch */}
      <h2 className="ld-section-h">
        Cold outreach <em>pitch</em>
        <span className="ld-meta">the line that closes</span>
      </h2>
      <div
        className="ld-ledger"
        style={{ padding: 28, fontSize: 18, lineHeight: 1.6 }}
      >
        <p style={{ margin: 0, fontStyle: "italic" }}>
          &quot;Built you a free demo. If you want to keep it, $1,995 once,
          then $49 a month and we look after everything. No contracts, cancel
          anytime.&quot;
        </p>
        <p
          className="ld-ledger-foot"
          style={{ marginTop: 18, padding: 0, textAlign: "left" }}
        >
          The &quot;no contracts&quot; line removes the biggest objection. They
          feel safe. But almost nobody cancels because the friction is too high
          once they have paid the setup.
        </p>
      </div>

      {/* Upsell ladder */}
      <h2 className="ld-section-h">
        Upsell <em>ladder</em>
        <span className="ld-meta">later, once they trust you</span>
      </h2>
      <div className="ld-ledger">
        {upsells.map((u) => (
          <div key={u.item} className="ld-row-item">
            <div className="ld-left">
              <div className="ld-name">{u.item}</div>
            </div>
            <div className="ld-right">
              <div className="ld-v">{u.price}</div>
            </div>
          </div>
        ))}
        <div className="ld-ledger-foot">
          The recurring relationship is where the real money is. The setup just
          gets you in the door.
        </div>
      </div>

      {/* Year 1 maths */}
      <h2 className="ld-section-h">
        Year 1 <em>maths</em>
        <span className="ld-meta">at 10% conversion (generous)</span>
      </h2>
      <div className="ld-strip" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="ld-stat">
          <div className="ld-label">Emails sent</div>
          <div className="ld-figure">{emails}</div>
          <div className="ld-meta-row">
            <span>cold outreach</span>
          </div>
        </div>
        <div className="ld-stat">
          <div className="ld-label">Paying clients</div>
          <div className="ld-figure">{clients}</div>
          <div className="ld-meta-row">
            <span>at 10% conversion</span>
          </div>
        </div>
        <div className="ld-stat">
          <div className="ld-label">Setup revenue</div>
          <div className="ld-figure" style={{ fontSize: 28 }}>
            ${setupTotal.toLocaleString()}
          </div>
          <div className="ld-meta-row">
            <span>{clients} x $1,995</span>
          </div>
        </div>
        <div className="ld-stat">
          <div className="ld-label">Recurring revenue</div>
          <div className="ld-figure" style={{ fontSize: 28 }}>
            ${recurringTotal.toLocaleString()}
          </div>
          <div className="ld-meta-row">
            <span>{clients} x $49 x 12</span>
          </div>
        </div>
      </div>
      <div
        className="ld-ledger"
        style={{ padding: 24, marginTop: 12, textAlign: "center" }}
      >
        <div className="ld-label">YEAR 1 TOTAL</div>
        <div className="ld-big" style={{ marginTop: 8 }}>
          ${year1Total.toLocaleString()}
        </div>
        <p
          className="ld-ledger-foot"
          style={{ marginTop: 12, padding: 0 }}
        >
          Recurring stacks with each new batch.
        </p>
      </div>

      {/* Justifiers */}
      <h2 className="ld-section-h">
        Things that justify <em>charging more</em>
        <span className="ld-meta">rough order of impact</span>
      </h2>
      <div className="ld-ledger">
        {justifiers.map((j, i) => (
          <div key={j} className="ld-row-item">
            <div className="ld-left">
              <div className="ld-name">
                <span
                  className="ld-pill"
                  style={{
                    background: "var(--brand-soft)",
                    color: "var(--brand-dark)",
                    marginRight: 10,
                  }}
                >
                  {i + 1}
                </span>
                {j}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
