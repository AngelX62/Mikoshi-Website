/**
 * Public copy for Afterscale's coming-soon site.
 * Keep ambitions separate from a service or result we can demonstrate.
 */
import { WORDMARK } from "@/lib/logo";

const SITE_TAGLINE = "An AI-native compute cloud. Coming soon.";

/** Keep production canonicals on the stable site URL, not a deployment hash. */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const alias = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (alias) return `https://${alias}`;

  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (deployment) return `https://${deployment}`;

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
  description:
    "Afterscale is building an independent AI-native compute cloud. Our first research question is what it costs to keep customer-specific models ready between requests. Coming soon.",
  url: resolveSiteUrl(),
} as const;

export const nav = [
  { label: "Vision", href: "/vision" },
  { label: "Research", href: "/research" },
  { label: "Evidence", href: "/evidence" },
  { label: "Contact", href: "/contact" },
] as const;

export const launch = {
  status: "Coming soon",
  homeHeadline: ["An AI-native", "compute cloud."],
  headline: ["Inference has", "quiet hours."],
  intro:
    "We’re building Afterscale for teams that run custom models for their customers. Our first question: can they spend less on idle GPUs and still start the next reply on time?",
  updatesCta: "Get launch updates",
  questionCta: "Our first question",
  artLabel: "Ink study / Between requests",
  focusLabel: "Inference research",
  focusTitle: "After an hour without a request",
  focusBody:
    "Keeping a model loaded can mean paying for a GPU nobody is using. Unloading it can leave the next person waiting. We plan to measure the bill and the wait on the same traffic. We have no inference savings to report yet.",
  evidenceLink: "How we’ll test it",
  focusLink: "Read the research question",
  skip: "Skip to content",
  footerLine: "An AI-native compute cloud. Coming soon.",
} as const;

export const vision = {
  label: "Vision",
  heading: ["A cloud for teams", "running their own models."],
  paragraphs: [
    "Afterscale is building an independent, AI-native compute cloud for teams running their own models.",
    "A team should be able to tell us how quickly each customer’s model needs to respond. We want the cloud to work out which GPUs to keep running. We’re starting with models that sit idle between bursts of requests.",
  ],
  mission: {
    label: "Our ambition",
    statement: "Make the cloud fit the workload.",
    paragraphs: [
      "We want engineers to spend less time fitting their models to infrastructure, and more time building what those models make possible.",
    ],
  },
  limits:
    "The cloud isn’t open to customers yet.",
  cta: "Explore the first question",
  metaDescription:
    "Afterscale is building an independent AI-native compute cloud for teams running their own models. Its first focus is bursty inference.",
} as const;

export const research = {
  label: "Research",
  heading: "Which models should stay ready?",
  paragraphs: [
    "Imagine a software company that runs a different model for each customer. One gets a burst of requests every morning. Another might go all day without one. Only when a request arrives does a person start waiting.",
    "We’re studying which models need to stay loaded, when several can share GPU capacity, and when a model can be unloaded and brought back in time.",
    "Our question is whether those choices can lower the cost per successful request compared with a team’s best existing setup, while meeting the same deadline for the first token. We haven’t demonstrated that yet.",
  ],
  cta: "What would count as evidence?",
  priorArt: {
    label: "Available alternatives",
    paragraphs: [
      "The comparison starts with options an engineer can already choose.",
      "A fair test must tune each alternative for the same workload and user wait.",
    ],
    citations: [
      { work: "Warm capacity", authors: "Baseline", note: "Keep the model ready between bursts" },
      { work: "Self-managed GPU instances", authors: "Baseline", note: "Control when capacity starts and stops" },
      { work: "Managed autoscaling", authors: "Baseline", note: "Adjust capacity with demand" },
      { work: "Scale-to-zero inference", authors: "Baseline", note: "Include startup delay after idle periods" },
    ],
  },
  metaDescription:
    "Afterscale is studying whether teams can spend less serving customer-specific models while meeting the same first-token deadline after quiet periods.",
} as const;

