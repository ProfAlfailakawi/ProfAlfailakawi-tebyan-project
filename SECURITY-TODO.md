# SECURITY-TODO — إصلاحات مؤجّلة تحتاج موافقة المالك واختباراً

> **آخر تحديث:** البندان 1 و 2 عولجا في الكود (راجع تفاصيلهما أدناه). البند 1 صار
> **افتراضه في الإنتاج «مراقبة فقط»** فلا يكسر نقاط الذكاء الاصطناعي بعد النشر ولو لم
> تُضبط reCAPTCHA بعد؛ خطوات المالك صارت لـ**رفع الحماية للتشديد الكامل** لا لمنع الكسر.
> البند 3 **قرار صريح للمالك بعدم التغيير** — لا تمسّه. بقيّة البنود ما زالت مفتوحة.

الجولة الأولى كانت **آمنة فقط** (حذف ملفات غير مرجعية، نقل تقارير، تغيير اسم الحزمة).
البنود التالية تحتاج قرار المالك:

## 1. الوكيل المفتوح لتوليد الذكاء الاصطناعي — ✅ عولج في الكود، ⚠️ يحتاج خطوة إعداد قبل النشر
- الملفات: `functions/index.js` (النقطة الحيّة — `firebase.json` يوجّه `/api/**` إلى الدالة `api`)،
  و`server.ts` (خادم Cloud Run / التطوير)، و`src/lib/aiProxy.ts` + `src/lib/appCheck.ts` (العميل).
- ما كان: `cors({ origin: true })` يسمح لأي موقع، و`appCheckOk()` ترجع `true` دائماً ما لم
  يُضبط `APP_CHECK_ENFORCE=true`. أي طرف يستهلك مفتاح Gemini الخاص بالمالك.
- ما صار:
  1. **CORS مقيّد بقائمة بيضاء.** الافتراض الآمن: `https://tebyan.dr-alfailakawi.com` و
     `https://tebyan-clean-2026.web.app` و `https://tebyan-clean-2026.firebaseapp.com`،
     و`localhost` **في التطوير فقط**. يمكن تجاوز القائمة بمتغيّر البيئة
     `TEBYAN_ALLOWED_ORIGINS` (قيم مفصولة بفواصل).
     - ملاحظة مقصودة: الطلبات **بلا ترويسة `Origin`** (نفس الأصل، curl، فحوص الجاهزية) تمرّ.
       منعها لا يضيف أماناً — المهاجم ببساطة لا يرسل الترويسة — لكنه يكسر حركة شرعية.
       الضابط الحقيقي ضد السكربتات هو App Check أدناه.
  2. **App Check يتحقّق ويسجّل في الإنتاج، وافتراضه «مراقبة فقط» (يخدم الطلب).**
     - الافتراض في الإنتاج: يتحقّق من الرمز ويسجّل، لكن **يخدم** الطلب الفاشل بدل رفضه
       بـ401 — حتى لا يكسر النشر قبل ضبط `VITE_RECAPTCHA_SITE_KEY`. حماية CORS وحدّ
       المعدّل تبقيان قائمتين.
     - `APP_CHECK_ENFORCE=true` → **رفض صارم** لأي رمز مفقود/غير صالح (في أي بيئة). هذا
       هو الـopt-in لإغلاق الوكيل تماماً بعد تأكّد وصول الرموز.
     - `APP_CHECK_MONITOR_ONLY=false` → في الإنتاج، فرض الرفض الصارم صراحةً حتى بلا
       `APP_CHECK_ENFORCE`.
     - `APP_CHECK_ENFORCE=false` → في الإنتاج يبقى يتحقّق ويسجّل (لا يُفتح تماماً)؛ في
       التطوير مُطفأ.
  3. **العميل صار يرسل الترويسة** `X-Firebase-AppCheck` مع كل نداء إلى `/api/ai/generate`
     و`/api/ai/audio` (لم تكن تُرسل من قبل إطلاقاً، فتفعيل App Check دونها كان سيقطع الموقع).
  4. **حدّ المعدّل** كان موجوداً على `/generate` وبقي (60 طلباً/دقيقة/IP لكل نسخة)، وصار قابلاً
     للضبط عبر `TEBYAN_AI_RATE_MAX` و`TEBYAN_AI_RATE_WINDOW_MS`. وأُضيف الحدّ إلى مسار
     `/api/ai/audio` في `server.ts` (كان بلا حدّ إطلاقاً).
  5. النقطة **لا تتطلّب مصادقة مستخدم** ولم أضِف ذلك: الموقع يسمح بالاستخدام كـ«ضيف» بلا
     تسجيل دخول، وإلزام Firebase Auth كان سيقطع هؤلاء.

