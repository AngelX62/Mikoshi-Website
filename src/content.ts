/**
 * Every word on the site lives here.
 *
 * Two rules govern this file.
 *
 * No em dashes. They are the loudest tell of machine-written copy, and a
 * company selling judgement about physical work cannot afford to read as
 * generated. Restructure with a period, a colon or a comma instead.
 *
 * Nothing invented. Every claim below traces to the positioning brief. An
 * earlier version of this site carried capability copy that was written to fill
 * a section rather than to state a fact, and it read as exactly that.
 */

export const site = {
  name: "MIKOSHI",
  /** Used for the document title, OpenGraph, and the footer. */
  tagline: "Proven work in. Qualified capability out.",
  description:
    "MIKOSHI turns proven physical work into portable, executable intelligence. Observe a working operation, reconstruct why it succeeds, re-embody it on different equipment, and qualify the result.",
  /** Set this once you have a domain, so OpenGraph URLs resolve absolutely. */
  url: "https://mikoshi.com",
} as const;

export const hero = {
  /** Drawn into the dither field, and mirrored as the page's real h1. */
  wordmark: "MIKOSHI",
  descriptor: "Proven work in. Qualified capability out, on any compatible machine.",
  /** Small mono label in the top-left corner. */
  eyebrow: "Physical Intelligence",
  scrollCue: "Scroll",
} as const;

/**
 * The thesis.
 *
 * Builds to the sharpest available description of the company. Rendered one
 * line at a time, each wiping up into place, so keep the lines short and keep
 * the last one the payload.
 */
export const thesis = {
  label: "Thesis",
  lines: [
    "A working cell is not",
    "a robot program. It is intent,",
    "sequence, timing, tolerance,",
    "and the recovery when it fails.",
    "MIKOSHI ports production,",
    "not merely robot programs.",
  ],
} as const;

/**
 * The method.
 *
 * Four ordered steps, so the numerals carry information here. Each step names
 * what it takes in as `inputs`, which is what keeps the section specific rather
 * than a set of capability nouns.
 *
 * `readout` is the mono label the field's instrumentation shows during that
 * shot, and doubles as the shot name in Method.tsx.
 */
export const method = {
  label: "Method",
  steps: [
    {
      index: "01",
      readout: "Observe",
      title: "Take in a working operation",
      body: "Import or watch an operation that already runs on the floor.",
      inputs: [
        "Robot programs",
        "Video",
        "Sensor signals",
        "PLC and CNC states",
        "Operator corrections",
        "Production results",
      ],
    },
    {
      index: "02",
      readout: "Reconstruct",
      title: "Recover why it succeeds",
      body: "The result is a Work Engram: the structure underneath the motion, not a recording of it.",
      inputs: [
        "Intent",
        "Causal sequence",
        "Constraints",
        "Timing",
        "Failure recovery",
        "Acceptance criteria",
      ],
    },
    {
      index: "03",
      readout: "Re-embody",
      title: "Rebuild the work in another body",
      body: "Generate native programs for the equipment already on site: a different robot, a different machine, eventually a humanoid.",
      inputs: ["Different robot", "Different machine", "Humanoid"],
    },
    {
      index: "04",
      readout: "Qualify",
      title: "Prove it physically",
      body: "Verify that the new embodiment reaches the production outcome the work requires.",
      inputs: ["Production outcome", "Acceptance criteria"],
    },
  ],
} as const;

/** The first product. Concrete on purpose: it names who runs it and who pays. */
export const deployment = {
  label: "First deployment",
  heading: "CNC machine tending",
  body: "Replicate a proven machine-tending cell across different machines and robot configurations.",
  facts: [
    { key: "Operated by", value: "The integrator" },
    { key: "Paid for by", value: "The manufacturer" },
  ],
  rationale:
    "Replication gets faster and cheaper, and stops depending on rebuilding the engineering logic every time.",
} as const;

/** Where this goes. Kept to one claim and the loop that supports it. */
export const horizon = {
  label: "Horizon",
  heading: "The portability layer for physical work.",
  body: "A machine perceives a demonstrated job, understands the logic underneath it, imagines how to perform it with its own body, executes it, and improves with experience.",
  loop: ["Perceive", "Understand", "Imagine", "Execute", "Improve"],
} as const;

export const waitlist = {
  label: "Contact",
  heading: "For integrators and manufacturers",
  body: "If you run cells you would rather not rebuild from scratch, we want to hear what you are replicating.",
  placeholder: "you@company.com",
  cta: "Start a conversation",
  success: "Received. We will be in touch.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
} as const;

export const footer = {
  /** Add real destinations as they exist. An empty array renders no link row. */
  links: [] as ReadonlyArray<{ label: string; href: string }>,
  email: "hello@mikoshi.com",
  copyright: `© ${new Date().getFullYear()} MIKOSHI`,
} as const;
