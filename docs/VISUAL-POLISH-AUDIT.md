# Visual polish audit

Scope: presentation only. Method: demo mode (`sessionStorage tebyan_demo_active_v1`) rendered with Vite at 390px and 1280px, via `?tab=<id>`.
No horizontal overflow was found on any of the 30 routes checked (ask, qawlfasl, oracle, concepts, knowledgecenter, mindmap, truthmanuscript, timemachine, council, strategicarena, creativelab, ar, story, roadmap, quizzes, analytics, mylibrary, loyalty, contact, decisionroom, simulation, lab, knowledgegraph, growth, ripple, rukni, nebula, services, adminusers, adminmessages) plus home.
Not rendered: real-auth/Firestore-backed states, and scrolled states inside inner scroll containers (checked with tall viewports instead).

## Findings and changes
| Screen | Finding | Action |
|---|---|---|
| Qawl Fasl home (`HomeView.tsx`) | Header paragraph repeated the TabHeader description directly above it; emergency card had a 2-line explainer under a heading that already says it | Header paragraph hidden below md; emergency copy shortened to one line. Trust/citation logic untouched |
| Decision room (`DecisionExecutiveTab.tsx`) | Three stacked explanatory lines (door subtitle, "بيئة استراتيجية…", "إذا احتجت عمقاً…") | Both extra paragraphs hidden below md (kept on desktop) |
| Creative lab (`LabTab.tsx`) | "اختر مقصدك أولاً…" repeated the header description | Hidden below md |
| Service explorer (`ServiceExplorer.tsx`) | Category descriptions repeat what the cards say | Hidden below md |

## Reviewed and deliberately left alone
- Home: already calm (single input, one example, one CTA).
- Tab headers: descriptions are intentionally shown in full (owner comment in index.css), unchanged.
- Door hint strings, tour copy, demo fixtures: possibly test- or tour-referenced.
- Ripple, Rukni, Analytics, Growth, Loyalty, Library, Oracle, Council, Simulation, Time machine, Mind map, Story, AR, Quiz, Roadmap, Contact, Nebula, Knowledge graph, Truth manuscript, Admin screens, Login, onboarding, PWA prompt: reviewed in screenshots; hierarchy is already clear, and no change clearly benefited.
- Letter-spaced Arabic eyebrow labels were inspected; they render joined, so unchanged.

## Round 2
New layers, loaded last in `src/main.tsx`: `src/styles/polish.css` (static) and `src/styles/motion.css` (motion). No component, logic, test or dependency was edited.

Method: demo mode on a private Vite port, 390px and 1280px, all 31 routes (home + 30 tabs) screenshotted before and after with a tall viewport (the app scrolls inside `main`). Viewed: home, qawlfasl, decisionroom, creativelab, loyalty, ask, oracle, council (before/after pairs) and every other tab as before-contact sheets. Horizontal overflow: none on any of the 62 after-shots. After-shots of unchanged-markup screens are pixel-equivalent by design (end state of all motion equals the static look).

### Changes
- Action colour: DNA kit accent (`--dna-accent`, lilac tone) now follows the lapis identity instead of pale plum; the Oracle/Ask "تشغيل" button (was dark plum next to lapis CTAs) uses lapis (same `@layer base` so source order wins over the existing `!important`).
- Typography: `text-wrap: balance` on headings, `pretty` on short paragraphs (no text changed).
- Empty states (`.dna-void`): soft lapis halo and tile shadow behind the icon.
- Focus ring colour follows lapis (still `:focus-visible` only).

### Motion inventory (tokens: ease `cubic-bezier(.2,.7,.2,1)`, 120/180/260ms, 40ms step)
| What | Trigger | Duration | Scope |
|---|---|---|---|
| Fade + rise 8px of card/row children (max 8, 40ms stagger) | on insertion, once | 260ms | qawlfasl, decisionroom, creativelab, lab, loyalty, mylibrary, rukni, analytics, growth, discover, knowledgecenter only |
| Progress-bar fill scaleX to its real width | on insertion, once | 520ms | `h-full rounded-full` fills with inline width (Qawl Fasl category bars); not quizzes/admin/transitioning bars |
| `<details>` content fade | open | 180ms | global |
| Hover lift translate -1px + soft shadow | hover (hover-capable devices) | 180ms | large rounded cards/buttons in route shell |
| Arrow icon nudge 3px | hover | 180ms | `lucide-arrow-left` inside button/link |
| Press scale .98 | active | 180ms | buttons without their own active:scale |

Uses `animation-fill-mode: backwards` so no transform remains after the animation (no new containing block). All of it sits in `@media (prefers-reduced-motion: no-preference)`. Measured with Playwright: with normal motion, 25 animated elements in Qawl Fasl ended at opacity 1 / transform none and none still running after 3.7s; with `reducedMotion: 'reduce'` zero elements carried my animations.

### Already present, deliberately not duplicated
Tab cross-fade (framer-motion in `App.tsx`, `MotionConfig reducedMotion="user"`), TabHeader entrance, DNA rings/sparklines/timelines/steppers (`useFirstView`, play-once), loader assembly, modal/drawer AnimatePresence.

### Left alone and why
- Quizzes, Truth manuscript (Quran/long text), Story, Ask, Contact, Council/Oracle/Concepts outputs, admin screens: no staggering (reading, typing, exam, long AI output, tables).
- Admin users/messages mobile cards with text buttons: kept for 44px touch targets and logic-bound titles.
- Tab-header descriptions (owner request), citation/trust UI, demo fixtures, strings (none edited).
- Focus-ring animation and active-nav indicator slide: not done (outline-offset/left would break the transform/opacity-only rule; nav indicator needs markup change).
- Services tab id is `discover`; `?tab=services` just renders home.

### Not verified
Real-auth/Firestore states, results states after an actual AI call, modals/drawers other than static, hover/press states (CSS inspected, not hovered in a browser), and dark mode (none exists).
