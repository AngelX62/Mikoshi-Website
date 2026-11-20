import LaunchNote from "@/components/LaunchNote";
import { evidence } from "@/content";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Evidence",
  description: evidence.metaDescription,
  path: "/evidence/",
});

export default function Evidence() {
  return (
    <LaunchNote
      label={evidence.label}
      heading={evidence.heading}
      paragraphs={evidence.paragraphs}
      next={{ href: "/contact/", label: evidence.cta }}
    />
  );
}