### ⚠️ مطلوب من المالك قبل نشر الدالة (وإلا سترجع نقاط الذكاء الاصطناعي 401)
1. في وحدة تحكّم Firebase → App Check: سجّل تطبيق الويب بمزوّد **reCAPTCHA v3**.
2. اضبط `VITE_RECAPTCHA_SITE_KEY` في بيئة **البناء** (Cloud Build / `.env`) ثم أعد بناء الواجهة،
   وإلا لن يرسل المتصفّح أي رمز App Check.
3. للطرح الآمن: انشر أولاً بـ `APP_CHECK_MONITOR_ONLY=true`، راقب سجلّات الدالة 24 ساعة
   للتأكّد من وصول الرموز، ثم **احذف المتغيّر** ليصير الإجبار فعلياً.
4. إن كان للموقع نطاق إضافي غير المذكور أعلاه، أضِفه إلى `TEBYAN_ALLOWED_ORIGINS`.

### ما بقي مفتوحاً هنا
- `server.ts` (Cloud Run / dev) **لا يتحقّق من App Check**: `firebase-admin` ليس ضمن تبعيات
  الجذر، وإضافته تبعيةً ثقيلة لمسار غير حيّ. ضُيّق CORS وحدّ المعدّل فيه فقط. المسار الحيّ
  اليوم هو دالة `api`، فالتحصين الفعلي مطبَّق حيث يهمّ.
- `/api/health` ما زال يكشف طول مفتاح Gemini (`geminiKeyLength`). تسريب ضئيل، تُرك دون تغيير.

## 2. تصعيد الصلاحيات في firestore.rules (role escalation) — ✅ منشور الآن
- الملف: `firestore.rules`، القاعدة `match /users/{userId}`.
- الحماية **موجودة في القواعد الفعلية** (أُدخلت في الالتزام `4716774` ودُمجت إلى main):
  - `create`: يُمنع إنشاء المستند بحقل `role == 'admin'`.
  - `update`: يجب أن يبقى `role` كما هو حرفياً؛ لا يستطيع المستخدم ترقية نفسه.
- ما أُضيف في هذه الجولة: استثناء `|| isAdmin()` على الشرطين. **ليس ثغرة**: الدالة `isAdmin()`
  لا يمكن منحها للنفس — فهي تتحقّق من UID مالك ثابت، أو قائمة بريد مالكين ثابتة، أو وجود
  مستند `/admins/{uid}` والكتابةُ عليه مقيّدة بنفس قائمة البريد الثابتة. بدون هذا الاستثناء
  كانت مزامنة ملف المالك نفسه في `src/components/AuthProvider.tsx` (تكتب `role:'admin'` على
  مستند المالك عند تسجيل الدخول) تُرفض دائماً.