export const evidence = {
  label: "Evidence",
  heading: "What would count as a better result?",
  paragraphs: [
    "We have no inference results to publish yet. Here’s the comparison we’d run.",
    "Replay a team’s requests at their original times. Keep the models, quality checks and customer isolation requirements the same. Compare keeping models loaded with letting them shut down, then test against the best settings the team can already use.",
    "Agree in advance on how long a user can wait for the first token. Measure that wait separately for the first request after each quiet period, and report failures and long waits as well as the typical case.",
    "Count idle GPU time, model loading and retries in the bill. We’d need to spend less per successful request without making the model worse or missing the agreed response deadline. If tuning the existing service does just as well, that’s the result.",
  ],
  cta: "Bring a concrete workload",
  standard: {
    label: "The standard",
    title: "Matched demand. Matched targets.",
    paragraphs: [
      "We have no inference results to report yet.",
      "Lower cost only counts if the agreed latency and quality targets still hold.",
    ],
    lead: "Reconsider the approach if savings:",
    conditions: [
      "disappear against well-tuned alternatives",
      "exclude cold starts or idle capacity",
      "increase failures or tail latency",
      "depend on lower output quality",
    ],
  },
  plan: {
    label: "Proposed comparison",
    title: "Proposed comparison",
    paragraphs: [
      "Agree on a model, request trace, quality checks and acceptable user wait.",
      "Tune each alternative fairly, then include warm capacity, idle time, loading, cold starts and retries in the cost.",
      "Report cost per successful request alongside failures and p95 and p99 latency.",
    ],
  },
  metaDescription:
    "A proposed fair test of bursty inference: total cost, cold starts and tail latency at matched demand and output quality. No inference results yet.",
} as const;

export const waitlist = {
  label: "Contact",
  heading: "What does your traffic look like?",
  body:
    "If you run a customer-specific model, tell us what happens between requests.",
  bodyMore:
    "A short note on model size, peak traffic and the wait your users can accept is enough. Please do not send prompts, datasets, credentials or other sensitive information.",
  afterSending:
    "This form joins our contact list. It does not request access to a live service.",
  dataLead: "Our proposed comparison is ",
  dataLink: "under Evidence.",
  dataNote:
    "Your email and optional note are sent to Buttondown, our mailing-list provider. You can unsubscribe from our emails.",
  placeholder: "you@company.com",
  cellPlaceholder: "Workload summary (optional)",
  cellLabel: "Workload summary (optional)",
  cta: "Send a note",
  success: "Your email is on our contact list. Thank you.",
  already:
    "This email is already on the list. A new note may not have been saved.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
  errorUnconfigured: "This form is not connected yet. Try again later.",
  metaDescription:
    "Share a brief, non-sensitive description of your model, traffic and acceptable user wait with Afterscale.",
} as const;

export const updates = {
  label: "Launch updates",
  heading: "Hear when we launch.",
  body: "We’ll write when there’s a release to try or a result worth sharing.",
  placeholder: "you@company.com",
  cta: "Notify me",
  button: "Notify me",
  success: "Your email is on the updates list. Thank you.",
  already: "You are already on the updates list.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
  errorUnconfigured: "This form is not connected yet. Try again later.",
  dataNote:
    "We send your email to Buttondown to manage launch updates. You can unsubscribe from our emails.",
  scrollCue: "Launch updates",
} as const;

export const notFound = {
  label: "Not found",
  heading: "This page is missing.",
  body:
    "The address may be out of date, or the page may have moved. You can return to Afterscale from here.",
  cta: "Back to Afterscale",
} as const;

/** Compatibility copy for existing components while the launch page replaces them. */
export const hero = {
  wordmark: WORDMARK,
  headline: launch.headline.join(" "),
  headlineLines: launch.headline,
  introduction: launch.intro,
  stage: launch.status,
  researchLabel: launch.focusLabel,
  pauseMotion: "Pause motion",
  resumeMotion: "Resume motion",
  paragraphs: [launch.intro, research.paragraphs[2]],
  status: "An open question. No inference results yet.",
  ctaResearch: launch.questionCta,
  ctaPartner: "Share your workload",
  eyebrow: "AI-native compute",
} as const;

export const standing = {
  label: "Decided and open",
  openLabel: "decisions still open",
  rows: [
    { item: "Direction", value: "An independent AI-native compute cloud", open: false },
    { item: "First focus", value: "Bursty inference for customer-specific models", open: false },
    { item: "Mechanism", value: "Under investigation", open: true },
    { item: "Public service", value: "Not available", open: true },
    { item: "Pricing", value: "Not announced", open: true },
    { item: "Launch date", value: "Not announced", open: true },
  ],
} as const;

export const routes = { label: "Read further" } as const;

export const footer = {
  copyright: `© ${new Date().getFullYear()} Afterscale`,
  labels: { discipline: "Focus", direction: "Status" },
  direction: launch.status,
} as const;
