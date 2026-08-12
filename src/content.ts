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
 * The bookend, held as five words rather than as a sentence.
 *
 * It is said twice: at the top of the section in display type, and at the
 * bottom in 11px mono, where the five words become five grid cells sitting
 * under the five verbs of `vision.loop`. So the closing row needs the words
 * separately, and the heading needs them joined, and holding the array as the
 * single source is what stops the two occurrences drifting apart when somebody
 * edits one of them.
 *
 * Five words against five verbs is not a coincidence that was engineered; it is
 * one that was found in the copy and then used. Do not add a sixth word.
 */
const BOOKEND = ["Humanity", "can", "build", "anything,", "anywhere."] as const;

/**
 * Where the display setting breaks the bookend across two lines.
 *
 * Hand-set rather than left to the measure. The break has to fall after
 * "build", so the first line is the capability and the second is the scope; a
 * break anywhere else splits a noun from its own adjective. Three words also
 * happens to be what fits: at the 4.75rem cap the longer of the two lines
 * measures about 720px inside a 896px column.
 */
const BOOKEND_BREAK = 3;

/**
 * Where this goes, and the page's most ambitious claim.
 *
 * **The section is an escalation, not a claim.** It used to state one thing,
 * that capability should survive a change of body. `beats` now walks from the
 * problem to that claim and then past it, to inventing processes nobody
 * demonstrated. Vision.tsx sets each beat larger and brighter than the last, so
 * the argument is legible as a shape before a word of it is read. The order is
 * load-bearing and the fourth beat is the one the section exists for.
 *
 * **Most of the words here are not on screen by default**, and that is the
 * shape of the section rather than a compromise in it. The page is 7,622px with
 * a third of that inside one pin, and 400 words of manifesto appended to the
 * bottom would have been another 2,000. `more` holds the argument behind a
 * control. What is always visible is the escalation itself, because a reader
 * who never opens the panel still has to learn what changed.
 *
 * **One passage is cut from the draft this came from**, and only one: an
 * enumeration of intent, constraints, material behaviour, prerequisites,
 * failure modes and recovery, which is method step 02's chip list said again in
 * prose. Rule one of this file exists for exactly that. The sentence keeps its
 * claim and loses the list.
 *
 * An earlier pass also cut "We begin in industrial production", on the grounds
 * that it restated the Deployment section. **That was wrong and it is back.**
 * Deployment says what ships first; this says why industrial production is
 * where an intelligence like this has to start, because outcomes there can be
 * measured and the work has to survive contact with reality. That is a reason,
 * and rule one asks for exactly the sentence the list beside it cannot give.
 *
 * "Work Engram" on first use, "Engram" after, so the site keeps one name for
 * the artifact and method step 02 stays the place it is defined.
 *
 * Retired here: "Bodies will change. The intelligence will continue.", which
 * was the kicker. The last paragraph of `more` says it better and at full
 * length, and the section now closes on the bookend instead.
 */
export const vision = {
  label: "Vision",
  bookend: BOOKEND,
  /** Derived, so the h2 and the closing row can never disagree. */
  heading: [
    BOOKEND.slice(0, BOOKEND_BREAK).join(" "),
    BOOKEND.slice(BOOKEND_BREAK).join(" "),
  ],
  /**
   * Four beats: the problem, the transfer, the turn, the invention.
   *
   * Left as plain sentences with no hand-set breaks. These are beats, not
   * headings, and at the sizes Vision.tsx gives them each one sets on a single
   * line inside a 672px column, so a break would be a decision the measure has
   * already made.
   */
  beats: [
    "Today a process that works is trapped where it was built.",
    "MIKOSHI turns it into reusable causal knowledge of a physical transformation.",
    "The machine may change. What it learned should not.",
    "Then it begins inventing processes nobody has demonstrated.",
  ],
  more: {
    /** On the control; the open state swaps to `close`. */
    cta: "Read the full vision",
    close: "Close the full vision",
    /** Named for assistive tech, which gets no dashed rule to read. */
    label: "The full vision",
    paragraphs: [
      "Humanity's ability to build is limited not only by materials or machines, but by where physical knowledge lives.",
      "Today, a successful process is often trapped in a person, a factory, a robot, or a carefully engineered environment. Robots can learn motions and policies, but much of that learning disappears when the body, tool, material, or conditions change. The desired outcome may remain the same; the work must be engineered again.",
      "MIKOSHI is building physical synthesis intelligence: intelligence that learns how physical outcomes come into existence.",
      "It forms understanding by acting in the world, observing consequences, testing hypotheses, qualifying results, and learning from failure. It preserves not only what happened, but what caused success.",
      "MIKOSHI captures this understanding in Work Engrams.",
      "An Engram is not a recording of one machine's motions. It is reusable causal knowledge of a physical transformation. Because it describes what must remain true rather than what one body happened to do, it can be adapted to an industrial arm, a mobile manipulator, a humanoid, a machine tool, or machines that do not yet exist.",
      "But transferring known work is only the beginning.",
      "As verified Engrams accumulate, MIKOSHI aims to combine them, test them, and discover new ways to achieve physical outcomes no human or robot explicitly demonstrated. Given a goal, available materials, tools, machines, and constraints, it should be able to determine whether that outcome is possible, and invent a qualified process for producing it.",
      "We begin in industrial production, where outcomes can be measured and intelligence must survive contact with reality. Every migrated process, intervention, failure, recovery, and qualified result contributes to a growing body of physical understanding.",
      "The destination is an intelligence through which civilization can turn intent into physical reality wherever capable machines exist: across factories, infrastructure, remote environments, and eventually beyond Earth.",
      "Bodies will change. Tools will change. Environments will change. The intelligence will continue learning how the world can be transformed.",
    ],
  },
  /**
   * Five verbs, and the reason the closing pair works: `BOOKEND` is five words,
   * so the two rows align cell for cell. Perceive sits over Humanity, Improve
   * over Anywhere. Changing the length of either list breaks the other.
   */
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
