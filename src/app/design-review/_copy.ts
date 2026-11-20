import { launch, site } from "@/content";

export type Direction = "paper" | "ink";
export type Surface = "home" | "research";
export const reviewRoot = "/design-review/";
export const previewHref = (direction: Direction, surface: Surface = "home") =>
  reviewRoot + direction + (surface === "home" ? "/" : "/research/");

// Both directions read the same copy. Nothing here changes the public site.
export const review = {
  company: site.name,
  status: launch.status,
  title: launch.headline,
  intro: "We’re building an AI-native compute cloud. Our first research question is what happens when a customer’s model goes quiet. Keeping it ready costs money. Starting it again makes the next person wait.",
  primary: launch.focusLink,
  print: {
    number: "Fig. 01", title: "First-token print", prompt: "day and", token: "night",
    caption: "Illustration, not a live model.", replay: "Replay",
  },
  updatesLink: launch.updatesCta,
  labels: { research: "Research", updates: "Updates", evidence: "Evidence", home: "Home" },
  question: ["What happens", "between requests?"],
  lead: "A team finishes a review. Its fine-tuned model answers the last request. An hour might pass before someone asks it another question.",
  questionBody: "While nobody is asking, the team has a choice: pay to keep the model loaded, or release the GPU and make the next person wait for it to start again.",
  timing: {
    title: "Between two requests",
    quiet: "Model is quiet",
    wait: "User is waiting",
    last: "Last response ends",
    request: "Next request arrives",
    token: "First token comes back",
    caption: "Illustrative timing, not measured data.",
    note: "The quiet interval is over when the next request arrives. Only then does the user’s wait for the first token begin.",
  },
  method: {
    title: "How we’d test it.",
    setup: "We’d replay the same requests on the same model under two settings. With warm capacity, the model stays loaded between bursts. With scale-to-zero, the GPU is released after a quiet period and the model starts again on demand.",
    measure: "We’d set the same output-quality checks and first-token wait target for both runs, then compare the total cost per successful request. Idle capacity, startup and retries belong on the bill. Failed requests and long waits belong in the results.",
    open: "Afterscale has no inference savings to report yet.",
    evidence: "What would count as evidence?",
  },
  updates: {
    title: "Launch updates", label: "Email address", button: "Preview signup",
    note: "Preview only. No email address is collected.",
    confirm: "Preview complete. Your email was not sent or saved.",
    disabled: "This preview does not collect email addresses.",
  },
  footer: { compare: "Compare directions", current: "Current site" },
  hub: {
    title: "Design review", home: "Homepages", research: "Research pages",
    hint: "View the same page in Paper and Ink. Open either one to explore it at full size.",
    names: { paper: "Paper", ink: "Ink" },
    open: { paper: "Open Paper", ink: "Open Ink" },
  },
} as const;
