import type { Metadata } from "next";
import Band from "@/components/Band";
import Footer from "@/components/Footer";
import Waitlist from "@/components/Waitlist";
import { footer, waitlist } from "@/content";

export const metadata: Metadata = {
  title: "Contact",
  description: waitlist.body,
};

/**
 * Contact: the one thing the site asks anybody to do.
 *
 * The address sits beside the form rather than only inside its failure state.
 * The form can be unconfigured, and somebody who would rather write an email
 * than fill in a field should not have to trip the error to find out where to
 * send it. See lib/waitlist.ts for what happens with no endpoint set.
 */
export default function Contact() {
  return (
    <main className="flex flex-1 flex-col">
      <Band size="tall" strip={{ left: waitlist.label }}>
        <div className="grid gap-x-16 gap-y-14 md:grid-cols-12">
          <div className="md:col-span-6">
            <h1 className="reveal text-[clamp(1.75rem,4.4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-ink">
              {waitlist.heading}
            </h1>
            <p className="reveal mt-8 max-w-[30rem] text-lg leading-relaxed text-ink-soft">
              {waitlist.body}
            </p>

            <a
              href={`mailto:${footer.email}`}
              className="reveal mt-12 inline-block border-b border-ink-faint pb-1 font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-ink-dim transition-colors duration-300 hover:border-accent hover:text-accent"
              style={{ animationDelay: "300ms" }}
            >
              {footer.email}
            </a>
          </div>

          <div className="md:col-span-6">
            <Waitlist />
          </div>
        </div>
      </Band>

      <Footer />
    </main>
  );
}
