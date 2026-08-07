/**
 * Every word on the site lives here.
 *
 * The positioning isn't settled yet, so the copy below is deliberately abstract:
 * it sets a tone without committing to claims about what the product does. Edit
 * this file to change the site — you should never need to open a component to
 * change a sentence.
 */

export const site = {
  name: "MIKOSHI",
  /** Used for <title>, OpenGraph, and the footer. */
  tagline: "Software for machines that move.",
  description:
    "MIKOSHI builds software for machines that move through the physical world.",
  /** Set this once you have a domain, so OpenGraph URLs resolve absolutely. */
  url: "https://mikoshi.com",
} as const;

export const hero = {
  /** Drawn into the dither field, and mirrored as the page's real <h1>. */
  wordmark: "MIKOSHI",
  descriptor: "Software for machines that move.",
  /** Small mono label in the top-left corner. */
  eyebrow: "Robotic Software",
  scrollCue: "Scroll",
} as const;

export const statement = {
  // No numerals. With only two labelled sections an index carries nothing, and
  // the 01 / 02 / 03 device is the tell of a templated landing page.
  label: "Premise",
  /** Rendered one line at a time, each wiping up into place. Keep lines short. */
  lines: [
    "Machines perceive the world",
    "as a field of samples —",
    "discrete, noisy, incomplete.",
    "We build the layer that turns",
    "that field into intent.",
  ],
} as const;

/**
 * The wordless passage.
 *
 * There is no prose here on purpose. Until the positioning is settled, any
 * capability copy would be invented — which is exactly what made the section
 * this replaced ring false. The readouts below are instrumentation, not claims:
 * they name what the field is doing, nothing more.
 */
export const passage = {
  shots: [
    { at: 0.0, readout: "Scan" },
    { at: 0.38, readout: "Volume" },
    { at: 0.74, readout: "Sample" },
  ],
} as const;

export const waitlist = {
  label: "Contact",
  heading: "Early access",
  body: "We're building quietly. Leave an address and we'll be in touch when there's something worth showing.",
  placeholder: "you@company.com",
  cta: "Request access",
  success: "Received. We'll be in touch.",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Try again.",
} as const;

export const footer = {
  /** Add real destinations as they exist. An empty array renders no link row. */
  links: [] as ReadonlyArray<{ label: string; href: string }>,
  email: "hello@mikoshi.com",
  copyright: `© ${new Date().getFullYear()} MIKOSHI`,
} as const;
