import Link from "next/link";
import Logo from "@/components/Logo";
import { footer, launch, site } from "@/content";

export default function Footer() {
  return (
    <footer className="launch-footer">
      <div className="launch-shell launch-footer__inner">
        <Link href="/" className="launch-logo" prefetch={false} aria-label={`${site.name}, home`}>
          <Logo size={19} accent />
        </Link>
        <p>{launch.footerLine}</p>
        <small>{footer.copyright}</small>
      </div>
    </footer>
  );
}
