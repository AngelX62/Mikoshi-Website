/**
 * Every word on the site lives here.
 *
 * Three rules govern this file.
 *
 * **Prose does not enumerate.** The mono chips under each method step and the
 * loop under the vision already list things. When a sentence lists them too,
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
      // The field holds the source cell through this step now, so the sentence
      // carries the abstraction on its own. It has to name the distinction the
      // picture used to draw: a record of the motion against the reason it
      // worked.
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
 *
 * Two names across four shots, because there are two bodies. The middle entry
 * used to read "Work engram" and the form it named no longer exists. A readout
 * that names something not on screen is worse than no readout, and this one
 * sits directly under the thing it claims to be describing.
 */
export const fieldReadout = [
  "Source cell",
  "Source cell",
  "Target cell",
  "Target cell",
] as const;

/**
 * A real cell, run through the same grid as everything else.
 *
 * TO ADD THE PHOTOGRAPH: drop the file in `public/` and set `src` below to
 * "/cell.jpg". Nothing else needs changing; the deployment already holds this
 * channel behind its copy and will start showing it.
 *
 * Supply a landscape shot of an actual machine-tending cell, high contrast with
 * a clear silhouette, 2000px or wider. The grid samples one pixel per cell and
 * the ramp has eight levels, so composition and tone carry the image and
 * sharpness is thrown away. A picture that already reads as near black and
 * white will survive; a flat, evenly lit one will turn to grey noise.
 *
 * **Empty draws nothing at all, and there is deliberately no fallback.** There
 * used to be one: the schematic target cell stood in wherever a photograph was
 * missing, so the page always had something in the frame. That is the right
 * instinct for a decorative image and the wrong one here. The beat it filled
 * was the proof beat, and a drawing cannot be evidence, so the safety net was
 * holding up a claim rather than a picture. The beat is gone (see page.tsx) and
 * so is the stand-in. A missing file now means a quiet field, which is honest.
 */
export const photograph = {
  src: "",
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

/**
 * Where this goes.
 *
 * This was the Horizon, one claim and the loop under it, and it is now the
 * vision in full. The section it replaced carried two sharper lines than
 * anything here ("The portability layer for physical work." and "Right now a
 * job belongs to the machine it was commissioned on. It should belong to
 * whoever needs it done."), and they were retired rather than kept because both
 * say what `belief` and `more.paragraphs` say at greater length. Two statements
 * of one idea in one section is the thing rule one of this file exists to stop.
 *
 * **Most of the words here are not on screen by default**, and that is the
 * shape of the section rather than a compromise in it. The page is 7,622px with
 * a third of that inside one pin, and 400 words of manifesto appended to the
 * bottom would have been another 2,000. What is always visible are the claims:
 * the heading, the belief, the three bodies, the kicker. `more` holds the
 * argument for those claims, behind a control. See Vision.tsx.
 *
 * The trim is deliberate and two passages are missing from the draft this came
 * from. One enumerated intent, constraints, failure and recovery, which is
 * method step 02's chip list said again in prose. The other announced that we
 * are beginning with CNC machine tending, which is the entire Deployment
 * section said again. A reader reaches this having just read both.
 */
export const vision = {
  label: "Vision",
  /** Two lines, wiped in sequence. Kept short enough not to wrap at 1280. */
  heading: ["The machine may change.", "What it learned should not."],
  belief: "We believe physical capability should be able to travel.",
  /** The three bodies, and the line that turns them into an argument. */
  bodies: "An industrial arm. A mobile robot. A humanoid.",
  bodiesNote: "Each body is different. The intelligence continues.",
  more: {
    /** On the control; the open state swaps to `close`. */
    cta: "Read the full vision",
    close: "Close the full vision",
    /** Named for assistive tech, which gets no dashed rule to read. */
    label: "The full vision",
    paragraphs: [
      "MIKOSHI is building physical intelligence that can learn from experience, survive a change of body, and continue becoming more capable.",
      "Today, when a robot learns a difficult physical task, much of that capability remains bound to one machine, one setup, and one carefully engineered environment. Change the robot or the conditions, and much of the work begins again.",
      "MIKOSHI preserves more than motion. When that understanding moves into a new machine, it adapts to the body's reach, senses, tools, and limits, then finds its own way to achieve the same outcome.",
      "As experience compounds, MIKOSHI can develop deeper physical common sense and combine the lessons of countless machines. Over time, it could reach a level of physical understanding that no single human or robot could acquire alone.",
      "Our destination is physical intelligence that endures across machines, grows across generations, and takes form wherever a capable body can carry it.",
    ],
  },
  kicker: "Bodies will change. The intelligence will continue.",
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
