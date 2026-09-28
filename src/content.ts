/**
 * Every word on the site lives here.
 *
 * Three rules govern this file.
 *
 * **Prose does not enumerate.** When a sentence lists what a list beside it
 * already lists, the page says everything twice and every paragraph reads as an
 * inventory. A sentence earns its place by saying something a list cannot: why
 * the step is hard, what it costs, what would go wrong.
 *
 * **No em dashes.** They are the loudest tell of machine-written copy, and
 * anything selling judgement about research cannot afford to read as generated.
 * Restructure with a period or a comma instead.
 *
 * **Nothing invented.** Every claim below traces to the research direction brief,
 * and that rule is stricter here than it has ever been. See the note under
 * `site.description`.
 *
 * ── THE COMPANY PIVOTED, AND THIS FILE TURNED OVER COMPLETELY ────────────────
 * It used to be MIKOSHI: physical AI, a robot changing its body, tool, sensor or
 * contact so that the difference became an experiment, with CNC machine tending
 * as the first proving ground. Every word of that is gone.
 *
 * Afterscale is **training-efficient intelligence**: more capability per unit of
 * the computation used to train a model. The first question is whether the value
 * of what a model should learn next can be estimated cheaply enough to be worth
 * using. Nothing physical, no robots, no cells.
 *
 * What the old file held and what replaced it:
 *
 *   `research.engram`    Work Engrams, the record a physical finding produced.
 *                        Replaced by `research.priorArt`, which names the four
 *                        pieces of work any contribution here has to beat.
 *   `firstProof`         one CNC job across two cells. Replaced by `evidence`,
 *                        which is the same idea (a test the company could lose)
 *                        aimed at a training run instead of a workcell.
 *   `ownership`          customer control of production data. Afterscale has no
 *                        customers and no deployment. Replaced by `standing`,
 *                        the record of what is decided against what is open.
 *
 * ── WHAT THIS SITE MUST NOT CLAIM ────────────────────────────────────────────
 * The brief is scrupulous about its own limits and the site must not quietly
 * upgrade any of them. All four are live traps for a future edit:
 *
 *   Lower training cost does **not** establish lower inference cost, and does
 *   not establish lower total industry electricity use. Those are separate
 *   measurements nobody here has taken.
 *
 *   This is **not** a claim that scaling has stopped working, and **not** a
 *   commitment to small models.
 *
 *   The learning-value estimate is a **question**, not a mechanism. The signal
 *   itself has still to be designed.
 *
 *   NVIDIA and OpenAI appear in the brief as collaboration ambitions with an
 *   explicit disclaimer attached. They are deliberately absent from the site:
 *   naming two labs you would like to work with reads as borrowed credibility
 *   however carefully it is hedged. Put them back only alongside a relationship
 *   that exists.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// The one word this file does not own. See `hero.wordmark`.
import { WORDMARK } from "@/lib/logo";

/** The research direction, used in the browser title on every route. */
const SITE_TAGLINE = "Models that learn more from the compute they are given.";

