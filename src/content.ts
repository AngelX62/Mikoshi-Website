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
 * What the instrument reads at the vision, where it draws two rules that
 * disagree.
 *
 * The vision's waypoint used to be a bare hairline with no scale and no word,
 * one of three stops where the instrument was present and idle. That was
 * survivable while the section argued transfer. It is not now, because the new
 * thesis *is* a gap: a machine that notices reality has stopped matching what
 * it expected. An expectation and a measurement that disagree is the oldest
 * thing an instrument draws, and this one already owns two rules.
 *
 * So the trailing rule, which everywhere else is a velocity lag that closes
 * when you stop scrolling, is held open here. This is the word on the gap.
 *
 * "Unexplained" over "Residual" or "Discrepancy" because the copy earns it
 * ("they fail without understanding why") and because it states a condition
 * the instrument is in rather than a capability MIKOSHI has, which is what
 * rule three of this file asks for. See lib/instrument.ts.
 */
export const fieldResidual = "Unexplained";

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
 * Five cells sitting under the five verbs of `vision.loop`, which is why the
 * closing row needs the words separately.
 *
 * **It no longer derives the heading, and that is a real loss.** It used to:
 * the section said one sentence twice, in display type at the top and in 11px
 * mono at the bottom, and holding one array was what stopped the two
 * occurrences drifting apart. The new vision closes on "Machines should not
 * only use what is known. They should discover what comes next.", which is
 * fourteen words across two sentences and cannot be five cells. So the long
 * form went to the last paragraph of `more` and this is its spine. The echo
 * survives; it moved from (display, mono) to (prose, mono).
 *
 * Five against five is therefore half found and half engineered, where the old
 * pair was wholly found. `loop` came out of the copy intact. This was
 * compressed to meet it. Do not add a sixth word.
 */
const BOOKEND = ["Machines", "discover", "what", "comes", "next."] as const;

/**
 * Where this goes, and the page's most ambitious claim.
 *
 * **The thesis changed here, and only here.** This section used to argue
 * transfer: proven work moves to a new body, and once enough of it accumulates
 * the intelligence starts inventing. It now argues discovery. A machine that
 * notices reality has stopped matching what it expected, proposes an
 * explanation, runs a safe test, and revises. Transfer is demoted to a proving
 * ground.
 *
 * Nothing above this section moved, and that is deliberate rather than
 * unfinished. The hero, the thesis, the method and the deployment sell what
 * ships, this says where it goes, and the copy below says so in its own words:
 * "We are beginning in software, on machines that already exist." A hero
 * rewritten to sell discovery would put a product on the page that does not
 * exist, which is rule three.
 *
 * **The section is an escalation.** `beats` walks from the failure to the
 * claim to what gets kept to the horizon. Vision.tsx sets each one larger and
 * brighter than the last, so the argument is legible as a shape before a word
 * of it is read. The order is load-bearing.
 *
 * **Most of the words here are not on screen by default**, and that is the
 * shape of the section rather than a compromise in it. `more` holds the
 * argument behind a control; what is always visible is the escalation itself,
 * because a reader who never opens the panel still has to learn what changed.
 *
 * **The guardrails live in the panel and not in a beat.** Bounded tests inside
 * limits people set, and handing back what the machine cannot resolve, are the
 * sentences that stop a plant manager closing the tab on "the machine runs its
 * own experiments". They were considered for beat 3 and lost to it, because
 * there are only four beats and each one is carrying an argument. They read in
 * full in paragraph 4 instead.
 *
 * **The draft's modal verbs are the thing this pass mostly fixed.** It carried
 * its entire future tense on nine "should" and five "could", which is how a
 * specification of intent sounds rather than an ambition. Five and four
 * survive, only where they are load-bearing: design commitments in paragraphs
 * 3, 5 and 14, honest speculation about machines nobody has built in 10 and 11.
 * The rest went to the present tense, which is also the truthful tense for
 * "MIKOSHI is building".
 *
 * Also fixed: "the next frontier of physical intelligence is discovery" was
 * deck language and is now "What is missing is not more data. It is
 * discovery."; "demonstrations, instructions, and large amounts of data" was a
 * three-item inventory and is now "from being shown and from data"; "an opaque
 * behavior" is now "a policy nobody can read", which is already this site's
 * vocabulary and sidesteps a spelling fork the file cannot currently settle,
 * since visible copy mixes "judgment" with "licence".
 *
 * Two comma series survive on purpose, both sequences carried by verbs rather
 * than inventories: the discovery cycle in paragraph 3, which is the sentence
 * `loop` is drawn from, and "bodies, sites and generations" in 11, which
 * escalates and has to land on its last item.
 *
 * **"Physical synthesis intelligence" is dropped.** It appeared exactly once on
 * the site, in this prose, so nothing depended on it. Losing a coined category
 * name is a real cost and it is paid on purpose: discovery is the
 * differentiator now, and taking a position inside physical intelligence is a
 * stronger move than naming a category of one.
 *
 * "Work Engram" on first use, "Engram" after, so the site keeps one name for
 * the artifact and method step 02 stays the place it is defined.
 *
 * Paragraph 13 keeps "Humanity learned to build", which is the only surviving
 * thread from the retired bookend and most of the reason this still reads as
 * the same page.
 */
