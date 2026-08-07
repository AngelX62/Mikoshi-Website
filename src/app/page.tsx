import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import Capabilities from "@/components/Capabilities";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      {/*
        Everything below the hero sits on an opaque ground, so it scrolls up over
        the fixed dither canvas rather than letting it show through.
      */}
      <Statement />
      <Capabilities />
      <Footer />
    </main>
  );
}
