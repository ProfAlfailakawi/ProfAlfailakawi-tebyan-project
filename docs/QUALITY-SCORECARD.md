# Quality scorecard (round 3, presentation only)

Method: Vite dev server, demo mode (`sessionStorage tebyan_demo_active_v1`), Arabic locale. 31 screens (home + 30 tabs) x 4 viewports (320, 390, 768, 1280) x normal and reduced motion = 248 measurements. Dark mode does not exist in this app, so it was not measured. Harness: axe-core (wcag2a/aa, 21, 22, best-practice) plus overflow, clipped text, console errors, CLS < 0.10, visible focus on the first 30 focusables, stuck-invisible content, computed contrast, running animations under reduced motion.

| | Before | After |
|---|---|---|
| Screens passing every hard check | 2 / 248 | 161 / 248 |
| axe violations (rule x screen) | 189 | 3 |
| Visible-focus failures (H6) | 244 | 16 |
| Contrast failures (H9) | 68 | 40 |

Before = origin/main at round 2. After = this branch.

## Changed (CSS and attributes only, no logic, data, tests or dependencies)
- Focus ring appears instantly: many controls use `transition-all`, so the outline grew from 0 to 2px and read as "no ring" on first Tab. `outline` is now excluded from the transition (`polish.css`). This accounts for most of the H6 drop.
- AA text colours: `text-emerald-600` -> #047857, `text-rose-600` -> #be123c, grey "remove" buttons, `text-zinc-400` secondary text on light surfaces -> #71717a, admin table header text -> #475569. Ripple "plant a seed" label alpha 40% -> 75%.
- Landmarks and headings: `<main>` is focusable (`tabIndex=0`, inset ring only for keyboard focus) so scrollable regions pass; a screen-reader-only `<h1>` carries the route name (every tab had no h1); heading levels fixed in Knowledge Graph and Qawl Fasl lists; MyLibrary card scroller made keyboard-focusable; Analytics log list labelled region.
- Names: era slider in Knowledge Graph, ripple back-to-top button.

## Looked at and left alone
Screenshots at 390 and 1280 judged by eye: home, Qawl Fasl, loyalty, analytics, ripple. Hierarchy, spacing and Arabic typography were already good; no layout, copy or motion was changed this round (round 2 motion is unchanged: transform/opacity, 120-260ms, once, off under reduced motion).

## Remaining failures, and why they are not fixed
- H9 (40, e.g. "توليد الخريطة", "انسج القصة", "حفظ السجل"): these are disabled buttons (opacity .5 while the input is empty). WCAG exempts disabled controls and axe passes them; the harness does not.
- H6 on home and nebula (16): the textarea has `outline-none` but its wrapper shows a lapis ring on focus-within (verified by computed style); harness false positive.
- H5 CLS and H7 stuck-invisible (about 33): intermittent and load-dependent. The machine load average was ~100 during the run, so lazy chunks and entrance transitions were mid-flight at probe time. Different screens fail in different runs (e.g. creativelab contrast 1.0:1 is a mid-fade capture). Not reproduced as a static defect; not changed.
- Real contrast items to revisit: `text-ink-mute` at text-xs on qawlfasl 768 (4.22:1), council result text (axe, 3 nodes), `discover` canvas outside a landmark.
- H8 once (loyalty reduced, 1 animation): not investigated.
- Soft metrics unchanged: text-wall paragraphs (~1000 counted across runs, mostly repeated per viewport), targets under 44px (informational).

## Not viewed
Real-auth and Firestore-backed states, AI result states, modals/drawers, hover and press states, dark mode (none), and the other 26 tabs by eye (scorecard only). Screens rendered at skeleton stage under load were discarded and re-shot.

## Commands
`npm run lint` clean; `npm test` 30/30 pass; `npm run build` succeeds.