export const vision = {
  label: "Vision",
  bookend: BOOKEND,
  /**
   * Three hand-set lines, and no longer derived from `BOOKEND`. See the note
   * there for why the two came apart.
   *
   * The break falls after "discover" and after "world". The obvious
   * alternative, "Machines that can / discover how the / physical world
   * works.", sets more comfortably at the 4.75rem cap but leaves "the" hanging
   * at the end of a line, away from the "physical world" it belongs to. A
   * single word landing on the last line is the stronger setting anyway, and
   * "works." is the verb the whole sentence is about.
   */
  heading: ["Machines that can discover", "how the physical world", "works."],
  /**
   * Four beats: the failure, the claim, what gets kept, the horizon.
   *
   * Left as plain sentences with no hand-set breaks. These are beats, not
   * headings, and at the sizes Vision.tsx gives them each one sets on a single
   * line inside a 672px column, so a break would be a decision the measure has
   * already made.
   *
   * The fourth stops short of "and learns what comes next", which is where the
   * sentence it comes from goes. The mono row says it four lines later, and
   * saying it twice inside one viewport would spend the bookend early.
   */
  beats: [
    "A robot that meets something it was not taught fails without knowing why.",
    "MIKOSHI is building machines that investigate instead.",
    "What one machine works out is kept with its evidence.",
    "Then they find the edge of what is known.",
  ],
  more: {
    /** On the control; the open state swaps to `close`. */
    cta: "Read the full vision",
    close: "Close the full vision",
    /** Named for assistive tech, which gets no dashed rule to read. */
    label: "The full vision",
    paragraphs: [
      "Robots today can do remarkable work. They learn from being shown and from data. But they only know the conditions they were taught, and when reality steps outside those conditions they fail without understanding why.",
      "What is missing is not more data. It is discovery.",
      "MIKOSHI is building intelligence that learns directly from reality. It should notice when the world stops matching what it expected, propose an explanation, choose a safe test, and revise what it believes from the result.",
      "This is not blind trial and error. Every action answers a question, and the machine knows what its evidence will support. When uncertainty runs too high it stops and hands the work to a person.",
      "What a machine discovers should not vanish inside a model or stay locked in one body. MIKOSHI keeps what it was trying to do and why the result came out right. It keeps the evidence too, and the conditions under which the discovery still holds.",
      "We call that a Work Engram. It lets another capable machine begin with tested knowledge instead of a policy nobody can read.",
      "We are beginning in software, on machines that already exist. The first proving ground is CNC machine tending.",
      "Moving proven work into a different cell forces engineers to rediscover which differences matter. MIKOSHI aims to let the machine work that out for itself. It runs bounded tests inside limits that people set, and produces the evidence the cell needs to be qualified.",
      "That is a narrow proving ground for a much larger idea.",
      "An industrial arm could work out how an unfamiliar cell behaves. A mobile robot could relearn a site after it changes. A future MIKOSHI humanoid could walk into a place nobody scripted for it and still be useful.",
      "Every machine could start from what the ones before it proved, then push past that through its own experience. Physical understanding would grow across bodies, sites and generations, without hiding what is known or where it may fail.",
      "The destination is physical intelligence that does more than execute the past. It finds the edge of what is known, and learns what comes next.",
      "Humanity learned to build by discovering how the physical world works. MIKOSHI is building machines that can join that process.",
      "Machines should not only use what is known. They should discover what comes next.",
    ],
  },
  /**
   * The discovery cycle, and the reason the closing pair still works:
   * `BOOKEND` is five words, so the two rows align cell for cell. Changing the
   * length of either list breaks the other.
   *
   * These five were found in the copy rather than invented for the row. They
   * are paragraph 3 read as steps, plus what paragraph 5 does with the result:
   * notice the mismatch, propose an explanation, choose a safe test, revise
   * from the result, keep it with its evidence.
   *
   * The five they replace were Perceive, Understand, Imagine, Execute,
   * Improve, which is a generic autonomy loop. It was true of the old thesis
   * and says nothing about testing or evidence, which is what this section is
   * now about.
   */
  loop: ["Notice", "Explain", "Test", "Revise", "Keep"],
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
 * **Every line here comes from what MIKOSHI already decided**, and nothing is
 * extrapolated from it. An earlier pass left out where the work runs and what
 * happens at the end of an engagement, because the rights table did not cover
 * them and an implication is not a term. Both are now answered and both are
 * here, which is why this block is the length it is: each sentence retires one
 * specific reason a plant closes the tab.
 *
 * **The opening claim was cut.** It read "Your work remains yours. MIKOSHI
 * gives it continuity.", which is true and is what the first row of the record
 * says four words later. `promise` is the sharper version of the same thought
 * and it earns the closing position; two statements of one idea in one block is
 * the thing rule one exists to stop.
 *
 * Left out on purpose: the six-layer rights breakdown, and the split into a
 * perpetual Run Right and a recurring Continuity Service. The first belongs in
 * a contract. The second is a pricing structure and would double this block to
 * answer a question nobody has asked yet at this point in the page; `promise`
 * already carries its shape, which is what a reader needs here.
 *
 * The kill-switch line is deliberately scoped to a commercial dispute rather
 * than stated absolutely, because narrowly pre-agreed safety exceptions do
 * exist. "There is no kill switch" would have been the stronger sentence and
 * the false one.
 */
export const ownership = {
  label: "Ownership",
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
  /**
   * Three answers in one paragraph: where it runs, what MIKOSHI may do with it,
   * and whether the line can be stopped from outside. Every clause is a fear
   * somebody already has before they reach this section.
   */
  terms:
    "The Engram executes locally, on the cell or edge system you control, and cloud connectivity is optional. MIKOSHI takes only the licence it needs to host, adapt and run it, and does not train anyone else's systems on it unless you opt in. There is no kill switch for a commercial dispute.",
  /** MIKOSHI's own words, and the best sentence in the brief. */
  promise:
    "When the engagement ends, improvement may stop. Proven work does not.",
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
