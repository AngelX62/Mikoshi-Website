/**
 * Every word on the site lives here.
 *
 * Three rules govern this file.
 *
 * **Prose does not enumerate.** The mono chips under each method step and the
 * loop under the horizon already list things. When a sentence lists them too,
 * the page says everything twice and every paragraph reads as an inventory. Let
 * the lists list. A sentence earns its place by saying something the list next
 * to it cannot: why the step is hard, what it costs, what would go wrong.
 *
 * **No em dashes.** They are the loudest tell of machine-written copy, and a
 * company selling judgement about physical work cannot afford to read as
 * generated. Restructure with a period or a comma instead.
 *
 * **Nothing invented.** Every claim below traces to the positioning brief. An
 * earlier version of this site carried capability copy written to fill a
 * section rather than to state a fact, and it read as exactly that.
 */

export const site = {
  name: "MIKOSHI",
  /** Used for the document title, OpenGraph, and the footer. */
  tagline: "Proven work in. Qualified capability out.",
  description:
    "MIKOSHI turns proven physical work into portable, executable intelligence. We take a cell that already runs and stand the same job up on hardware it was never written for.",
  /** Set this once you have a domain, so OpenGraph URLs resolve absolutely. */
  url: "https://mikoshi.com",
} as const;

export const hero = {
  /** Drawn into the dither field, and mirrored as the page's real h1. */
  wordmark: "MIKOSHI",
  /** Three beats, not a sentence with a clause hung off the end. */
  descriptor: "Proven work in. Qualified capability out. On any compatible machine.",
  /** Small mono label in the top-left corner. */
  eyebrow: "Physical Intelligence",
  scrollCue: "Scroll",
} as const;

/**
 * The thesis.
 *
 * Two sentences that flow, then the claim they earn. Keep the lines short: each
 * one sits inside a mask that clips overflow, so a line long enough to wrap
 * breaks the wipe. Roughly thirty characters is the ceiling.
 */
export const thesis = {
  label: "Thesis",
  lines: [
    "A cell that runs well is",
    "years of judgment nobody",
    "ever wrote down.",
    "Move it to new hardware",
    "and you pay for it again.",
    "MIKOSHI ports production,",
    "not robot programs.",
  ],
} as const;

/**
 * The method.
 *
 * Four ordered steps, so the numerals carry information here. `inputs` becomes
 * the mono chips, which is where the enumeration belongs. Each `body` is left
 * to make the point the chips cannot.
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
      body: "We start from a job that already runs, not from a description of one.",
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
      body: "A recording tells you what moved. A Work Engram holds why it worked.",
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
      body: "Nothing is emulated. The new machine runs programs written for the body it actually has.",
      inputs: ["Different robot", "Different machine", "Humanoid"],
    },
    {
      index: "04",
      readout: "Qualify",
      title: "Prove it physically",
      body: "Working in simulation is not working. The cell is done when it makes good parts.",
      inputs: ["Production outcome", "Acceptance criteria"],
    },
  ],
} as const;

/**
 * What the field is holding, one per method shot.
 *
 * Read by the instrument overlay, which annotates the canvas rather than the
 * copy. These name the *form on screen*, which is the one thing the step's own
 * title and index do not: the reader can already see it is step three, so a
 * third label saying so is noise. Naming the body being drawn is information.
 */
export const fieldReadout = [
  "Source cell",
  "Work engram",
  "Target cell",
  "Target cell",
] as const;

/**
 * The proof beat: a real cell, run through the same grid as everything else.
 *
 * TO ADD THE PHOTOGRAPH: drop the file in `public/` and set `src` below to
 * "/cell.jpg". Nothing else needs changing.
 *
 * Supply a landscape shot of an actual machine-tending cell, high contrast with
 * a clear silhouette, 2000px or wider. The grid samples one pixel per cell and
 * the ramp has eight levels, so composition and tone carry the image and
 * sharpness is thrown away. A picture that already reads as near black and
 * white will survive; a flat, evenly lit one will turn to grey noise.
 *
 * Empty ships no request at all. The field falls back to the schematic target
 * cell, which is also the safety net if a real file ever fails to load.
 */
export const proof = {
  src: "",
  label: "Proof",
  caption: "A cell running work it was never programmed for.",
  /** Describes the photograph for anyone who cannot see the canvas. */
  alt: "A CNC machine-tending cell on a shop floor.",
} as const;

/** The first product. Concrete on purpose: it names who runs it and who pays. */
export const deployment = {
  label: "First deployment",
  heading: "CNC machine tending",
  body: "Take a tending cell that already earns its keep and build the next one on hardware the plant already owns.",
  facts: [
    { key: "Operated by", value: "The integrator" },
    { key: "Paid for by", value: "The manufacturer" },
  ],
  rationale: "The second cell stops costing what the first one did.",
} as const;

/** Where this goes. The loop below already lists the verbs, so the body does not. */
export const horizon = {
  label: "Horizon",
  heading: "The portability layer for physical work.",
  body: "Right now a job belongs to the machine it was commissioned on. It should belong to whoever needs it done.",
  loop: ["Perceive", "Understand", "Imagine", "Execute", "Improve"],
} as const;

export const waitlist = {
  label: "Contact",
  heading: "For integrators and manufacturers",
  body: "Tell us about the cell you would rather not build twice.",
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