/**
 * Where the site is actually served from.
 *
 * Read from the environment, in the order the answer is most likely to be right:
 *
 *   NEXT_PUBLIC_SITE_URL              a real domain, once there is one.
 *   NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL   the production alias.
 *   NEXT_PUBLIC_VERCEL_URL            this one deployment, no scheme.
 *   localhost                         dev, so relative metadata still resolves.
 *
 * ── THE PRODUCTION ALIAS HAD TO GO IN FRONT, AND ITS ABSENCE WAS A REAL BUG ──
 * This used to fall straight from the explicit domain to `VERCEL_URL`, with a
 * note claiming that gave "a preview build advertises itself and a production
 * build advertises itself". Half right. `VERCEL_URL` is the **immutable
 * per-deployment hostname**, `project-hash-team.vercel.app`, and it is that on
 * production deployments too, not the alias people actually visit.
 *
 * So without `NEXT_PUBLIC_SITE_URL` set, a production deploy would publish every
 * canonical, every `og:url`, every sitemap `<loc>` and the og:image URL on a
 * hostname that changes with each push. Vercel exposes
 * `VERCEL_PROJECT_PRODUCTION_URL` for exactly this, and it stays empty on
 * preview deployments, so the per-deployment fallback still does its job there.
 *
 * **The `NEXT_PUBLIC_` prefix is required on both.** These are read while
 * rendering pages that are also client-bundled, so Vercel's unprefixed system
 * variables are not visible here.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const alias = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (alias) return `https://${alias}`;

  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  /**
   * ── THE CHAIN ENDED HERE UNGUARDED, AND THAT IS A SILENT PRODUCTION BUG ────
   * Every fallback above is a `NEXT_PUBLIC_` variable, and Vercel only provides
   * those when **"Automatically expose System Environment Variables"** is on in
   * the project's settings. It is a checkbox, and it can be off.
   *
   * With it off and no domain set, all three branches miss and a production
   * deploy publishes `http://localhost:3000` as every canonical, every
   * `og:url`, the `og:image` URL and all five sitemap `<loc>`s. Nothing throws,
   * nothing warns, and the pages render perfectly. It would be found by somebody
   * pasting a link into Slack and watching the preview fail.
   *
   * On Vercel, localhost is never the right answer, so say so at build time.
   * `VERCEL` is set on every Vercel build and on no local one, which is what
   * keeps `pnpm build` on this machine working.
   */
  if (process.env.VERCEL) {
    throw new Error(
      "site.url fell through to localhost on Vercel. Set NEXT_PUBLIC_SITE_URL, " +
        'or turn on "Automatically expose System Environment Variables" in the ' +
        "project settings so NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is set.",
    );
  }

  return "http://localhost:3000";
}

export const site = {
  name: "Afterscale",
  tagline: SITE_TAGLINE,
  /**
   * The meta and OpenGraph description, so this is what a search result and a
   * shared link say in prose.
   *
   * It follows `hero`: what the company studies, then the first question. Note
   * what it does not say. It does not promise cheaper inference, lower energy
   * use, or that scaling has stopped paying. A search result is the one place a
   * claim travels without its caveats attached, so the claim itself has to be
   * the modest one.
   */
  description:
    "Afterscale is an AI research company studying how training can make better use of the data a model already has, so that a model gains more capability from the computation used to train it. Our first question is whether the value of what a model learns next can be estimated cheaply.",
  /** See `resolveSiteUrl`. Set NEXT_PUBLIC_SITE_URL once you have a domain. */
  url: resolveSiteUrl(),
} as const;

/**
 * The four destinations, in the order a stranger should meet them.
 *
 * Why it matters, then what the question is, then what would count as an answer,
 * then how to argue with it.
 *
 * **Two routes were renamed with the pivot.** `/technology` became `/research`,
 * because the page describes an open question rather than a technology anybody
 * has. `/first-proof` became `/evidence`, because "first proof" promises a proof
 * and the page is a description of what would have to be true for one to exist.
 * Nothing was deployed under the old paths, so no inbound link breaks.
 *
 * Home is deliberately absent: the wordmark in the header goes there, which is
 * the convention every visitor already knows.
 *
 * One array, four consumers: Header.tsx, Footer.tsx, sitemap.ts and sheet.ts.
 * Reordering here reorders all four and renumbers every annotation strip, and
 * Header matches the active route with `startsWith` rather than by index, so
 * nothing depends on the position.
 */
