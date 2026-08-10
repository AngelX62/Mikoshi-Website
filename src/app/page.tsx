import Hero from "@/components/Hero";
import Thesis from "@/components/Thesis";
import Method from "@/components/Method";
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
 *
 * **There was a proof beat between the method and the deployment**, a full
 * screen holding a photograph of a real cell with one line of type under it.
 * There is no photograph. It held a schematic drawing instead, under a caption
 * reading "a cell running work it was never programmed for", which is a claim
 * the frame could not support: a drawing of a cell proves nothing, and a beat
 * whose whole job is evidence cannot be the one beat that has none.
 *
 * It comes back when `public/cell.jpg` exists. Until then the deployment still
 * holds the photograph channel, so a real file lands on the page the moment it
 * is dropped in. See `photograph` in content.ts.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <Thesis />
      <Method />
      <Deployment />
      <Horizon />
      <Footer />
    </main>
  );
}