- `DRAFT_firestore.rules` **مهجور ولا يجوز نشره**؛ أُضيفت في رأسه لافتة تحذير. مراجعته سطراً
  سطراً أظهرت أنه كان سيُسقط الموقع: يعلن منعاً افتراضياً ثم يعرّف `/users` فقط، فتُمنع كل
  المجموعات التي يعتمد عليها التطبيق (`ripples`, `daily_prompts`, `qawl_fasl_questions`,
  `system_settings`, `system_config`, `search_logs`, `ai_logs`, `analytics`, `admins`).
  كما أن `incoming().role == 'user'` يمنع مزامنة المالك، و`incoming().email == request.auth.token.email`
  يمنع أي حساب بلا بريد، و`allow list: if false` يكسر قائمة المستخدمين في لوحة الإدارة.

### ما بقي مفتوحاً هنا (سابق لهذه الجولة، لم أوسّع الصلاحيات من تلقاء نفسي)
- إدارةُ المدير لمستندات **مستخدمين آخرين** ما زالت ممنوعة، لأن الشرط `request.auth.uid == userId`
  قائم منذ ما قبل إصلاح التصعيد. المتأثر: `AdminUsersDashboard.tsx` (`saveEdit` و`deleteUser`)
  و`LoyaltyTab.tsx`. هذه ليست ارتداداً من هذه الجولة، وتوسيعها تخفيفٌ للقواعد لم يُطلب مني.
  إن أراد المالك استعادتها فالإضافة المطلوبة داخل `match /users/{userId}`:
  ```
  allow update, delete: if isAdmin();
  ```
  (يجب اختبارها على محاكي القواعد قبل النشر.)
- عُدِّل زرّ «إصلاح الصلاحيات يدوياً» في `AdminUsersDashboard.tsx` ليتحمّل رفضَ القواعد لكتابة
  `role:'admin'` بدل أن يُبلّغ عن فشل الإصلاح كلّه — فالمستند `/admins/{uid}` هو ما يمنح الصلاحية فعلاً.
- النشر: `firebase deploy --only firestore:rules` (لم أنشر أنا شيئاً؛ الدفع إلى الفرع فقط).

## 3. النشر الآلي للمحتوى الديني المولّد بالذكاء الاصطناعي — 🚫 قرار المالك: لا تغيير

> **مغلق بقرار صريح من المالك.** راجع المالك هذا البند وقرّر إبقاءه كما هو. **ممنوع** تعديل
> منطق التوليد الديني أو النشر الآلي أو حقول المراجع، وممنوع إضافة بوابات مراجعة عليه.
> ما يلي محفوظ للتوثيق فقط، لا كبند عمل.

- الخدمة: `src/services/qawlFaslAiService.ts` (وحقولها تشمل `religiousReference`,
  `scientificStat`, `resources`, `sourceStatus` ... إلخ).
- المحتوى الديني يُولَّد آلياً وقد يُنشر بحالة `published` دون مراجعة بشرية إلزامية،
  وحقول المراجع/الإسناد مطلوبة في المخطط فيميل النموذج إلى **فبركتها** (مراجع غير حقيقية).
- الأثر: نشر محتوى ديني بمراجع ملفّقة دون تحقّق بشري — أخطر بند من ناحية المسؤولية والمصداقية.
- المطلوب من المالك (قرار سياسة، ليس مجرد كود):
  - جعل المراجعة البشرية إلزامية قبل أي `published`.
  - عدم اعتبار المراجع التي يولّدها النموذج مصدراً؛ إسناد المراجع لمصدر موثّق يدوياً.
  - لم أغيّر أنا هذا لأنه تغيير منطق تشغيل + سياسة محتوى ويحتاج قراره واختباره.

## 4. fix_script.js يرقّع الخادم عند كل تشغيل dev
- الملف: `fix_script.js` (جذر المستودع)، مربوط في `package.json`:
  `"dev": "node fix_script.js && NODE_ENV=development tsx server.ts"`.
- يُشغَّل قبل الخادم ليرقّع `server.ts` نصياً في كل مرة `npm run dev`.
- **لم أحذفه** لأنه مربوط بـ dev (حذفه الصامت قد يكسر البناء المحلي).
- المطلوب من المالك: جعل مصدر `server.ts` سليماً بذاته ثم إزالة `fix_script.js` من سكربت dev.
  (يوجد اقتراح لسكربت dev نظيف بلا الترقيع في `docs/changelog/package-scripts-fix.json`.)