export const nav = [
  { label: "Vision", href: "/vision" },
  { label: "Research", href: "/research" },
  { label: "Evidence", href: "/evidence" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * Home.
 *
 * `headline` names the ambition in ordinary language. `paragraphs` say what the
 * company studies and what the first question is. The opening uses the first
 * paragraph; the research introduction uses the second and the status line.
 *
 * **Two actions, and they are ranked by what they ask for.** "See the research
 * question" costs a reader nothing and goes to /research. "Challenge the method"
 * asks for a conversation and goes to /contact, whose heading is the same words.
 */
export const hero = {
  /**
   * The page's h1, as text.
   *
   * The lockup is drawn rather than set, which is why this is not a literal. The
   * geometry lives in lib/logo.ts so the header, the footer and this heading
   * cannot draw the same logo three different ways. This string is what is left
   * for the places that need the name as *text*: the two `aria-label`s and the
   * `sr-only` span that gives home's `h1` an accessible name.
   */
  wordmark: WORDMARK,
  /**
   * The claim, set at display size under the lockup.
   *
   * The north star stated plainly. It is an ought rather than a can: the company
   * has not shown that it is achievable, and the sentence is careful not to say
   * it has.
   */
  headline: "AI should learn more from the compute it is given.",
  headlineLines: ["AI should", "learn more", "from the compute", "it is given."],
  introduction:
    "We study how training can make better use of the data a model already has. The aim is more capability from the same computation.",
  /**
   * The hero's margin bracket.
   *
   * **It said "Research in formation. Not yet demonstrated." and `status` below
   * says "Not yet demonstrated."** Both render on home, about 200px apart, both
   * wearing a rose bracket, both visible in one screen. Saying it twice is how a
   * colour with one meaning stops having one: the second bracket teaches a
   * reader that rose is decoration.
   *
   * They divide the job now. This one says where the company is; `status` marks
   * the specific claim that is not yet demonstrated, next to the question it
   * belongs to. Keep them saying different things.
   */
  stage: "Research in formation.",
  researchLabel: "The first question",
  pauseMotion: "Pause motion",
  resumeMotion: "Resume motion",
  /**
   * Two paragraphs: what the company studies, then the question underneath it.
   * `research` is where the question is stated properly and `evidence` is where
   * it becomes falsifiable.
   */
  paragraphs: [
    "Afterscale is an AI research company studying how training can make better use of the data a model already has. The aim is more capability from the same computation.",
    "Our first question is whether the value of what a model learns next can be estimated cheaply enough to be worth using. The signal itself has still to be designed.",
  ],
  /**
   * The stage, in one line of chrome.
   *
   * Set in tracked mono caps rather than as prose, because it is a caption
   * stating a fact about the project rather than part of the argument. It is
   * also the site's one statement of stage, and it takes the margin bracket: the
   * rose marks what is under test, and a research programme's own statement that
   * it has demonstrated nothing is that, exactly and literally.
   */
  status: "Not yet demonstrated.",
  /*
   * `scrollCue` was here, reading "Explore the research". It pointed at a link
   * on the bottom edge of the old title card, and the card it belonged to is
   * gone. Nothing consumed it. `updates.scrollCue` is a different string and is
   * still in use.
   */
  /** Goes to /research, where the question is stated. */
  ctaResearch: "See the research question",
  /** Goes to /contact, whose heading is these exact words. */
  ctaPartner: "Challenge the method",
  /**
   * The small mono label above the wordmark, and in the colophon under
   * "Discipline".
   *
   * **Check any replacement against existing companies before using it.** The
   * previous label was "Physical Intelligence", which is a robot foundation
   * model company's actual name, and set in tracked caps directly above a
   * wordmark it read as a parent brand rather than as a field. "Training
   * Efficiency" describes what this company works on and belongs to nobody.
   *
   * **It is baked into the preview card.** src/app/opengraph-image.png is a
   * screenshot of the title card, so changing this string means recapturing it.
   * The recipe is in the metadata docblock in layout.tsx.
   */
  eyebrow: "Training Efficiency",
} as const;

/**
 * What is decided and what is open, as a record.
 *
 * ── THIS IS THE MOST UNUSUAL THING ON THE SITE AND IT IS DELIBERATE ──────────
 * It prints, as six ruled cells, the list of things this company has **not**
 * decided. Two are settled and four are not. (A ruled table until 2026-09-28;
 * see `.cells` in globals.css.)
 *
 * **It has its own band on home now, directly under the hero**, and it used to
 * be the right-hand column of the research band: 13px mono, below the fold,
 * composed exactly like the spec table on any product site. The site's rare
 * sentences were all set smaller than its ordinary ones, which is the hierarchy
 * upside down, and this block was the clearest case of it.
 *
 * Almost no company site does this, and the reason to do it is not modesty. A
 * research company with no results has exactly one asset a reader can check,
 * which is whether it is honest about its own position. A page that claims
 * little and lists what it does not know is checkable. A page that claims a lot
 * is not, and every reader of AI company sites already knows that.
 *
 * **Every value has to stay true.** This is the one block on the site that goes
 * stale by being right for too long: the moment a dataset is chosen or a budget
 * is set, the row is a lie. Update it or delete it, never leave it.
 *
 * `value` is set in mono, because each one is a decision or the absence of one
 * rather than prose. See the note on the second mono register in globals.css.
 *
 * ── THE FIGURE ABOVE THE TABLE IS COUNTED, NEVER TYPED ───────────────────────
 * Home sets `4/6` at heading size beside `openLabel`. Both numbers are counted
 * from `rows` at render, so the display cannot disagree with the cells under it
 * and the day a dataset is chosen the figure moves itself. **Do not replace it
 * with a literal**, which is the one edit that would turn a self-maintaining
 * fact into a stale one.
 */
export const standing = {
  label: "Decided and open",
  /** Beside the counted figure on home. Lower case: it is a caption to a number,
      not a sentence. */
  openLabel: "decisions still open",
  rows: [
    { item: "Direction", value: "Training-efficient intelligence", open: false },
    { item: "Working name", value: "Afterscale", open: false },
    { item: "Mechanism", value: "Not yet designed", open: true },
    { item: "Dataset", value: "Not chosen", open: true },
    { item: "Model sizes", value: "100M to 1B proposed", open: true },
    { item: "Compute budget", value: "Not set", open: true },
  ],
} as const;

/**
 * Home's row of the other pages: Vision, Evidence and Contact.
 *
 * **The label is the only new copy in it.** Each cell is that page's own
 * heading over its own `metaDescription` (or, for Contact, `waitlist.body`), so
 * the row cannot drift from the pages it points at. See the note in page.tsx
 * for why Research is not one of the three.
 */
export const routes = {
  label: "Read further",
} as const;

/**
 * Research: the question, and the work it has to improve on.
 *
 * ── THE HEADING IS A QUESTION, WHICH IS THE WHOLE POSITION ───────────────────
 * The previous version of this route led with a named method set at display
 * size, on the argument that a term introduced in a paragraph is a term nobody
 * remembers. That was right for a company that had a method.
 *
 * This one does not. The brief says so twice: "this is the first candidate
 * problem, not a proven mechanism" and "the signal itself remains to be
 * designed". So the largest type on the page is the question rather than an
 * answer, and naming a method here would be the single most dishonest thing the
 * site could do.
 */
export const research = {
  label: "Research",
  heading: "What should a model learn next?",
  /**
   * Four paragraphs: the problem, what we want, the failure we expect, and the
   * bar a contribution would have to clear.
   */
  paragraphs: [
    "A model can be given more data without learning more from it. The useful question is which of that data is worth the compute it would take to learn.",
    "We want to estimate that value cheaply, then use the estimate to improve the whole training run rather than one stage of it. The estimate has to stay useful as the model changes.",
    "The failure we expect to design around is a small or early model permanently rejecting material that a stronger version of itself could have learned from.",
    "A contribution would be an estimate that improves capability per unit of total training compute and survives a change of model size or data. We do not have one yet.",
  ],
  /**
   * The prior art, and the site's most credible section.
   *
   * ── NAMING WHAT YOU HAVE TO BEAT IS RARE AND IT IS THE POINT ─────────────
   * Four pieces of published work already do parts of this. A site that omitted
   * them would be read, correctly, as either ignorant of the field or hoping the
   * reader is. The brief concedes it outright: selecting data, changing its
   * order or using an existing optimizer is not by itself an invention.
   *
   * **The prose does not list the four**, because the row of cells under it
   * already does, which is rule one in this file. The sentences say the thing the record
   * cannot: that the comparison has to be fair, and that our own scoring cost
   * counts against us.
   */
  priorArt: {
    /** Also the band's h2, through `titled`. There was a `title` with the same
        words, rendered as a second heading under the strip; it is gone. */
    label: "What we must improve on",
    paragraphs: [
      "Selecting data, changing its order or using an existing optimizer is not by itself an invention. Each of these has been done, and done well.",
      "Anything we propose has to beat them on their own terms, with the cost of our own scoring, probing and teaching charged against us rather than left out of the comparison.",
    ],
    /**
     * Real papers, named exactly. The `note` is what each one establishes, in
     * the fewest words that stay accurate.
     *
     * Set in the mono data register. A citation is a reference rather than
     * prose, and the site now has a face for that.
     */
    citations: [
      {
        work: "Rho-1",
        authors: "Lin et al.",
        note: "Selects tokens using a reference model",
      },
      {
        work: "DataDecide",
        authors: "Magnusson et al.",
        note: "Predicts data choices from small experiments",
      },
      {
        work: "Curriculum Learning for LLM Pretraining",
        authors: "Elgaar and Amiri",
        note: "Effects stronger in small models than large",
      },
      {
        work: "Practical Efficiency of Muon for Pretraining",
        authors: "Essential AI",
        note: "A strong optimizer comparison",
      },
    ],
  },
  /**
   * The meta and OpenGraph description for this route.
   *
   * A named field rather than an index into `paragraphs`, which is the fix for a
   * real trap: a restructure is exactly the event that breaks such a reference
   * silently.
   */
  metaDescription:
    "Afterscale is researching whether the value of what a model learns next can be estimated cheaply, and used to improve a whole training run.",
} as const;

/**
 * Vision: why this problem is worth a company.
 *
 * **`heading` is three hand-set lines.** The break falls after "Powerful AI" and
 * after "within reach of", so the last line carries the point.
 *
 * The page's job is to say why training efficiency matters without overclaiming
 * what it delivers. `limits` exists for exactly that and is not optional: it is
 * the paragraph that keeps this page honest.
 */
export const vision = {
  label: "Vision",
  heading: ["Powerful AI", "within reach of", "far more people."],
  /**
   * Two paragraphs, and they point in opposite directions on purpose.
   *
   * The first is the access argument, which is the one people find sympathetic.
   * The second is the frontier argument, which is the one that makes it a real
   * research problem rather than a charitable one. A method that only helps
   * small teams would be a good thing and a weak thesis.
   */
  paragraphs: [
    "Better ways of learning could let a small research team pursue work that is currently beyond its budget.",
    "They could also let the largest labs build more capable systems with the resources they already have. Both matter, and neither of them requires a claim that scaling has stopped working.",
  ],
  /**
   * The mission and the north star.
   *
   * The north star sentence is the one that separates a real thesis from a
   * benchmark result: an advantage confined to one small model or one benchmark
   * would not be the thing we are looking for, and saying so in advance is what
   * stops a favourable early number from being mistaken for the finding.
   */
  mission: {
    label: "Our mission",
    statement:
      "Discover and develop methods that help AI models learn more with less computation.",
    paragraphs: [
      "We begin by studying how training can make better use of the data available to a model.",
      "The north star is that each generation of AI learns substantially more from the compute it is given, as a relationship that keeps improving as models grow rather than an advantage confined to one small model or one benchmark.",
    ],
  },
  /**
   * What lower training cost would and would not establish.
   *
   * ── DO NOT DELETE THIS, AND DO NOT SOFTEN IT ────────────────────────────
   * "Efficiency" invites three claims this company cannot make: cheaper
   * inference, lower industry energy use, and the implication that scaling has
   * stopped paying. A reader will make all three unprompted, and a site that
   * lets them is a site that has overclaimed by omission.
   *
   * Set in the qualifier width. See globals.css.
   */
  limits:
    "Lower training cost could widen access to model development and make more experiments feasible. It would not, on its own, establish lower inference costs or lower total industry electricity use. Those require separate measurements.",
  /** This page's one action, at the foot. Goes to /contact. */
  cta: "Challenge the method",
  metaDescription:
    "Afterscale works on training-efficient intelligence so that a small team can pursue work beyond its budget and a large one can build more from what it already has.",
} as const;

/**
 * Evidence: what would count, and what would make us stop.
 *
 * ── THIS ROUTE IS THE REASON THE SITE IS CREDIBLE ───────────────────────────
 * `standard` names the conditions under which Afterscale would abandon its own
 * mechanism, in public, before running the experiment. That is a pre-registration
 * rather than a marketing page, and it is worth more than any capability claim
 * available to a company with no results.
 *
 * **Do not soften "Reconsider the mechanism if gains disappear against strong
 * baselines."** The previous version of this site carried the same instruction
 * about a different sentence, and the instruction is about the practice rather
 * than the wording: a falsification condition that has been made comfortable is
 * not one.
 *
 * The order is the argument: here is the test, here is what would make us stop,
 * and only then here is what we would actually run.
 */
export const evidence = {
  label: "Evidence",
  heading: "Same budget, better model",
  /**
   * Three paragraphs: the primary test, the accounting, and the statistics.
   *
   * The second is the one that does the real work. Almost every efficiency
   * result in this field is available by not charging the method for its own
   * overhead, so saying in advance that scoring, probing, teaching and data
   * generation all count against us is what makes the first paragraph mean
   * anything.
   */
  paragraphs: [
    "Better quality at a fixed total compute budget, or less compute to reach matched held-out quality. Metrics and acceptable per-domain regressions are set before anything is compared, and development evaluations are kept separate from final tests.",
    "The method is charged for its own costs: scoring data, running probes, using teachers, and generating any data it needs. One-off development, tuning and failed runs are reported separately, alongside the cost of repeating the method.",
    "Uncertainty is reported across seeds. An insignificant difference is not proof of equal quality, and estimated operations are compared against measured hardware time rather than standing in for it.",
  ],
  /**
   * The stop conditions.
   *
   * Two paragraphs, then the falsification condition. The first paragraph is
   * a concession, the second limits what a good early result would be allowed
   * to mean, and the condition takes the margin bracket.
   *
   * ── THE CONDITION WAS ONE SENTENCE AND IS NOW A LEAD-IN AND FOUR ITEMS ─────
   * It read "Reconsider the mechanism if gains disappear against strong
   * baselines, depend on costly scoring, fail to transfer, or come from
   * narrowing capability." Split on 2026-09-28, with the user's approval, so
   * /evidence can set the four as a row of cells. **Every word is the same**,
   * and joined back with commas and an "or" they are the old sentence exactly.
   * The four stay lower case because each finishes `lead` rather than
   * standing alone.
   *
   * **Do not soften any of the four, and do not drop one.** The instruction at
   * the top of `evidence` applies to each item as it did to the sentence.
   */
  standard: {
    label: "Reasons to stop",
    title: "Reasons to stop",
    paragraphs: [
      "We have shown nothing yet.",
      "Small-model success supports a larger test. It is not a frontier-capability claim, and we will not report it as one.",
    ],
    lead: "Reconsider the mechanism if gains:",
    conditions: [
      "disappear against strong baselines",
      "depend on costly scoring",
      "fail to transfer",
      "come from narrowing capability",
    ],
  },
  /**
   * What would actually be run first.
   *
   * The second paragraph enumerates four baselines and stays a sentence. Rule
   * one is about copy that already has a list beside it; this has none, and
   * breaking it into list items would mean choosing where each item begins,
   * which is rewriting rather than setting.
   *
   * **The three paragraphs are three numbered steps on the page** (2026-09-28),
   * one per cell, because they are a real sequence: each happens only if the
   * one before it survives. That sets them; it does not split any of them.
   */
  plan: {
    label: "Proposed first experiments",
    title: "Proposed first experiments",
    paragraphs: [
      "Begin with an open decoder-only language model and a documented corpus we have permission to use. Reproduce a small from-scratch baseline first, and measure both its cost and its variability.",
      "Then isolate one candidate signal with the architecture, tokenizer and available data held fixed, compared against random sampling, strong static filtering, diversity sampling and reference-loss selection under fair tuning budgets.",
      "If that is convincing, expand to at least three model sizes with repeated seeds. A roughly 100M to 1B parameter study is a proposed range rather than a funded commitment, and the budget decides the first run.",
    ],
  },
  metaDescription:
    "What Afterscale would accept as evidence for training-efficient intelligence, and the conditions under which it would abandon the mechanism.",
} as const;

/**
 * The one thing the site asks anybody to do, and a route of its own.
 *
 * **`heading` is `hero.ctaPartner` verbatim**, so the button on home and the
 * page it lands on say the same words. They are separate literals rather than a
 * shared constant, because one is an imperative on a control and the other is a
 * heading, and a future edit may well want to break the match.
 *
 * `body` asks for the one thing a research programme needs more than customers,
 * which is somebody who can say where the idea breaks. `bodyMore` names the two
 * roles the brief says come first.
 *
 * `errorUnconfigured` exists because the transport can be absent. See
 * lib/waitlist.ts: with no endpoint the form says so rather than thanking
 * somebody for something that did not happen.
 */
export const waitlist = {
  label: "Contact",
  heading: "Challenge the method",
  body: "If you have trained language models from scratch and can say where a learning-value estimate would break, we want to hear it before we spend a budget finding out.",
  /**
   * The two roles, in one paragraph.
   *
   * Prose rather than a list, which is rule one: two roles named in a sentence
   * reads as an invitation, two roles in a bulleted list reads as a job board.
   */
  bodyMore:
    "We are also looking for a research collaborator with hands-on pretraining experience, and an engineer who can make experiments reproducible. Skeptical is useful.",
  /**
   * Sits under the button, because the button is what raises the question.
   * It promises no timeframe, because none is known.
   */
  afterSending: "One person reads every message and answers it.",
  /**
   * Sits under the ask, and points at the stop conditions rather than making a
   * promise of its own.
   */
  dataLead:
    "Before writing, the conditions under which we would abandon this are ",
  dataLink: "written down under Evidence.",
  /**
   * Where the address goes, under the form that takes it.
   *
   * ── A SITE THAT ARGUES FOR STATING ITS LIMITS CANNOT BE SILENT ABOUT THIS ──
   * This form collects an email address and a line of free text and sends both
   * to Buttondown, a third party in another country, and until now the site said
   * nothing about it at all. On a page whose whole rhetorical position is that it
   * will tell you what it has not established, that omission was the loudest
   * thing on it.
   *
   * **Every clause here is checkable and none of them is a promise.** It does
   * not offer deletion, name a retention period, quote a lawful basis or assert
   * a legal entity, because Afterscale is a company in formation and all four
   * would be invented. What it says is where the data sits, that it goes no
   * further, and the one control the reader actually has.
   *
   * A `/privacy` route is the right answer the moment there is analytics, a
   * cookie, or a registered company to name. Two accurate sentences are
   * proportionate to two forms and no tracking.
   */
  dataNote:
    "Your address and note are stored in Buttondown, who hold our mailing list. We do not share them with anyone else, and every mail we send carries an unsubscribe link.",
  placeholder: "you@company.com",
  /** Optional, and the placeholder has to make that obvious. */
  cellPlaceholder: "The objection, in a line (optional)",
  cellLabel: "About the work",
  cta: "Write to Afterscale",
  success: "Received. We will be in touch.",
  already: "You already wrote to us. We have it.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
  /**
   * Nearly unreachable now that the form delivers: it shows only if
   * BUTTONDOWN_API_KEY is missing in production, which is a deployment fault and
   * is fixed in a minute. Put an address back the moment one receives mail.
   */
  errorUnconfigured: "This form is not connected yet. Try again shortly.",
} as const;

/**
 * Home's second frame, and the only reason home scrolls at all.
 *
 * A different audience from `waitlist`, which is the whole justification for a
 * second ask. `waitlist` wants somebody who can attack the method and it opens a
 * conversation. This wants engineers who only want to know what happens next,
 * and it opens nothing.
 *
 * **`body` promises behaviour, not product**, which is deliberate under rule
 * three. It makes no claim about roles, timing or what gets built, so there is
 * nothing in it that can later turn out to have been untrue.
 */
export const updates = {
  label: "Updates",
  heading: "For engineers watching this closely",
  body: "Leave an address and we will write when there is something worth showing. No other reason.",
  placeholder: "you@company.com",
  cta: "Keep me posted",
  success: "Confirmed. We will write when there is something to show.",
  /** A duplicate is a success. See the note in api/subscribe/route.ts. */
  already: "You are already on the list.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
  errorUnconfigured: "This form is not connected yet. Try again shortly.",
  /**
   * The same disclosure as `waitlist.dataNote`, shorter because this form asks
   * for less. One field, one purpose, so the sentence about a note it does not
   * collect would be describing somebody else's form. See the note there.
   */
  dataNote:
    "Your address is stored in Buttondown and used for nothing but these updates. Every mail carries an unsubscribe link.",
  /** The cue on the bottom edge of the title card. It points at something real,
      which is why it is allowed to exist. */
  scrollCue: "Keep posted",
} as const;

/**
 * The colophon.
 *
 * Laid out as tiny centred label-over-value pairs, lifted from the credit block
 * on the reference sheet: a short caps label in the faintest ink with its value
 * directly under it, the whole group centred and given far more air than its
 * size suggests it deserves.
 *
 * It carries no link row of its own. The header's nav is repeated here instead,
 * from `nav` above, so a reader at the bottom of a long route does not have to
 * travel back up to leave. One list, two places, no chance of drift.
 *
 * ── THE VERSION STAMP REPLACED THE REGISTRATION TICKS ────────────────────────
 * The site used to carry printer's corner marks on its tinted bands, which were
 * right when the subject was physical apparatus and became costume the moment it
 * was not. A press mark on a document about training runs is borrowed authority.
 *
 * What a pre-registered protocol actually carries is a version and a date, and
 * the direction brief is stamped exactly that way. So the furniture says which
 * version of the research direction this site reflects, which is a real fact and
 * a checkable one. **Update it whenever the brief is revised**, or it becomes
 * the most precisely wrong thing on the page.
 *
 * Do not put COMPANY here: Afterscale is a company in formation, and a field
 * labelled COMPANY would assert a legal status that does not exist.
 */
export const footer = {
  copyright: `© ${new Date().getFullYear()} Afterscale`,
  labels: {
    discipline: "Discipline",
    direction: "Direction",
  },
  /** The version of the research direction this site is built from. */
  direction: "v1.0, 7 September 2026",
} as const;
