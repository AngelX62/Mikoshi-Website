import Logo from "@/components/Logo";
import { previewHref, review, reviewRoot, type Direction, type Surface } from "./_copy";
import { InkInterval, TimingFigure } from "./_art";
import { FirstTokenPrint } from "./_first-token-print";
import { PreviewUpdates } from "./_updates";

function Mast({direction,surface}:{direction:Direction;surface:Surface}) {
  return <header className="ar-mast">
    <div className="ar-brand">
      <a href={previewHref(direction)} aria-label={review.company+", home"}><Logo size="clamp(1rem, 1.35vw, 1.23rem)" accent/></a>
      <span className="ar-status">{review.status}</span>
    </div>
    <nav aria-label="Primary">
      <a href={previewHref(direction,"research")} aria-current={surface==="research"?"page":undefined}>{review.labels.research}</a>
      <a href="#updates" aria-label={review.updatesLink}>{review.labels.updates}</a>
    </nav>
  </header>;
}

function LinkText({href,children}:{href:string;children:React.ReactNode}) {
  return <a className="ar-link" href={href}>{children}</a>;
}

function Cover({direction}:{direction:Direction}) {
  return <div className="ar-cover">
    {direction==="ink" && <InkInterval/>}
    <div className="ar-cover-copy">
      <h1><span>{review.title[0]}</span>{" "}<span className="ar-turn">{review.title[1]}</span></h1>
      <div className="ar-cover-note"><p>{review.intro}</p><LinkText href={previewHref(direction,"research")}>{review.primary}</LinkText></div>
    </div>
    {direction==="paper" && <FirstTokenPrint copy={review.print}/>}
  </div>;
}

function Article({surface}:{surface:Surface}) {
  const Heading=surface==="research"?"h1":"h2";
  return <article className={"ar-article "+(surface==="research"?"ar-feature":"ar-continuation")} aria-labelledby="question-title">
    <div className="ar-reading ar-question">
      <p className="ar-section-name">{review.labels.research}</p>
      <Heading id="question-title" className="ar-question-title">{review.question[0]}{" "}<span className="ar-turn">{review.question[1]}</span></Heading>
      <div className="ar-prose ar-scenario"><p>{review.lead}</p><p>{review.questionBody}</p></div>
      <TimingFigure/>
      <section aria-labelledby="method-title" className="ar-method">
        <h2 id="method-title">{review.method.title}</h2>
        <div className="ar-prose"><p>{review.method.setup}</p><p>{review.method.measure}</p></div>
        <p className="ar-verdict">{review.method.open}</p>
        <LinkText href="/evidence/">{review.method.evidence}</LinkText>
      </section>
    </div>
  </article>;
}

export function PreviewPage({direction,surface}:{direction:Direction;surface:Surface}) {
  return <div className={"ar-page ar-"+direction+" ar-"+surface}>
    <Mast direction={direction} surface={surface}/>
    <main id="main-content" tabIndex={-1}>
      {surface==="home" && <Cover direction={direction}/>}
      <Article surface={surface}/>
      <PreviewUpdates copy={review.updates}/>
    </main>
    <footer className="ar-foot">
      <a href={previewHref(direction)} aria-label={review.company+", home"}><Logo size="1rem" accent/></a>
      <nav aria-label="Preview links"><a href={reviewRoot+(surface==="research"?"?view=research":"")}>{review.footer.compare}</a><a href="/">{review.footer.current}</a></nav>
    </footer>
  </div>;
}