## 5. نسخ الجذر الأحدث غير المدموجة (SmartGateway / ClientProfilePanel)
- الملفان في الجذر `SmartGateway.tsx` و `ClientProfilePanel.tsx` هما **أشباح** (التطبيق
  يبني نسخ `src/components/` عبر `index.html → src/main.tsx → src/App.tsx`).
- لكن نسخ الجذر **أحدث** (آخر تعديل 2026-09-04) من نسخ `src/components/`
  (SmartGateway بتاريخ 2026-09-03، ClientProfilePanel بتاريخ 2026-05-30) وبينها فروق جوهرية.
- **لم أحذف نسخ الجذر** لأنها قد تحوي إصلاحات لم تُدمج بعد في `src/`.
- المطلوب من المالك: مراجعة الفروق ودمج إصلاحات الجذر داخل `src/components/` يدوياً
  (تغيير منطق، لم أقم به)، ثم حذف نسخ الجذر الشبحية بعد الدمج.

## 6. README.md قالب افتراضي (غير أمني — تذكير)
- `README.md` الرئيسي ما زال قالب AI Studio الافتراضي؛ لم أعد كتابته في هذه الجولة.
  اسم الحزمة في `package.json` حُدِّث إلى `tebyan` (تغيير آمن مطبّق).

## 7. تنظيف تاريخ git
- حُذفت الملفات من الشجرة فقط (commits جديدة). أي ملف كان يحوي بيانات حساسة يبقى في التاريخ.
- في هذه الجولة **لم يُحذف أي ملف PII حقيقي** (لم يُعثر على ملفات عملاء/هواتف حقيقية ضمن
  ما جرى حذفه؛ الملف الوحيد التالف المحذوف هو `modified_files.zip`).
- تنظيف التاريخ (إن لزم لاحقاً لأي ملف حسّاس) يحتاج موافقة منفصلة و rebase/filter (لم يُنفَّذ).

---

# Round 2 — Comprehensive white-box audit (2026-09-17)

Re-audited the whole app (server.ts, functions/, firestore.rules, storage config,
src/, scripts/). The earlier rounds already closed the high-severity items
(open AI proxy → CORS allowlist + App Check + rate limiting on the LIVE `api`
function; firestore role-escalation; security headers in `firebase.json`; health
endpoint no longer leaks the key). This round found the codebase largely clean.
Confirmed NOT vulnerable and left unchanged: no `dangerouslySetInnerHTML`/`innerHTML`
sinks in `src/`; external link in `CouncilTab.tsx` uses `rel="noreferrer"`;
`AdminDashboard` `window.location.href` uses a static hardcoded action list (no
open redirect); `scripts/guard.js` `execSync` uses a hardcoded pattern list (no
command injection); no hardcoded secrets (only the PUBLIC Firebase web config,
which is expected); the highlight regex in `InstantResults.tsx` is a literal
alternation of escaped words (no ReDoS).

## R2-1. Unbounded AI response cache in `server.ts` — ✅ FIXED (LOW, defense-in-depth)
- File: `server.ts`, `smartCache` (declared ~line 82; write ~line 977).
- Was: `smartCache = new Map()` with a TTL but NO size cap. A flood of unique
  prompts could grow the map without limit → memory-exhaustion DoS on the
  Cloud Run / dev server that hosts the AI proxy.
- Fix: added `CACHE_MAX_ENTRIES = 500` and evict the oldest entry before insert,
  mirroring the existing bound in `functions/index.js`. Minimal, backwards-compatible.
- Note: `server.ts` is not on the live deploy path (see R2-2), so live impact was
  nil; applied as a safe hardening that matches the live function's behavior.

