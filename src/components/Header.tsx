"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { launch, nav, site } from "@/content";

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="launch-header">
      <div className="launch-shell launch-header__inner">
        <div className="launch-header__brand">
          <Link href="/" prefetch={false} className="launch-logo" aria-label={`${site.name}, home`}>
            <Logo size="clamp(1.15rem, 4.1vw, 1.5rem)" accent />
          </Link>
          <span className="launch-status">{launch.status}</span>
        </div>
        <nav aria-label="Primary">
          <ul className="launch-nav">
            {nav.map(({ label, href }) => (
              <li key={href}>
                <Link href={href + "/"} prefetch={false} aria-current={pathname?.replace(/\/$/, "") === href ? "page" : undefined}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
