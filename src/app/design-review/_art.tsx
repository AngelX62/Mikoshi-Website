import { review } from "./_copy";

export function InkInterval() {
  const rim=(t:number)=>`M -66,${-132+t*7} C 219,${118+t*7} 327,${308+t*53} 523,${277+t*43} C 699,${248+t*42} 744,${117+t*33} 959,${84-t*5}`;
  return <div className="ar-ink-field" aria-hidden="true">
    <svg className="ar-ink-crown" viewBox="0 0 900 420" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id="ar-rim" x1="0" y1=".85" x2="1" y2=".35" gradientUnits="objectBoundingBox">
          <stop stopColor="#2f2629" stopOpacity="0"/><stop offset=".19" stopColor="#5e3944"/>
          <stop offset=".44" stopColor="#af626e"/><stop offset=".57" stopColor="#e4c3b8"/>
          <stop offset=".72" stopColor="#aa6572"/><stop offset="1" stopColor="#4d2d38" stopOpacity=".19"/>
        </linearGradient>
        <linearGradient id="ar-fold" x1=".22" y1="0" x2=".74" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#181619"/><stop offset=".52" stopColor="#21191b"/>
          <stop offset=".83" stopColor="#3c272c"/><stop offset="1" stopColor="#574046"/>
        </linearGradient>
        <filter id="ar-rim-blur" x="-12%" y="-25%" width="124%" height="150%"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <path d={rim(.46)+" L 980,-190 L -66,-190 Z"} fill="url(#ar-fold)"/>
      <g fill="none">
        <path d={rim(.48)} stroke="url(#ar-rim)" strokeWidth="21" opacity=".36" filter="url(#ar-rim-blur)"/>
        {Array.from({length:35},(_,i)=><path key={i} d={rim(i/34)} stroke="url(#ar-rim)" strokeWidth={i===33?1.15:.73}
          opacity={.10+(.44*Math.sin(Math.PI*i/34))}/>)}
        <path className="ar-exposure" d={rim(.98)} stroke="url(#ar-rim)" strokeWidth="1.2"/>
      </g>
    </svg>
    <svg className="ar-ink-foot" viewBox="0 0 530 210" preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id="ar-echo"><stop stopColor="#be8b8e" stopOpacity=".65"/><stop offset=".6" stopColor="#935465" stopOpacity=".55"/><stop offset="1" stopColor="#6a3e4a" stopOpacity="0"/></linearGradient></defs>
      {Array.from({length:13},(_,i)=><path key={i} d={`M -28,${13+i*2} C 110,${151+i*2} 285,${126+i*3} 478,${242+i*3}`}
        fill="none" stroke="url(#ar-echo)" strokeWidth=".85" opacity={.7-i*.043}/>)}
    </svg>
  </div>;
}

export function TimingFigure() {
  const t=review.timing;
  return <figure className="ar-timing" aria-labelledby="timing-name" aria-describedby="timing-caption timing-meaning">
    <h3 id="timing-name">{t.title}</h3>
    <div className="ar-timing-track">
      <div className="ar-interval ar-quiet">
        <span className="ar-event">{t.last}</span>
        <span className="ar-duration">{t.quiet}</span>
        <span className="ar-tickline" aria-hidden="true"/>
      </div>
      <div className="ar-interval ar-wait">
        <span className="ar-event">{t.request}</span>
        <span className="ar-duration">{t.wait}</span>
        <span className="ar-tickline" aria-hidden="true"/>
      </div>
      <div className="ar-end">
        <span className="ar-tickline" aria-hidden="true"/>
        <span className="ar-event">{t.token}</span>
      </div>
    </div>
    <figcaption><span id="timing-caption">{t.caption}</span><span id="timing-meaning">{t.note}</span></figcaption>
  </figure>;
}