## R2-2. `server.ts` AI proxy has no App Check / auth — 🚫 LEFT (documented, not live)
- File: `server.ts` — `/api/ai/generate`, `/api/ai/audio` enforce CORS + per-IP
  rate limiting but NOT App Check (unlike the live `functions/index.js`).
- Why left: `cloudbuild.yaml` deploys **hosting only**, and `firebase.json`
  rewrites `/api/**` to the `api` Cloud Function; the npm `deploy` script targets
  `functions:api,hosting,firestore:rules`. `server.ts` is the dev / non-live
  Cloud Run server. Adding `firebase-admin` (App Check verify) is a heavy dep on
  a non-live path. Already noted in Round-1 §1; reconfirmed still non-live.
- Recommended fix (only if `server.ts` is ever promoted to production): port the
  `appCheckOk()` gate from `functions/index.js` onto both routes.

## R2-3. Rate-limiter IP is taken from the leftmost `X-Forwarded-For` — 🚫 LEFT (MEDIUM, risky to change)
- File: `functions/index.js`, `rateLimited()` (~line 83):
  `String(req.headers["x-forwarded-for"] || req.ip).split(",")[0].trim()`.
- Issue: the **leftmost** XFF entry is client-controlled, so an attacker can send
  a rotating/forged `X-Forwarded-For` header to land in a fresh per-IP bucket on
  every request and bypass the fixed-window limiter.
- Why left: the correct trusted position in the XFF chain depends on the exact
  GFE → Hosting → Function hop count; picking the wrong index either lumps all
  users under one IP (limiter rate-limits everyone) or stays bypassable. This is
  defense-in-depth only — App Check is the real cost-control gate — and a wrong
  change risks the live flow (guardrail: document instead of risk breakage).
- Recommended fix: rely on the platform-derived client IP (e.g. trust the GFE and
  take the correct fixed-offset entry from the right of XFF, validated against
  Firebase Hosting → Functions header behavior), and/or move enforcement fully to
  App Check strict mode (`APP_CHECK_ENFORCE=true`) once reCAPTCHA is wired.

## R2-4. `system_settings/{docId}` writable by any signed-in user when `docId == 'cron_state'` — 🚫 LEFT (LOW, not provably safe)
- File: `firestore.rules`, `match /system_settings/{docId}`:
  `allow write: if isSignedIn() && (docId == 'cron_state' || isAdmin());`
- Issue: any authenticated (incl. anonymous, if enabled) user can overwrite the
  `cron_state` document, which the client-driven generation cron reads. Potential
  tampering / trigger-manipulation.
- Why left: this appears intentional (the client advances `cron_state` without
  admin rights); tightening it (e.g. bounding fields or restricting to a Cloud
  Function) is not **provably** safe without confirming the live cron writer, and
  the guardrail forbids risky rules changes. Left unchanged.
- Recommended fix: move `cron_state` advancement to an admin/Cloud-Function-only
  write, or shape-bound the document (allow only a `lastRun` timestamp field).

## R2-5. CSP is `Content-Security-Policy-Report-Only` — 🚫 LEFT (LOW, owner decision)
- File: `firebase.json` hosting headers — a report-only CSP (with `'unsafe-inline'`
  in `script-src`) is present but never enforced.
- Why left: enforcing it (and removing `'unsafe-inline'`) can break the Vite/React
  inline bootstrap and inline styles; this is a rollout decision for the owner.
- Recommended fix: monitor CSP reports, migrate inline scripts to nonces/hashes,
  then switch the header to enforcing `Content-Security-Policy`.

### Validation (Round 2)
- `npx esbuild server.ts --bundle --platform=node --format=esm --packages=external`
  (the project's own server build step) — **passed**, no errors.
- Full `tsc --noEmit` could not be run: dependencies are not installed
  (`node_modules` absent) in the audit environment. No test script exists
  (`npm run lint` is `tsc --noEmit`).
