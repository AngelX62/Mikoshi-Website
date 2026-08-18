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
 *
 * ── THE SITE UNDER THIS FILE CHANGED SHAPE ───────────────────────────────────
 * It was one page of about 8.7 screens with a canvas dither field behind it, a
 * scroll-driven instrument overlay annotating that field, and 2520px of pinned
 * scroll inside the method alone. It is now five static routes with no canvas
 * and no scroll choreography.
 *
 * The words survived intact. What went are the strings that existed only to
 * label the canvas: `fieldReadout`, `fieldMeasure`, `fieldResidual` and
 * `photograph`, all four of which named something the reader can no longer see.
 * `hero.scrollCue` went with them, because home no longer scrolls.
 *
 * Two things are new, and both are chrome rather than prose: `nav`, and the
 * `sheet` line on each method step. Chrome is still words, so it lives here.
 * ─────────────────────────────────────────────────────────────────────────────
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

/**
 * The four destinations, in the order a stranger should meet them.
 *
 * Home is deliberately absent: the wordmark in the header goes there, which is
 * the convention every visitor already knows, and a nav that lists the page you
 * are looking at is a nav with one wasted item.
 *
 * Ownership has no entry of its own. It sits under Deployment because it exists
 * to retire the objection that page raises, and read on its own it is a
 * footnote looking for the argument it belongs to.
 */
export const nav = [
  { label: "Technology", href: "/technology" },
  { label: "Deployment", href: "/deployment" },
  { label: "Vision", href: "/vision" },
  { label: "Contact", href: "/contact" },
] as const;

export const hero = {
  /**
   * The page's h1, and set in type rather than drawn.
   *
   * It used to be rasterised into the dither field at weight 600 and mirrored
   * into a visually hidden heading for anything that could not see a canvas.
   * There is no canvas now, so the heading is simply the heading.
   */
  wordmark: "MIKOSHI",
  /**
   * Three beats, not a sentence with a clause hung off the end.
   *
   * Held as three strings rather than as one, which is what the docblock here
   * always claimed it was. It used to be a single line that a measure broke
   * wherever the measure happened to land, so the beats were an intention in a
   * comment rather than a fact on the page. Home sets them centred, one per
   * line, which is the only setting that makes the descriptor read the way it
   * is written.
   */
  descriptor: [
    "Proven work in.",
    "Qualified capability out.",
    "On any compatible machine.",
  ],
  /** Small mono label above the wordmark. */
  eyebrow: "Physical Intelligence",
} as const;
// Home's one action reuses `waitlist.cta` rather than declaring its own. It is
// the same words for the same reason, and the link it sits on leads to the
// button it is quoting. Two copies would eventually stop agreeing.

/**
 * The thesis, which opens Technology.
 *
 * Two sentences that flow, then the claim they earn.
 *
 * **The lines are hand-set and stay hand-set**, though the reason changed. They
 * were short because each one sat inside a mask that clipped overflow, so a
 * line long enough to wrap broke the wipe. The mask is gone. They are kept
 * because seven short lines set at display size is a shape, and letting a
 * measure rewrap them would flatten the one piece of copy on the site that is
 * doing its work typographically. Roughly thirty characters is still the
 * ceiling.
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
 * `readout` used to be the label the canvas instrumentation showed during that
 * shot. There is no canvas, and the name survives because it turned out to be
 * the better name: one word for what the step does, which is exactly what the
 * annotation strip above each band needs on its left.
 *
 * `sheet` is the same position said again in words, on the strip's right. It is
 * borrowed wholesale from the reference frame that reads `A/ ●● 1` at one end
 * and `LETTER "A" FORWARD SLASH ZERO ZERO ONE` at the other: a technical
 * caption that states its own identifier twice, once as a symbol and once
 * spelled out. Redundant on purpose. It is also the only thing on the page that
 * tells a reader deep in step three how many steps are left.
 */
