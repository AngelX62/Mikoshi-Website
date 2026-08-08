# public/

Static assets, served from the site root.

## The proof photograph

Drop a photo of a real machine-tending cell here as `cell.jpg`, then set `src`
in `src/content.ts` to `"/cell.jpg"`. Nothing else needs changing.

It is not displayed as an image. It is sampled into the dither field and drawn
with the same halftone, ramp and scroll smear as everything else on the page,
which is the site's own argument applied to itself.

What survives that process:

- **Composition and silhouette.** One pixel is sampled per grid cell, so fine
  detail is discarded. A clear shape reads; a busy frame does not.
- **Contrast.** The ramp has eight levels. A picture that is already close to
  black and white lands across all of them. A flat, evenly lit one collapses
  into two or three and reads as grey noise.
- **Landscape framing, 2000px or wider.** It is cover-fitted to the viewport,
  so the short edge is cropped.

Sharpness, colour and resolution beyond that are thrown away.
