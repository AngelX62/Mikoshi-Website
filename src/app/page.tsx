import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import { launch, updates } from "@/content";

export default function Home() {
  return (
    <main id="main-content" className="launch-home">
      <section className="launch-hero" aria-labelledby="launch-heading">
        <div className="launch-shell launch-hero__copy">
          <h1 id="launch-heading" className="launch-title">
            {launch.homeHeadline.map((line, index) => (
              <span key={line}>{index > 0 && " "}{line}</span>
            ))}
          </h1>
          <p className="launch-hero__intro">{launch.intro}</p>
          <div className="launch-actions">
            <Link className="launch-button" href="/research/" prefetch={false}>{launch.focusLink}<span aria-hidden="true">→</span></Link>
            <a className="launch-text-link" href="#updates">{launch.updatesCta}</a>
          </div>
        </div>
        <div className="launch-afterimage" aria-hidden="true"><div className="launch-afterimage__light" /></div>
      </section>
      <section className="launch-focus launch-shell" id="first-focus" aria-labelledby="focus-title">
        <p className="launch-label">{launch.focusLabel}</p>
        <div className="launch-focus__body">
          <h2 id="focus-title">{launch.focusTitle}</h2>
          <p>{launch.focusBody}</p>
          <Link className="launch-text-link" href="/evidence/" prefetch={false}>{launch.evidenceLink}</Link>
        </div>
      </section>
      <section className="launch-updates" id="updates" aria-labelledby="updates-title">
        <div className="launch-shell launch-updates__inner">
          <div>
            <h2 id="updates-title">{updates.heading}</h2>
            <p>{updates.body}</p>
          </div>
          <div className="launch-form">
            <SubscribeForm source="home" copy={updates} idPrefix="launch-updates" />
            <p className="launch-privacy">{updates.dataNote}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
