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
 * What the dimension line reads at the qualifying shot.
 *
 * A word, not a figure, and that is the whole point. A number here would be
 * invented, which rule three of this file forbids outright, and it would also be
 * measuring the wrong thing: nobody buys a cell because the gantry is 640mm
 * across. Step 04's own body already says what is actually being measured, that
 * the cell is done when it makes good parts, so the caliper reads that.
 *
 * It is the one moment on the page where the instrument stops annotating and
 * takes a reading, which is the argument the method spends 280% of a viewport
 * making. See lib/instrument.ts.
 */
export const fieldMeasure = "Good parts";

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

/**
 * The first product. Concrete on purpose: it names who runs it and who pays.
 *
 * **The commercial pair used to be a key/value list and is now a diagram.** It
 * said "Operated by: The integrator" and "Paid for by: The manufacturer", which
 * is two facts sitting next to each other; the thing that actually has to land
 * is that they are facts about the *same cell*, one from each side. A list
 * cannot say that and a drawing can, so `model` names the three parts and the
 * two relations and Deployment.tsx lays them across the frame.
 *
 * The relations are worded so the row reads as a sentence in the order the eye
 * takes it: integrator, operates, the cell, paid for by, manufacturer. That is
 * why one is active and the other passive. Swapping either to match the other
 * grammatically would make the row say something false.
 *
 * `spoken` is the same claim as one sentence, for anyone who gets the section
 * read to them rather than drawn. The diagram itself is `aria-hidden`, because
 * five labels and two rules read aloud in sequence is not a sentence.
 */
export const deployment = {
  label: "First deployment",
  heading: "CNC machine tending",
  body: "Take a tending cell that already earns its keep and build the next one on hardware the plant already owns.",
  model: {
    operator: "The integrator",
    operates: "Operates",
    subject: "The cell",
    paidBy: "Paid for by",
    payer: "The manufacturer",
    spoken:
      "The integrator operates the cell. It is paid for by the manufacturer.",
  },
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
 * **The rest of the lists were turned into sentences rather than deleted.** The
 * draft carried nine comma-separated enumerations across eleven paragraphs: the
 * places a process gets trapped, the five things the intelligence does to form
 * understanding, the bodies an Engram can move to, the inputs a goal is solved
 * against, the kinds of result that feed it back. Every claim in them is still
 * here. What changed is that a list of four abstractions became a thing a
 * reader can picture, usually by naming one instead of five: "a person, a
 * factory, a robot, or a carefully engineered environment" is now an operator
 * who knows the sound the cut should make, a fixture made for one part, and a
 * machine with habits nobody wrote down. A comma series is how a specification
 * sounds, and this is the one part of the site whose whole job is to sound like
 * a person meant it.
 *
 * Two series survive on purpose, both of them figures rather than inventories:
 * "by doing it, by watching what happens, and by being wrong often enough to
 * find out why", which is carried by the repeated "by", and "to an arm, to a
 * humanoid, or to a machine nobody has built yet", which escalates and has to
 * land on the last item.
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
    "MIKOSHI learns why it works, in a form another machine can use.",
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
      "The limit on what humanity can build is not really materials, and not really machines. It is that physical knowledge stays where it was made.",
      "A process that works is held in place by everything around it. The operator knows the sound the cut should make. The fixture was made for one part. The machine has habits nobody wrote down.",
      "Robots can learn a motion and hold a policy. Change the body or the material and most of that learning goes with it. What you wanted made has not changed. The work of getting there starts over.",
      "MIKOSHI is building physical synthesis intelligence: intelligence that learns how physical outcomes come into existence.",
      "It learns the way anyone learns something physical. By doing it, by watching what happens, and by being wrong often enough to find out why.",
      "What it keeps is not a record of what happened. It is the reason the work came out right, and we call that a Work Engram.",
      "An Engram is not a recording of what one machine did. It holds what has to stay true for the work to come out right, which is a different kind of thing entirely. Because it describes the requirement rather than the gesture, it can be given to an arm, to a humanoid, or to a machine nobody has built yet.",
      "But transferring known work is only the beginning.",
      "As qualified Engrams accumulate, they stop being separate. MIKOSHI should be able to put them together and reach an outcome nobody demonstrated. Give it the result you need and the shop you have, and it should tell you whether that result is reachable, then work out a process that gets there and prove it on the floor.",
      "We begin in industrial production, because that is where an outcome can be measured and where an intelligence has to survive contact with reality. Every cell we move teaches it something, and so does every one that fights back.",
      "The destination is an intelligence that turns intent into physical reality wherever there is a machine capable of the work. In a factory now. In places that are hard to reach. Eventually beyond Earth.",
      "Bodies will change. Tools will change. Environments will change. The intelligence that learned how the work comes out right will still be learning.",
    ],
  },
  /**
   * Five verbs, and the reason the closing pair works: `BOOKEND` is five words,
   * so the two rows align cell for cell. Perceive sits over Humanity, Improve
   * over Anywhere. Changing the length of either list breaks the other.
   */
  loop: ["Perceive", "Understand", "Imagine", "Execute", "Improve"],
} as const;

