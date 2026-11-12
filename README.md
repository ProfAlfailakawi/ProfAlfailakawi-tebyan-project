# تبيان — Tebyan

مساعد معرفي عربي أولاً: تسأل فيجيبك بالأسلوب الذي تختاره، ويضمّ «قول فصل» (مرجع موثوق لأصعب أسئلة الأطفال ومواقف التربية)، وأدوات للقرار والتخطيط والإبداع ومتابعة التقدّم. الواجهة React + Vite، والذكاء الاصطناعي عبر Gemini (`gemini-2.5-flash`) من خلال وسيط على الخادم فقط، والبيانات في Firebase (Auth + Firestore).

Arabic-first AI knowledge assistant (React + Vite, Gemini via a server-side proxy, Firebase).

- الموقع الحيّ: **https://tebyan.dr-alfailakawi.com** (النطاق المخصّص) — و https://tebyan-app-2026.web.app (موقع Firebase Hosting نفسه)
- قول فصل مباشرة: https://tebyan.dr-alfailakawi.com/qawl/

[![فحص تبيان — قبل النشر](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/ci.yml/badge.svg)](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/ci.yml)
[![Deploy watchdog](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/deploy-watchdog.yml/badge.svg)](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/deploy-watchdog.yml)
[![نشر قواعد Firestore](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/deploy-firestore-rules.yml/badge.svg)](https://github.com/ProfAlfailakawi/tebyan-project/actions/workflows/deploy-firestore-rules.yml)

---

## خريطة الميزات / Feature map

كل خدمة تُفتح برابط مباشر بصيغة `/?tab=<id>` (المعرّفات من [src/constants/serviceRegistry.ts](src/constants/serviceRegistry.ts)، وقراءة الرابط في [src/App.tsx](src/App.tsx)). الأسماء الظاهرة في الجدول هي الأسماء المعتمدة في السجل نفسه.

### أفهم وأتعلم

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| الرئيسية / البوابة الذكية | خانة سؤال واحدة توجّه إلى الخدمة المناسبة، مع بطاقة «جواب مباشر» للحالات الشائعة | [/](https://tebyan.dr-alfailakawi.com/) | [src/components/SmartGateway.tsx](src/components/SmartGateway.tsx)، [src/components/gateway/DirectAnswerCard.tsx](src/components/gateway/DirectAnswerCard.tsx)، [src/components/gateway/directGuidance.ts](src/components/gateway/directGuidance.ts) | يعمل |
| اسأل تبيان | اسأل واختر أسلوب الجواب: واضح، مبسّط، أو قصة | [?tab=ask](https://tebyan.dr-alfailakawi.com/?tab=ask) | [src/components/doors/AskTebyanDoor.tsx](src/components/doors/AskTebyanDoor.tsx)، [src/components/doors/DoorShell.tsx](src/components/doors/DoorShell.tsx) | يعمل |
| قول فصل | أجوبة مراجَعة لأسئلة الأطفال (ماذا تقول/لا تقول/افعل الآن، حسب العمر)، مع طبقة ثقة للمصادر وبحث، وصفحات HTML ثابتة قابلة للفهرسة لكل سؤال منشور | [/qawl/](https://tebyan.dr-alfailakawi.com/qawl/) | [src/components/tabs/QawlFasl/QawlFaslTab.tsx](src/components/tabs/QawlFasl/QawlFaslTab.tsx)، [src/services/qawlFaslService.ts](src/services/qawlFaslService.ts)، [src/lib/qawlSearch.ts](src/lib/qawlSearch.ts)، [src/lib/qawlTrust.ts](src/lib/qawlTrust.ts)، [scripts/generate-qawl-pages.mjs](scripts/generate-qawl-pages.mjs)، البيانات: [qawl_fasl_full_v1.json](qawl_fasl_full_v1.json) | يعمل (الواجهة تبدأ ببيانات احتياطية من [mockData.ts](src/components/tabs/QawlFasl/mockData.ts) ثم تدمج Firestore) |
| المستشار الكلي | يستدعي مستشاراً مناسباً لطبيعة السؤال ويعطي قراءة موزونة | [?tab=oracle](https://tebyan.dr-alfailakawi.com/?tab=oracle) | [src/components/tabs/OracleTab.tsx](src/components/tabs/OracleTab.tsx) | يعمل |
| المفاهيم | يفكّك المصطلح إلى تعريف وروابط وأمثلة | [?tab=concepts](https://tebyan.dr-alfailakawi.com/?tab=concepts) | [src/components/tabs/ConceptsTab.tsx](src/components/tabs/ConceptsTab.tsx) | يعمل |
| مركز المعرفة | واجهة تجمع الاختبارات وخريطة المعرفة ومتابعة السلوك وخارطة الطريق | [?tab=knowledgecenter](https://tebyan.dr-alfailakawi.com/?tab=knowledgecenter) | [src/components/tabs/KnowledgeCenterTab.tsx](src/components/tabs/KnowledgeCenterTab.tsx) | يعمل |
| الخريطة الذهنية | يرسم العلاقات بين الأفكار | [?tab=mindmap](https://tebyan.dr-alfailakawi.com/?tab=mindmap) | [src/components/tabs/MindMapTab.tsx](src/components/tabs/MindMapTab.tsx)، [src/services/geminiService.ts](src/services/geminiService.ts) | يعمل |
| مخطوطة الحقيقة | يحوّل التأملات إلى نص مصقول قابل للحفظ | [?tab=truthmanuscript](https://tebyan.dr-alfailakawi.com/?tab=truthmanuscript) | [src/components/tabs/TruthManuscriptTab.tsx](src/components/tabs/TruthManuscriptTab.tsx) | يعمل |
| آلة الزمن | يقرأ كيف نشأت فكرة أو قرار وما السيناريوهات المحتملة | [?tab=timemachine](https://tebyan.dr-alfailakawi.com/?tab=timemachine) | [src/components/tabs/TimeMachineTab.tsx](src/components/tabs/TimeMachineTab.tsx) | يعمل |
| خريطة المعرفة | كل سؤال سألته يصير نقطة في شبكة تُظهر الروابط بين أفكارك | [?tab=knowledgegraph](https://tebyan.dr-alfailakawi.com/?tab=knowledgegraph) | [src/components/tabs/KnowledgeGraphTab.tsx](src/components/tabs/KnowledgeGraphTab.tsx) | يعمل |

### أحسم وأنجز

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| غرفة القرار | موازنة الخيارات وكشف المخاطر وسماع الرأي المخالف | [?tab=decisionroom](https://tebyan.dr-alfailakawi.com/?tab=decisionroom) | [src/components/doors/DecisionDoor.tsx](src/components/doors/DecisionDoor.tsx)، [src/components/tabs/DecisionExecutiveTab.tsx](src/components/tabs/DecisionExecutiveTab.tsx) | يعمل |
| المجلس | يعرض القضية على آراء متعددة قبل الحسم | [?tab=council](https://tebyan.dr-alfailakawi.com/?tab=council) | [src/components/tabs/CouncilTab.tsx](src/components/tabs/CouncilTab.tsx) | يعمل |
| الميدان الاستراتيجي | واجهة تجمع المجلس وآلة الزمن والمحاكاة | [?tab=strategicarena](https://tebyan.dr-alfailakawi.com/?tab=strategicarena) | [src/components/tabs/StrategicArenaTab.tsx](src/components/tabs/StrategicArenaTab.tsx) | يعمل |
| المحاكاة | حوار تفاعلي لموقف (مقابلة، تفاوض…) ثم تحليل للأداء | [?tab=simulation](https://tebyan.dr-alfailakawi.com/?tab=simulation) | [src/components/tabs/SimulationTab.tsx](src/components/tabs/SimulationTab.tsx) | يعمل |
| مختبر الأفكار | توليد أفكار جديدة وتحليل فكرتك من عدة زوايا | [?tab=lab](https://tebyan.dr-alfailakawi.com/?tab=lab) | [src/components/tabs/LabTab.tsx](src/components/tabs/LabTab.tsx) | يعمل (التسجيل بالكاميرا/الميكروفون داخله تجريبي — انظر الملاحظة أسفل الجداول) |

### أبتكر وأصوغ

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| المختبر الإبداعي | واجهة تجمع مختبر الأفكار والمفاهيم والخريطة الذهنية والقصة وأثر الفراشة والمخطوطة | [?tab=creativelab](https://tebyan.dr-alfailakawi.com/?tab=creativelab) | [src/components/tabs/CreativeLabWrapper.tsx](src/components/tabs/CreativeLabWrapper.tsx) | يعمل |
| القصة | يحوّل الموضوع إلى قصة توضّح المعنى | [?tab=story](https://tebyan.dr-alfailakawi.com/?tab=story) | [src/components/tabs/StoryTab.tsx](src/components/tabs/StoryTab.tsx) | يعمل |
| تبيان الروابط (AR) | طبقات بصرية فوق بث الكاميرا | [?tab=ar](https://tebyan.dr-alfailakawi.com/?tab=ar) | [src/components/tabs/ARTab.tsx](src/components/tabs/ARTab.tsx) | تجريبي — الكاميرا محجوبة على الموقع الحيّ (انظر الملاحظة) |

### أخطط وأقيس

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| خارطة الطريق | يحوّل الهدف إلى مراحل عملية | [?tab=roadmap](https://tebyan.dr-alfailakawi.com/?tab=roadmap) | [src/components/tabs/RoadmapTab.tsx](src/components/tabs/RoadmapTab.tsx) | يعمل |
| الاختبارات | أسئلة قصيرة تكشف فجوات الفهم | [?tab=quizzes](https://tebyan.dr-alfailakawi.com/?tab=quizzes) | [src/components/tabs/QuizTab.tsx](src/components/tabs/QuizTab.tsx) | يعمل |
| متابعة السلوك | ملاحظات يومية يقرأ منها الذكاء الاصطناعي الأنماط المتكررة | [?tab=analytics](https://tebyan.dr-alfailakawi.com/?tab=analytics) | [src/components/tabs/AnalyticsTab.tsx](src/components/tabs/AnalyticsTab.tsx) | يعمل |

### رحلتي

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| خطتي وتقدمي | من الهدف إلى خطة بمراحل ومتابعة التقدّم | [?tab=growth](https://tebyan.dr-alfailakawi.com/?tab=growth) | [src/components/doors/GrowthDoor.tsx](src/components/doors/GrowthDoor.tsx) | يعمل |
| أثر الفراشة | مجتمع أفكار: ازرع فكرة ويبني عليها الآخرون (Firestore) | [?tab=ripple](https://tebyan.dr-alfailakawi.com/?tab=ripple) | [src/components/tabs/RippleEffectTab.tsx](src/components/tabs/RippleEffectTab.tsx)، [src/components/tabs/NebulaTab.tsx](src/components/tabs/NebulaTab.tsx) | يعمل |
| ركني | مساحتك: المكتبة والمكافآت وباب التواصل | [?tab=rukni](https://tebyan.dr-alfailakawi.com/?tab=rukni) | [src/components/doors/RukniDoor.tsx](src/components/doors/RukniDoor.tsx) | يعمل |
| مكتبتي | الأسئلة والأجوبة والمخطوطات المحفوظة | [?tab=mylibrary](https://tebyan.dr-alfailakawi.com/?tab=mylibrary) | [src/components/tabs/MyLibraryTab.tsx](src/components/tabs/MyLibraryTab.tsx)، [src/lib/localUserData.ts](src/lib/localUserData.ts) | يعمل |
| التقدم والمكافآت | النقاط والأوسمة | [?tab=loyalty](https://tebyan.dr-alfailakawi.com/?tab=loyalty) | [src/components/tabs/LoyaltyTab.tsx](src/components/tabs/LoyaltyTab.tsx)، [src/components/GamificationProvider.tsx](src/components/GamificationProvider.tsx) | يعمل |
| تواصل معنا | نموذج يكتب طلباً محدود الحجم في `contact_requests` | [?tab=contact](https://tebyan.dr-alfailakawi.com/?tab=contact) | [src/components/tabs/ContactTab.tsx](src/components/tabs/ContactTab.tsx)، [src/lib/contactRequest.ts](src/lib/contactRequest.ts) | يعمل |
| كل الخدمات | دليل الخدمات مجمّعاً حسب الفئة | [?tab=discover](https://tebyan.dr-alfailakawi.com/?tab=discover) | [src/components/ServiceExplorer.tsx](src/components/ServiceExplorer.tsx) | يعمل |

### ميزات المنصة

| الميزة | ما تفعله | الرابط المباشر | الشيفرة | الحالة |
|---|---|---|---|---|
| لوحات الإدارة | المستخدمون، إدارة قول فصل (رفع/توليد جماعي)، الرسائل، اللوحة العامة — تظهر للمشرف فقط | — (للمشرف) | [src/components/AdminDashboard.tsx](src/components/AdminDashboard.tsx)، [src/components/AdminUsersDashboard.tsx](src/components/AdminUsersDashboard.tsx)، [src/components/tabs/QawlFasl/AdminQawlFasl.tsx](src/components/tabs/QawlFasl/AdminQawlFasl.tsx)، [src/components/tabs/AdminContactTab.tsx](src/components/tabs/AdminContactTab.tsx)، [src/lib/adminAccess.ts](src/lib/adminAccess.ts) | يعمل |
| العرض التجريبي | دخول مقصود بـ `?demo=1`: لا كتابة إلى Firestore، ولا Auth حقيقي، وردود ذكاء اصطناعي محلية؛ الزر الظاهر مطفأ افتراضياً | [/?demo=1](https://tebyan.dr-alfailakawi.com/?demo=1) | [src/lib/demoMode.ts](src/lib/demoMode.ts)، [src/lib/demoAi.ts](src/lib/demoAi.ts)، [src/lib/demoStorage.ts](src/lib/demoStorage.ts)، [src/lib/firestoreWrites.ts](src/lib/firestoreWrites.ts)، الشرح: [docs/DEMO-ENTRY.md](docs/DEMO-ENTRY.md) | يعمل |
| تطبيق ويب قابل للتثبيت (PWA) والتحديث | عامل خدمة، بصمة بناء في `build-id.json`، وصفحة «نُحدّث البرنامج» بدل صفحة خطأ | [/updating.html](https://tebyan.dr-alfailakawi.com/updating.html) | [public/sw.js](public/sw.js)، [src/lib/app-update.ts](src/lib/app-update.ts)، [scripts/build-stamp.mjs](scripts/build-stamp.mjs)، [public/updating.html](public/updating.html)، [scripts/verify-pwa.mjs](scripts/verify-pwa.mjs) | يعمل (فحص `/api/version` لا يجد مساراً في الإنتاج — انظر الملاحظة) |
| سياسة الخصوصية | صفحة ثابتة غير مربوطة من القائمة | [/privacy-policy.html](https://tebyan.dr-alfailakawi.com/privacy-policy.html) | [public/privacy-policy.html](public/privacy-policy.html) | يعمل |
| مستشعر ORBIT | يرسل ملاحظات أخطاء المتصفح مجهولة الهوية إلى ORBIT | — | [public/orbit-sensor.js](public/orbit-sensor.js) | يعمل |
| تطبيق Apple (iOS/iPadOS/Mac) | غلاف Capacitor أصلي مع بيانات المتجر وسكربت إصدار | — | [apple/](apple/)، [apple/apple-release.sh](apple/apple-release.sh)، [apple-release/](apple-release/) | قيد التطوير (يحتاج Mac و Xcode؛ لم يُتحقق من نشره) |

**ملاحظة على الكاميرا والميكروفون:** ترويسة `Permissions-Policy` في [firebase.json](firebase.json) تضبط `camera=(), microphone=()`، فيرفض المتصفح `getUserMedia` على الموقع الحيّ؛ لذلك «تبيان الروابط» والتسجيل داخل مختبر الأفكار لا يعملان هناك حتى يُعدَّل هذا الإعداد.

---

## البنية / Architecture

- **الواجهة:** React 18 + Vite 6 + Tailwind 4، بلا React Router؛ التنقّل بين الخدمات عبر `?tab=` و `/qawl/<id>` داخل [src/App.tsx](src/App.tsx). سجلّ الخدمات وأسماؤها في [src/constants/serviceRegistry.ts](src/constants/serviceRegistry.ts).
- **الذكاء الاصطناعي:** الواجهة لا تحمل مفتاح Gemini؛ كل النداءات تمرّ عبر [src/lib/aiProxy.ts](src/lib/aiProxy.ts) إلى `/api/ai/*`. المفتاح في Google Secret Manager باسم `GEMINI_API_KEY` (القواعد في [AGENTS.md](AGENTS.md)).
- **الخادم في الإنتاج:** Cloud Function باسم `api` في [functions/index.js](functions/index.js) (Express: حدّ للطلبات، App Check، إعادة المحاولة عند أخطاء Gemini المؤقتة)، موصولة بـ `/api/**` في [firebase.json](firebase.json). الملف [functions/src/index.ts](functions/src/index.ts) قديم ومعلَّم «لا يُنشر».
- **الخادم المحلي/البديل:** [server.ts](server.ts) (يُشغَّل بـ `npm run dev`، ويُبنى إلى `dist/server.js`)، ويجب أن يبقى مطابقاً سلوكياً للدالة.
- **البيانات:** Firebase Auth + Firestore ([src/lib/firebase.ts](src/lib/firebase.ts))، والقواعد في [firestore.rules](firestore.rules)، و App Check في [src/lib/appCheck.ts](src/lib/appCheck.ts).

| نقطة الخادم | الوصف | الملف |
|---|---|---|
| `GET /api/health` | فحص الحياة | [functions/index.js](functions/index.js)، [server.ts](server.ts) |
| `POST /api/ai/generate` | توليد نص عبر Gemini | [functions/index.js](functions/index.js)، [server.ts](server.ts) |
| `POST /api/ai/audio` | توليد صوت | [functions/index.js](functions/index.js)، [server.ts](server.ts) |
| `GET /api/version` | بصمة البناء — موجودة في `server.ts` فقط، لا في الدالة | [server.ts](server.ts) |

المجلدات: `src/components` (الشاشات، و `tabs/` للخدمات، و `doors/` للأبواب الأربعة) · `src/lib` و `src/services` (المنطق) · `functions/` (دالة الإنتاج) · `scripts/` (فحوص البناء والتوليد) · `tests/` · `public/` (ملفات ثابتة، و `public/qawl/` مولّدة) · `apple/` و `apple-release/` (تطبيق Apple) · `docs/`.

---

## التشغيل محلياً / Run locally

المتطلبات: Node.js 22 (كما في CI). لتشغيل نداءات الذكاء الاصطناعي محلياً ضع `GEMINI_API_KEY` في ملف `.env.local` غير متتبَّع (لا تضعه في أي ملف داخل المستودع).

```bash
npm ci
npm run dev   # http://localhost:3000 عبر server.ts
```

| السكربت | ما يفعله |
|---|---|
| `npm run dev` | يشغّل [server.ts](server.ts) مع Vite في وضع التطوير |
| `npm run build` | `verify:pwa` ثم `verify:demo` ثم توليد صفحات قول فصل، ثم `vite build`، ثم حزم `server.ts` إلى `dist/server.js` |
| `npm start` | يشغّل `dist/server.js` |
| `npm run preview` | معاينة `vite preview` |
| `npm run lint` | فحص الأنواع `tsc --noEmit` |
| `npm test` | الاختبارات `tsx --test tests/*.test.ts` |
| `npm run verify:pwa` | حارس ملفات PWA ([scripts/verify-pwa.mjs](scripts/verify-pwa.mjs)) |
| `npm run verify:demo` | يتحقق أن كل كتابة إلى Firestore تمرّ بحارس العرض ([scripts/verify-demo-write-guard.mjs](scripts/verify-demo-write-guard.mjs)) |
| `npm run clean` | يحذف `dist` |
| `npm run deploy` | بناء ثم `firebase deploy --only functions:api,hosting,firestore:rules` (يدوي، يحتاج صلاحيات Firebase) |

---

## الاختبارات وبوابات الجودة / Tests & quality gates

- الاختبارات في [tests/](tests/) (Node test runner عبر `tsx`)، منها: [tests/ai-request-integrity.test.ts](tests/ai-request-integrity.test.ts)، [tests/no-fake-analysis.test.ts](tests/no-fake-analysis.test.ts)، [tests/qawl-trust.test.ts](tests/qawl-trust.test.ts)، [tests/qawl-search.test.ts](tests/qawl-search.test.ts)، [tests/navigation-integrity.test.ts](tests/navigation-integrity.test.ts)، [tests/demo-mode.test.ts](tests/demo-mode.test.ts)، [tests/contact-request.test.ts](tests/contact-request.test.ts)، [tests/sw-static-pages.test.ts](tests/sw-static-pages.test.ts)، [tests/updating-page.test.ts](tests/updating-page.test.ts)، [tests/duo-layout.test.ts](tests/duo-layout.test.ts).
- [.github/workflows/ci.yml](.github/workflows/ci.yml) يشغّل على كل push و PR إلى `main`: `npm ci` ثم `npm run lint` ثم `npm run build`. (لا يشغّل `npm test` حالياً.)
- مراجعات سابقة: [SECURITY-TODO.md](SECURITY-TODO.md)، [TEBYAN-REVIEW-NOTES.md](TEBYAN-REVIEW-NOTES.md)، [docs/QUALITY-SCORECARD.md](docs/QUALITY-SCORECARD.md)، [docs/VISUAL-POLISH-AUDIT.md](docs/VISUAL-POLISH-AUDIT.md).

---

## النشر / Deployment

مشروع Firebase: `tebyan-app-2026` ([.firebaserc](.firebaserc)). الدخول من GitHub بلا مفتاح مخزَّن (Workload Identity).

| ما يُنشر | كيف | متى |
|---|---|---|
| Firebase Hosting (الواجهة) | مهمة `deploy` في [.github/workflows/ci.yml](.github/workflows/ci.yml)، ثم تتحقق أن الموقع الحيّ يقدّم `build-id.json` لهذا الالتزام | تلقائياً عند كل push إلى `main` بعد نجاح الفحص |
| قواعد Firestore | [.github/workflows/deploy-firestore-rules.yml](.github/workflows/deploy-firestore-rules.yml) | يدوياً فقط (workflow_dispatch) |
| دالة `api` (Cloud Functions) | `npm run deploy` من جهاز المالك | يدوياً — **لا** يوجد workflow ينشرها |
| مراقبة النشر | [.github/workflows/deploy-watchdog.yml](.github/workflows/deploy-watchdog.yml) يقارن التزام الموقع الحيّ بـ `main` | كل ساعة (cron) أو يدوياً |

تطبيق Apple يُبنى ويُرفع بسكربت [apple/apple-release.sh](apple/apple-release.sh) على Mac (قائمة الإصدار: [apple-release/checklists/release.md](apple-release/checklists/release.md)).

---

آخر تحديث للتوثيق: 2026-11-12
