import LaunchNote from "@/components/LaunchNote";
import SubscribeForm from "@/components/SubscribeForm";
import { waitlist } from "@/content";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Contact",
  description: waitlist.metaDescription,
  path: "/contact/",
});

export default function Contact() {
  return (
    <LaunchNote
      label={waitlist.label}
      heading={waitlist.heading}
      paragraphs={[waitlist.body, waitlist.bodyMore]}
      className="launch-contact"
    >
      <div className="launch-contact__form">
        <SubscribeForm
          source="contact"
          copy={waitlist}
          withCell
          idPrefix="waitlist"
        />
        <p className="launch-contact__note">{waitlist.afterSending}</p>
        <p className="launch-contact__privacy">{waitlist.dataNote}</p>
      </div>
    </LaunchNote>
  );
}
