import LaunchNote from "@/components/LaunchNote";
import { notFound } from "@/content";

export default function NotFound() {
  return (
    <LaunchNote
      label={notFound.label}
      heading={notFound.heading}
      paragraphs={[notFound.body]}
      next={{ href: "/", label: notFound.cta }}
    />
  );
}