/**
 * The one thing the page asks anybody to do.
 *
 * `body` asks a question, so the form now has somewhere to answer it. It used to
 * say "tell us about the cell" above a single email input, which is an
 * invitation with no way to accept. The cell line is optional: requiring it
 * would trade the lead for the detail, and at this volume a bare address is
 * still worth having.
 *
 * `errorUnconfigured` exists because the transport can be absent. See
 * lib/waitlist.ts: with no endpoint the form says so and points at the address
 * in the footer, rather than thanking somebody for something that did not
 * happen.
 */
/**
 * Who owns what, and the objection this page exists to remove.
 *
 * Method step 01 says out loud that MIKOSHI takes robot programs, PLC and CNC
 * states, sensor signals, operator corrections and production results. That is
 * the most sensitive data a plant has, and until now the site named the
 * ingestion and said nothing about the terms, which leaves the reader to assume
 * the worst in the gap. For a site whose job is winning design partners, that
 * gap was the most expensive thing on it.
 *
 * **Every line here comes from the rights table MIKOSHI already wrote**, and
 * nothing is extrapolated from it. Two questions that table does not answer are
 * deliberately absent rather than guessed: where the work runs, and whether a
 * cell keeps running after an engagement ends. "Customer-owned and exclusively
 * controlled" implies the second and does not state it, and an implication is
 * not a term. Both are worth adding the moment they are decided.
 *
 * The six-layer breakdown behind this is more than a landing page carries. What
 * is here is the claim; the table belongs in a contract.
 */
export const ownership = {
  label: "Ownership",
  /** The whole answer in one line, and the section's closing reassurance. */
  lead: "Your work remains yours. MIKOSHI gives it continuity.",
  /**
   * A record, and a flat one, because these are three independent facts about
   * three different parties. The commercial pair below it is a diagram for the
   * opposite reason: those two facts are about the same cell.
   */
  rights: [
    { party: "The customer", holds: "Owns the work" },
    { party: "MIKOSHI", holds: "Owns the intelligence infrastructure" },
    { party: "The robot", holds: "Owns nothing" },
  ],
  licence:
    "MIKOSHI takes only the licence it needs to host, adapt and run your Engram, and does not train anyone else's systems on it unless you opt in.",
} as const;

export const waitlist = {
  label: "Contact",
  heading: "For integrators and manufacturers",
  body: "Tell us about the cell you would rather not build twice.",
  placeholder: "you@company.com",
  /** Optional, and the placeholder has to make that obvious. */
  cellPlaceholder: "The cell, in a line (optional)",
  cellLabel: "About the cell",
  cta: "Start a conversation",
  success: "Received. We will be in touch.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
  errorUnconfigured: "This form is not connected yet. Write to",
} as const;

export const footer = {
  /** Add real destinations as they exist. An empty array renders no link row. */
  links: [] as ReadonlyArray<{ label: string; href: string }>,
  email: "hello@mikoshi.com",
  copyright: `© ${new Date().getFullYear()} MIKOSHI`,
} as const;
