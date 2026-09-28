# Afterscale hero design QA — 8 September 2026

final result: passed

## Current brief and comparison
The user allowed option 1 or 2, preferring a natural result. Option 1 (Tidal Field)
was selected for its text-left, illustration-right composition. During review the
user rejected the first implementation as a pasted PNG with a mismatched ground
and requested a redo. That correction takes precedence over image-to-code's
generic requirement to retain raster artwork. The final illustration is actual
procedural geometry, not a pixel-for-pixel recreation of the generated wave.

Reference:
C:/Users/Christopher Hanryan/.codex/generated_images/01a07ecd-93ca-72c0-9015-b16191e0e7cb/exec-a7530262-a479-44ad-8d36-b17099e2be29.png

Implementation: http://localhost:3000/
Desktop capture:
C:/Users/Christopher Hanryan/Downloads/New_Startup/output/afterscale-site-review-2026-09-08/07-home-live-field-desktop.png

Phone capture:
C:/Users/Christopher Hanryan/Downloads/New_Startup/output/afterscale-site-review-2026-09-08/08-home-live-field-390.png

Reference and implementation were opened together in the same comparison input.
Both show the opening on cream; animation was paused for the comparison. The
reference is 1586 × 992. The final browser capture is 1586 × 993; the one-pixel
height difference is capture rounding. Browser viewport override compensates for
the in-app capture excluding its scrollbar gutter. No screenshot was retouched.
The readable full-size comparison and separate phone view were sufficient to
inspect the type, links, frame and background; no zoomed crops were necessary.

## Findings and corrections
- P1, resolved: opaque raster background and warped image read as pasted art.
  Removed the image import and generated PNG from the implementation. The canvas
  clears to alpha zero, uses normal compositing, and draws the field's points.
  Browser inspection confirms zero hero images and a transparent canvas ground.
- P2, resolved: controls sat over dense illustration. Moved them to the clear
  lower edge of the hero with a 44px pause button.
- P2, resolved: navigation compressed at 640px and wrapped hit areas overlapped
  at the smallest width. The header stays stacked below 768px, with 44px links
  and no negative vertical link margin. Browser geometry confirms zero
  overlapping navigation targets at 320, 640 and 768px.
- P2, resolved: mobile headline depended on whitespace across desktop line
  spans. Mobile now renders the complete sentence as one text run.

## Required fidelity surfaces
- Typography: existing Archivo and Martian Mono retained; the large four-line
  mission, smaller explanatory paragraph and two underlined links preserve the
  selected hierarchy. Mobile wraps the complete sentence naturally. Existing
  type metrics differ slightly from the generated mock.
- Spacing: split desktop composition retained, with art below copy on phones.
  The research section now follows immediately and aligns with the hero gutter.
  The final desktop opening is slightly taller than the reference to accommodate
  the existing font metrics and the added motion control.
- Colors: existing cream #f1eee8, ink #14120e and rose #962a45. The particle
  renderer reads ink and rose directly from these CSS tokens. Transparency
  eliminates any separate illustration background or blend-mode color seam.
- Artwork: a 35,200-point moving surface, reduced to half the points for narrow
  canvases, with a geometric aperture and rose accent. A sharper, lighter field
  is intentional after the user's PNG rejection. No image texture, raster warp,
  fake chart, research measurement, or invented result is present.
- Copy: selected mock's mission and explanation retained, with research in
  formation and not demonstrated clearly stated. Existing research, all six
  open-decision rows, updates, contact and other route content remain available.

## Verification
- Production build passed, including TypeScript and static generation.
- Dedicated typecheck passed during implementation.
- No browser error or warning entries in the inspected preview log.
- Main research CTA and shared Vision, Evidence, Contact navigation exercised;
  all reached the expected routes. Returning home recreated the live field.
- Pause / resume verified through UI and pressed state.
- Separate running captures have a mean RGB difference of about 14.5 levels in
  the wave region, confirming visible motion. Paused captures have exactly zero
  difference in the same region.
- Scrolling the hero out of view changed motion state from running to idle.
- No horizontal overflow at 320, 390, 640, 768 and desktop widths.
- Header navigation targets measure 44px and do not overlap after the fix.
- git diff --check passed; existing Windows line-ending notices remain.

## Limits and follow-up
Reduced-motion preference handling, hidden-tab stopping, WebGL context recovery,
and the Canvas 2D fallback were inspected in source but not forced in the browser;
the available preview controls do not expose media emulation. No physical-phone
performance benchmark or external form submission was performed. These are
verification limits, not claimed tests. The social preview image remains the
existing card and can be refreshed separately. The broader worktree already
contained substantial user changes; no commit or deployment was made.

## Completed checklist
- Replace the rejected PNG approach with transparent, animated geometry.
- Keep cream, ink and rose and the selected split composition.
- Preserve working navigation and research content.
- Add pause and reduced-motion handling, stop offscreen, release GPU resources.
- Inspect final desktop and phone views, verify interactions, complete build.

