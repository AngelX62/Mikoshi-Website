import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import Passage from "@/components/Passage";
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
      <Passage />
      <Footer />
    </main>
  );
}
