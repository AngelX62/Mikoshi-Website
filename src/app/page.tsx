import Hero from "@/components/Hero";
import Thesis from "@/components/Thesis";
import Method from "@/components/Method";
import Proof from "@/components/Proof";
import Deployment from "@/components/Deployment";
import Horizon from "@/components/Horizon";
import Footer from "@/components/Footer";

/**
 * Claim, mechanism, product, direction.
 *
 * The thesis states what MIKOSHI ports, the method shows how, the deployment
 * names what ships first, and the horizon says where it goes. Reordering these
 * breaks the argument: the mechanism is only credible after the claim, and the
 * horizon is only credible after something concrete.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <Thesis />
      <Method />
      <Proof />
      <Deployment />
      <Horizon />
      <Footer />
    </main>
  );
}
