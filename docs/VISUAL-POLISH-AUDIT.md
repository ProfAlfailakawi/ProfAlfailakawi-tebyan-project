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
