import LaunchNote from "@/components/LaunchNote";
import { research } from "@/content";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Research",
  description: research.metaDescription,
  path: "/research/",
});

export default function Research() {
  return (
    <LaunchNote
      label={research.label}
      heading={research.heading}
      paragraphs={research.paragraphs}
      next={{ href: "/evidence/", label: research.cta }}
    />
  );
}