export const method = {
  label: "Method",
  steps: [
    {
      index: "01",
      readout: "Observe",
      sheet: "Sheet one of four",
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
      sheet: "Sheet two of four",
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
      sheet: "Sheet three of four",
      title: "Rebuild the work in another body",
      body: "Nothing is emulated. The new machine runs programs written for the body it actually has.",
      inputs: ["Different robot", "Different machine", "Humanoid"],
    },
    {
      index: "04",
      readout: "Qualify",
      sheet: "Sheet four of four",
      title: "Prove it physically",
      body: "Working in simulation is not working. The cell is done when it makes good parts.",
      inputs: ["Production outcome", "Acceptance criteria"],
    },
  ],
} as const;

/*
 * `fieldReadout`, `fieldMeasure`, `fieldResidual` and `photograph` were here.
 *
 * All four named something drawn on a canvas: which body the field was holding
 * during each method shot, what the caliper read at the qualifying shot, the
 * word on the gap the two rules held open under the vision, and a photograph
 * sampled through the dither grid. There is no canvas, so all four named
 * something the reader cannot see, which is worse than saying nothing.
 *
 * The site now has no imagery at all. If a real photograph of a cell ever
 * arrives, it goes in as a photograph rather than as a channel behind copy.
 */

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
    /** Names the band the diagram sits in, on its annotation strip. */
    label: "The commercial shape",
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
 * occurrences drifting apart. The new vision closes on "Machines will not
 * only use what is known. They will discover what comes next.", which is
 * fourteen words across two sentences and cannot be five cells. So the long
 * form went to the last paragraph of `more` and this is its spine. The echo
 * survives; it moved from (display, mono) to (prose, mono).
 *
 * Five against five is therefore half found and half engineered, where the old
 * pair was wholly found. `loop` came out of the copy intact. This was
 * compressed to meet it. Do not add a sixth word.
 *
 * **The grid used to be stronger than the sentence it compressed**, which is
 * an odd thing for a compression to be. This row has always read in the plain
 * present, and the paragraph behind it said "should" twice, so the five mono
 * words made a claim the prose would not. The prose says "will" now and the
 * two agree: a prediction and its spine.
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
 * **The words are all on screen now.** They used to hide: `statement` was
 * called `more` and sat behind a disclosure control, because the section was
 * one stop on a single long scroll and fourteen paragraphs dropped into that
 * scroll would have buried the two sections after it. Vision is its own route,
 * so the argument is simply the page, and a control that opens a panel on a
 * page whose entire job is that panel would be furniture. The escalation above
 * it still does its work: `beats` is the argument legible as a shape before a
 * word of it is read.
 *
 * **The guardrails live in the statement and not in a beat.** Bounded tests inside
 * limits people set, and handing back what the machine cannot resolve, are the
 * sentences that stop a plant manager closing the tab on "the machine runs its
 * own experiments". They were considered for beat 3 and lost to it, because
 * there are only four beats and each one is carrying an argument. They read in
 * full in paragraph 4 instead.
 *
 * **The modal verbs took two passes and the second one mattered more.** The
 * draft carried its entire future tense on nine "should" and five "could",
 * which is how a specification of intent sounds rather than an ambition. The
 * first pass got that to five and four and left them where they read as
 * load-bearing. Counted afterwards, twelve hedges remained in 445 words, and
 * the count was never the problem: they clustered on the three places the
 * section could least afford them.
 *
 * The **definition** said "It should notice when the world stops matching what
 * it expected", which is the thesis sentence of the whole section hedged into
 * either an unmet spec or a moral opinion. The **product** said "MIKOSHI aims
 * to let the machine work that out for itself", the weakest verb in the
 * document sitting in the paragraph about the thing being built. The **closer**
 * said "Machines should not only use what is known", moralising where it should
 * predict.
 *
 * All three are present or future tense now. Two hedges survive, both inside
 * paragraph 11 and both honest: "would grow" frames speculation about machines
 * nobody has built, and "where it may fail" is about the limits of knowledge,
 * which is the section's entire subject.
 *
 * That paragraph briefly opened "The aim is", which read better on its own and
 * worse in place: paragraph 12 opens "The destination is", and two goal nouns
 * in consecutive paragraphs is the section stating its ambition twice and
 * landing neither. The conditional went back onto the claim it belongs on.
 *
 * **The humanoid is long-term roadmap, so it gets stated rather than hinted.**
 *
 * It read "A future MIKOSHI humanoid could walk into a place nobody scripted
 * for it and still be useful", buried third in a list of three and guarded
 * twice over by "future" and "could". That is how vapourware reads, and it sat
 * four sentences after "We are beginning in software, on machines that already
 * exist", spending the credibility that line had just earned. It was briefly
 * cut altogether on the theory that an unearned humanoid costs more than it
 * pays, which was the right call about that sentence and the wrong one about
 * the plan.
 *
 * The rule it broke: **hedge the timing, never the intent.** "Could" hedges
 * whether MIKOSHI means it. "Further out" hedges only when, which is honest
 * and costs nothing, because a roadmap item nobody has built is allowed to be
 * far away and is not allowed to be vague about whether it is wanted.
 *
 * It also has its own paragraph now instead of a slot in a list, and it argues
 * rather than boasts: a humanoid is the body nobody can script for, which
 * makes it the body that most needs the thing this whole section is about.
 * That turns the most expensive claim on the page into evidence for the
 * thesis. And it is no longer the site's coyest mention of a humanoid, which
 * was odd while method step 03 listed "Humanoid" as a flat chip.
 *
 * **MIKOSHI builds that humanoid, rather than shipping software onto
 * somebody else's.** This is the one place the site says the company will make
 * hardware, and it is a genuinely larger claim than anything else on it:
 * everything above sells software for machines that already exist, down to
 * "On any compatible machine" in the hero and "hardware the plant already
 * owns" in the deployment. Nothing there becomes false. The arc was always
 * sequenced, and paragraph 7 says so out loud with the word "beginning".
 *
 * **The order is the argument, and it is the only reason this sentence is
 * worth writing.** Every robotics company says it will build a humanoid, so
 * saying it buys nothing. Saying it comes *last* buys a great deal, because
 * the usual sequence is the opposite: build the body, then hope the
 * intelligence arrives to run it. MIKOSHI's whole thesis is that intelligence
 * is what transfers across bodies, so a body is the thing you earn once the
 * intelligence exists rather than the thing you start with. Stated that way
 * the claim stops being a me-too ambition and becomes a position.
 *
 * The paragraph after it carries that argument and should not be cut to save
 * room. Without it this is just another humanoid announcement.
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
   * **The fourth used to read "Then they find the edge of what is known."**
   * It was the weakest line in the section and Vision.tsx sets it largest, so
   * the escalation peaked on its softest claim: three concrete beats resolving
   * into an abstraction, hung off "Then they", which is dead connective tissue.
   *
   * It carries the compounding claim now, which is the actual horizon and the
   * consequence of beat three rather than a restatement of it. Kept, then
   * inherited. It also stops the beats echoing "the edge of what is known",
   * which the statement's own closing paragraph says better and now owns
   * alone.
   */
  beats: [
    "A robot that meets something it was not taught fails without knowing why.",
    "MIKOSHI is building machines that investigate instead.",
    "What one machine works out is kept with its evidence.",
    "Every machine after it starts from there.",
  ],
  statement: {
    /**
     * The heading over the prose.
     *
     * It was the accessible name of a disclosure panel, read only by assistive
     * tech because sighted readers got a dashed rule instead. On its own route
     * it is simply a heading, and every reader gets it.
     */
    label: "The full vision",
    paragraphs: [
      "Robots today can do remarkable work. They learn from being shown and from data. But they only know the conditions they were taught, and when reality steps outside those conditions they fail without understanding why.",
      "What is missing is not more data. It is discovery.",
      "MIKOSHI is building intelligence that learns directly from reality. It notices when the world stops matching what it expected, proposes an explanation, chooses a safe test, and revises what it believes from the result.",
      "This is not blind trial and error. Every action answers a question, and the machine knows what its evidence will support. When uncertainty runs too high it stops and hands the work to a person.",
      "Today what a machine discovers vanishes inside a model or stays locked in the one body that learned it. MIKOSHI keeps what it was trying to do and why the result came out right. It keeps the evidence too, and the conditions under which the discovery still holds.",
      "We call that a Work Engram. It lets another capable machine begin with tested knowledge instead of a policy nobody can read.",
      "We are beginning in software, on machines that already exist. The first proving ground is CNC machine tending.",
      "Moving proven work into a different cell forces engineers to rediscover which differences matter. MIKOSHI puts that work on the machine. It runs bounded tests inside limits that people set, and produces the evidence the cell needs to be qualified.",
      "That is a narrow proving ground for a much larger idea.",
      "The same intelligence belongs in an industrial arm working out how an unfamiliar cell behaves, and in a mobile robot relearning a site after it changes.",
      "Further out, MIKOSHI builds the body too. Nobody can script for something as general as a humanoid, which is exactly why it needs a machine that works things out for itself.",
      "It comes last, and the order is deliberate. A humanoid built before the intelligence exists is a body waiting for a program nobody can write.",
      "Then each machine starts from what the ones before it proved and pushes past that through its own experience. Physical understanding would grow across bodies, sites and generations, without hiding what is known or where it may fail.",
      "The destination is physical intelligence that does more than execute the past. It finds the edge of what is known, and learns what comes next.",
      "Humanity learned to build by discovering how the physical world works. MIKOSHI is building machines that can join that process.",
      "Machines will not only use what is known. They will discover what comes next.",
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
  /**
   * Names the band the loop sits in, on its annotation strip.
   *
   * The strip briefly carried the five verbs themselves, joined by middots,
   * which was wrong twice over. It broke rule one of this file, since the grid
   * four lines below it lists exactly those five words and a strip that lists
   * them too makes the band say everything twice. And at 390 it was 359px of
   * unwrappable tracked mono inside a 327px box, so it pushed the whole
   * document sideways.
   *
   * This is what the copy calls the five steps in its own docblock above.
   */
  loopLabel: "The discovery cycle",
} as const;

/**
 * Who owns what, and the objection it exists to remove.
 *
 * Method step 01 says out loud that MIKOSHI takes robot programs, PLC and CNC
 * states, sensor signals, operator corrections and production results. That is
 * the most sensitive data a plant has, and until now the site named the
 * ingestion and said nothing about the terms, which leaves the reader to assume
 * the worst in the gap. For a site whose job is winning design partners, that
 * gap was the most expensive thing on it.
 *
 * **It sits under Deployment rather than on a route of its own.** It answers
 * the question that page raises, in the order a reader raises it: here is the
 * first product, here is who runs it and who pays, and here is what happens to
 * your data. Given its own URL it reads as a footnote hunting for the argument
 * it belongs to. The cost is that nobody can be sent straight to it, which is
 * a real cost and is worth revisiting the first time somebody asks.
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

/**
 * The one thing the site asks anybody to do, and now a route of its own.
 *
 * `body` asks a question, so the form has somewhere to answer it. It used to
 * say "tell us about the cell" above a single email input, which is an
 * invitation with no way to accept. The cell line is optional: requiring it
 * would trade the lead for the detail, and at this volume a bare address is
 * still worth having.
 *
 * `errorUnconfigured` exists because the transport can be absent. See
 * lib/waitlist.ts: with no endpoint the form says so and points at the address
 * in the footer, rather than thanking somebody for something that did not
 * happen. That behaviour is load-bearing and survived the rebuild untouched.
 */
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

/**
 * The colophon.
 *
 * Laid out as tiny centred label-over-value pairs, which is lifted from the
 * credit block on the JUNDOR sheet: a short caps label in the faintest ink with
 * its value directly under it, the whole group centred and given far more air
 * than its size suggests it deserves.
 *
 * It carries no link row of its own. The header's nav is repeated here instead,
 * from `nav` above, because Vision runs to about three screens and a reader at
 * the bottom of it should not have to travel back up to leave. One list, two
 * places, no chance of the two drifting apart.
 */
export const footer = {
  email: "hello@mikoshi.com",
  copyright: `© ${new Date().getFullYear()} MIKOSHI`,
  /** The colophon's own labels. Values come from `site` and from `nav`. */
  labels: {
    company: "Company",
    discipline: "Discipline",
    contact: "Contact",
  },
} as const;
