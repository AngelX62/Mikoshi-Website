import LaunchNote from "@/components/LaunchNote";
import { vision } from "@/content";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Vision",
  description: vision.metaDescription,
  path: "/vision/",
});

export default function Vision() {
  return (
    <LaunchNote
      label={vision.label}
      heading={vision.heading.join(" ")}
      paragraphs={[...vision.paragraphs, vision.limits]}
      next={{ href: "/research/", label: vision.cta }}
    />
  );
}
