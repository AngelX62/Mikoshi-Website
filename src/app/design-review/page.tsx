import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import { previewHref, review, reviewRoot } from "./_copy";

export const metadata: Metadata = { title: review.hub.title };

export default async function DesignReview({searchParams}:{searchParams:Promise<{view?:string|string[]}>}) {
  if(process.env.NODE_ENV!=="development") notFound();
  const surface=(await searchParams).view==="research"?"research":"home";
  return <div className="ar-hub">
    <header className="ar-hub-mast"><a href="/" aria-label={review.company+", current site"}><Logo size="1.14rem" accent/></a><a href="/">{review.footer.current}</a></header>
    <main id="main-content" tabIndex={-1}>
      <div className="ar-hub-intro"><div><h1>{review.hub.title}</h1><p>{review.hub.hint}</p></div>
        <nav aria-label="Compare pages"><a href={reviewRoot} aria-current={surface==="home"?"page":undefined}>{review.hub.home}</a>
          {surface==="home" && <a href={reviewRoot+"lens/"}>Open Split Lens</a>}
          <a href={reviewRoot+"?view=research"} aria-current={surface==="research"?"page":undefined}>{review.hub.research}</a></nav>
      </div>
      <div className="ar-pair">
        {(["paper","ink"] as const).map(d=><section key={d} aria-label={review.hub.names[d]}>
          <div className="ar-edition"><h2>{review.hub.names[d]}</h2><a href={previewHref(d,surface)}>{review.hub.open[d]}</a></div>
          <div className="ar-window">
            <iframe title={review.hub.names[d]+" "+surface+" preview"} src={previewHref(d,surface)} tabIndex={-1} aria-hidden="true" inert/>
            <a className="ar-window-link" href={previewHref(d,surface)} tabIndex={-1} aria-hidden="true" aria-label={review.hub.open[d]}/>
          </div>
        </section>)}
      </div>
    </main>
  </div>;
}
