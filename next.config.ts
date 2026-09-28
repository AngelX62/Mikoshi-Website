import type { NextConfig } from "next";

/**
 * **This was `output: "export"` and stopped being able to be.**
 *
 * The site is five pages of prose and every one of them still prerenders to
 * static HTML at build time. What it now also has is exactly one server route,
 * `/api/subscribe`, and that route is the whole reason the export is gone.
 *
 * Buttondown holds the mailing list, and Buttondown cannot be reached from a
 * browser. Their embed endpoint has to be the action of a native HTML form, and
 * their documentation is explicit that it must not be called with `fetch`,
 * because a subscriber sometimes has to follow the response to clear a CAPTCHA
 * or fix a validation error. Their API refuses cross-origin browser requests
 * outright and the docs send you to a server-side proxy instead. A static export
 * has nowhere to put that proxy, and the alternative was throwing the reader off
 * the site to a Buttondown-branded page at the exact moment they convert.
 *
 * So one route runs on a server and everything else is still a file. The cost is
 * real and worth writing down: this can no longer be dropped on S3 or GitHub
 * Pages. It wants a host that runs Next, which is Vercel here.
 */
/**
 * `images: { unoptimized: true }` was here and went with the export.
 *
 * It was required by `output: "export"`, which has no server to run the image
 * optimiser on. Nothing in `src/` imports `next/image`, so it was doing nothing
 * except quietly guaranteeing that the first image anybody did add would ship
 * unoptimised, on a host that can optimise it.
 */
/**
 * ── THIS WAS DORMANT AND IS LIVE NOW ────────────────────────────────────────
 * It used to say nothing imported `next/image`, which was true: home's
 * illustration was a raster for a few hours and is a live WebGL field again,
 * drawn by lib/hero-field.ts, which needs no optimiser. The `qualities` list
 * survived unused on the argument that the measurements below were expensive to
 * take.
 *
 * **That bet paid.** /research now carries a toned plate through Plate.tsx,
 * which asks for `quality={90}`, and Next 16 refuses any value not declared
 * here: without this list that request 400s. The list is load-bearing, so do
 * not prune it as dead config.
 *
 * The measurements below were taken against the wave artwork and are still true
 * of that file. They do not describe the plate, which is a different image made
 * a different way, but the conclusion transfers for the same reason: the plate
 * is a duotone, so it is a smooth two-colour ramp rather than a photograph full
 * of detail, and 75 bands in exactly the gradients it is mostly made of. 90 is
 * right for both, and for the same underlying reason.
 *
 * The other image on the site is gradient art, and 75 is tuned for photographs.
 *
 * Next's default quality is 75 and Next 16 will not serve any other value
 * unless it is declared here, so `quality={90}` in page.tsx needs this list or
 * the request 400s. 90 rather than higher because it is where the curve flattens.
 * Measured against the master, flattened on bone, mean absolute channel error:
 *
 *     q=75  126 KB  1.278      q=95  230 KB  0.616
 *     q=82  146 KB  1.032      q=100 290 KB  0.513
 *     q=90  180 KB  0.776
 *
 * **This is a real but secondary fix.** The illustration's softness is a
 * resolution problem, not a compression one: the master is 1672px wide, and a
 * full-bleed band needs viewport width times device pixel ratio, so anything
 * above a 1440 display at DPR 1 upscales it. Measured as the variance of the
 * Laplacian, the native file scores 597 and every route to 2850px scores about
 * 86, including pre-upscaling the master to 3344 with Lanczos, which came out
 * at 85.3 and therefore slightly worse than letting the browser do it.
 *
 * **So do not ship an upscaled master.** It was tried, measured and rejected:
 * 300 KB heavier for a result marginally worse than the browser's own filter.
 * The only real fix is a larger export of the artwork.
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { qualities: [90] },
};

export default nextConfig;
