# تبيان على iPhone Duo — القبول النهائي: صفحتان متقابلتان (2026-11-14)

> **تحديث الجولة الثانية (2026-11-14):** الكتاب صار أفقيًا فقط: `screen and (min-width:721px) and (max-width:1000px) and (min-height:520px) and (max-height:960px) and (orientation:landscape)`. الوضع الطولي (~669x867) عمود واحد عادي بلا كعب ولا نصف صفحة، فالوصف أدناه لـ «الكتاب الطولي» تاريخي. أُضيف: حيّز تجنّب لودجت النظام (`--duo-cutout-w/h` = 116px، للتطبيق المثبّت `display-mode: standalone` على الشاشة الداخلية فقط)، وفتح النتائج النصية (`ResultCard`) على الصفحتين بعمودين. الشاشة الخارجية المطويّة (~367x740) لا تتميّز عن iPhone فلا حيّز لها. كله محاكاة، لا جهاز حقيقي.


الفرع: `duo-final-1114` · الأساس: `main@6259228` · يبني على جولة `duo-adaptive-1113` (‏`docs/IPHONE-DUO-ADAPTIVE-QUALITY.md`) ولا يعيد ما حُلّ فيها.

النطاق: العرض فقط (CSS وبنية ترميز للعرض). لم يُمسّ: المنطق، البيانات، المسارات وروابطها، النصوص ومعانيها، المصادقة، قواعد Firestore، الدالة `api`، نموذج الذكاء الاصطناعي، الأسرار، إعداد النشر، ملفات CI.

> كل ما في هذا الملف **محاكاة مقاسات في Playwright WebKit** (‏playwright 1.63، WebKit 2359، `isMobile` و`hasTouch`، كثافة 1x). ليس جهاز Duo، وليس Safari على جهاز، ولا يحاكي `viewport-segments`. لم يُختبر شيء على جهاز حقيقي.

## 1. جرد الشاشات (من الموجّه والتنقّل في الكود)

المصادر: `src/main.tsx` (المسارات)، `src/App.tsx` (التبويبات `activeTab`، الحوارات، الحالات)، `src/constants/serviceRegistry.ts` (الخدمات)، `public/*.html` و`scripts/generate-qawl-pages.mjs` (الصفحات الثابتة).
الوصول: العرض التجريبي `?demo=1` (بيانات نموذجية، لا كتابة ولا ذكاء اصطناعي حقيقي، وفيه شاشات الإدارة ببيانات نموذجية). نافذة الدخول تُفتح كزائر غير مسجّل (فتح فقط، لا إرسال).

| # | المعرّف في التدقيق | الشاشة | كيف تُفتح |
|---|---|---|---|
| 1 | `home` | الرئيسية (بوابة السؤال) | `/` |
| 2 | `discover` | كل الخدمات | `/?tab=discover` أو زر «الخدمات» |
| 3–28 | `ask` `qawlfasl` `oracle` `concepts` `knowledgecenter` `mindmap` `truthmanuscript` `timemachine` `council` `strategicarena` `creativelab` `ar` `story` `roadmap` `quizzes` `analytics` `mylibrary` `loyalty` `contact` `decisionroom` `simulation` `lab` `knowledgegraph` `growth` `ripple` `rukni` | الخدمات الست والعشرون في السجل | `/?tab=<id>` |
| 29–31 | `adminusers` `adminqawlfasl` `adminmessages` | الإدارة: المستخدمون، إدارة قول فصل، رسائل الدعم | `/?tab=<id>` (العرض يفتحها ببيانات نموذجية) |
| 32 | `admin-route` | لوحة الإدارة (`AdminDashboard`، وهي نفسها تبويب `admindashboard` الذي لا رابط له) | `/admin` |
| 33 | `qawl-route` | قول فصل عبر مساره | `/qawl` |
| 34 | `qawl-question` | سؤال من مكتبة قول فصل (تفصيل) | `/qawl/q-1` |
| 35 | `qawl-missing` | سؤال غير موجود (حالة فارغة) | `/qawl/<غير موجود>` |
| 36 | `unknown-route` | مسار غير معروف ← تحويل للرئيسية | `/no/such/page` |
| 37 | `updating-page` | «نُحدّث البرنامج» (يقدّمها `sw.js` عند 5xx) | `/updating.html` |
| 38 | `qawl-static-index` | مكتبة قول فصل الثابتة (SEO) | `/qawl/` (ملف `public/qawl/index.html`) |
| 39 | `qawl-static-article` | صفحة سؤال ثابتة (47 صفحة بالقالب نفسه) | `/qawl/q-1/` |
| 40 | `privacy-page` | سياسة الخصوصية | `/privacy-policy.html` |
| 41 | `home-typing` | الرئيسية أثناء الكتابة (اقتراحات حيّة) | كتابة في صندوق السؤال |
| 42–44 | `discover-search` `discover-empty` `discover-filter` | كل الخدمات: نتائج بحث / لا نتيجة / تصفية بفئة | كتابة «قرار» / «zzzzzz» / «أحسم وأنجز» |
| 45 | `help-popup` | شرح الصفحة (ورقة/نافذة منبثقة) | زر «شرح» |
| 46 | `onboarding` | دليل البداية (حوار) | حدث `tebyan_open_onboarding` (القائمة) |
| 47 | `global-command` | لوحة الأوامر | ⌘K |
| 48 | `user-menu` | القائمة الشخصية | زر الحساب |
| 49 | `login-modal` | نافذة الدخول | زائر غير مسجّل ← زر الدخول |
| 50 | `offline` | انقطاع الاتصال | `context.setOffline(true)` |
| 51 | `loading-state` | هيكل التحميل لتبويب | تأخير حزمة التبويب 6 ث |
| 52 | `oracle-result` | نتيجة أداة (المستشار الكلي) | كتابة + «تشغيل» (ذكاء العرض المحلي) |
| 53 | `ask-result` | نتيجة «اسأل تبيان» | كتابة + Enter |
| 54 | `qawl-search` | بحث داخل قول فصل | كتابة + Enter |
| 55 | `qawl-emergency` | دليل الطوارئ (قول فصل) | «دليل الطوارئ» |
| 56–57 | `kc-tab-2` `kc-tab-3` | مركز المعرفة: متابعة السلوك / خارطة الطريق | تبويب فرعي |
| 58 | `creativelab-sub` | المختبر الإبداعي: المفاهيم | تبويب فرعي |
| 59–60 | `rukni-progress` `rukni-contact` | ركني: التقدم والمكافآت / تواصل معنا | تبويب فرعي |
| 61–62 | `growth-step-2` `growth-step-3` | خطتي وتقدمي: الخطوة 2 / 3 | المراحل |
| 63 | `decision-wisdom` | غرفة القرار: مجلس الحكماء | تبويب فرعي |
| 64 | `simulation-roleplay` | المحاكاة: تقمص الأدوار | تبويب فرعي |
| 65 | `council-opposing` | المجلس: المعارض | مفتاح |
| 66 | `kg-classic` | خريطة المعرفة: العرض التقليدي | مفتاح |

لم يُدرج: شاشة البداية (Splash) لأنها تظهر مرة في الجلسة قبل التطبيق (أُضيفت لها قاعدة الحوارات نفسها، ولم تُقس آليًا)؛ وضع التركيز `LighthouseMode` (يُفتح من «أثر الفراشة» بعد اختيار فكرة؛ أُضيفت له القاعدة نفسها، لم يُقس)؛ نافذة تثبيت التطبيق `PWAInstallPrompt` (تعتمد حدث `beforeinstallprompt` الذي لا يطلقه WebKit)؛ شريط الخطأ العام في `App.tsx` (لا طريق آمن لإطلاقه بلا شبكة) — كلها BLOCKED بهذا السبب في المصفوفة أدناه.

## 2. ما الذي تغيّر (التصميم)

### C/D — الشاشة الداخلية: صفحتان متقابلتان
- **متى**: `(640–760 عرضًا، ≥520 ارتفاعًا)` للكتاب الطولي (669×867، 669×520)، و`(840–1000، ≥520، نسبة ≥ 3:2)` للعرضي (951×585). iPad طوليًا (768) وعرضيًا (1024) وSplit View خارج القاعدة. القرار بالمقاس لأن Safari لا يكشف المفصل.
- **الكعب**: 32px في منتصف النافذة تمامًا: خيط ذهبي 1px داخل ظل طيّ خفيف، من أعلى النافذة إلى أسفلها (يمرّ تحت الترويسة أيضًا)، `pointer-events: none`. الخلفية متصلة من الحافة إلى الحافة.
- **الصفحة الأولى (اليمنى في RTL)**: المهمة نفسها — الأداة، القراءة، النتيجة. عرضها نصف المحتوى ناقص نصف الكعب، فلا شيء يعبر المنتصف.
- **الصفحة المقابلة** (`src/components/BookContextPage.tsx`، مثبّتة، تمرّر وحدها كصفحة كتاب): في الرئيسية «كل الخدمات» فهرسًا بأبوابه الخمسة؛ وفي كل خدمة: بطاقة الخدمة (الباب، الاسم، الوصف)، شرح الصفحة (مقدمة، خطوات، نصيحة) وأخواتها من الباب نفسه روابط. **كل نصوصها موجودة أصلًا** (سجل الخدمات وشرح الصفحة). تُرسم دائمًا ويخفيها CSS خارج الكتاب: لا remount عند الطي.
- **شاشات تقسم نفسها** (`BOOK_BESPOKE_TABS`): كل الخدمات — العنوان والبحث والتصفية ثابتة على الصفحة الأولى، والدليل على المقابلة بطاقة في كل سطر؛ لوحة الإدارة `/admin` — أبواب الإدارة والعنوان وزرا التشغيل على الأولى، والأرقام والقوائم على المقابلة.
- **الحوارات والحالات الكاملة** (الدخول، دليل البداية، لوحة الأوامر، انقطاع الاتصال، البداية، وضع التركيز): تُفتح في وسط الصفحة الأولى لا على المفصل، والستارة تغطي الصفحتين؛ والحوار الأطول من النافذة يمرّر داخل صفحته بدل أن يفقد أعلاه. «شرح الصفحة» يبقى في الصفحة اليسرى.
- **الترويسة**: كل مجموعة في صفحتها؛ في الكتاب الطولي وسم «بيئة تجريبية» أيقونة فقط (كما في الهاتف)؛ ومع نص كبير جدًا يتراجع وسم «الخدمات» بنقاط حذف قبل أن يبلغ الكعب.
- **داخل الصفحة**: الصفحة بعرض هاتف، فما فُتح على `sm/md` يعود لترتيب الهاتف داخلها (صفوف تتكدّس، أعمدة 3–5 تصير اثنين، `md:w-*` تملأ الصفحة)، وحشوات البطاقات الكبيرة تصير هامش صفحة (`min(2rem, 24px)`)، والنتيجة تُقرأ على الصفحة بلا إطار ثانٍ، ورؤوس الحالة (DnaKit) ومفاتيح الاختيار الثنائية تلتف.
- **صفحات ثابتة**: «نُحدّث البرنامج» — الحاشية على الأولى والكتاب على المقابلة؛ صفحة السؤال الثابتة — الجواب على الأولى، والمراجِع والمصادر وزر البلاغ ثابتة على المقابلة؛ مكتبة قول فصل الثابتة — العنوان على الأولى والأسئلة على المقابلة؛ سياسة الخصوصية — عمودان كصفحتين.

### E — وضع اللابتوب (عريض وقصير: 951×350، 600×350، وكذلك 594×368 و844×390 لأن شكلها واحد)
`(عرض ≥560 وارتفاع ≤420)`: المحتوى يبدأ من أعلى النافذة، والترويسة صارت **شريط تحكم سفليًا** (كسطح لوحة المفاتيح) بخيط ذهبي في أعلاه. لا يغطي الشريط شيئًا: الصفحة تنتهي بفاصل بارتفاعه، والحقل المركّز يمرّر فوقه (`scroll-padding-bottom`)، وأثناء الكتابة يتنحّى الشريط (كما تتنحّى أزرار رجوع/شرح أصلًا على الهاتف). زرا رجوع/شرح يبقيان في ركنهما والإجراءات تفسح لهما. تحت 760 عرضًا: أيقونات فقط. حركة «إخفاء الترويسة عند التمرير» تكتب `translateY(-100px)` في `style`، فأُلغيت هنا وحدها (`transform: none !important`) كي لا يرتفع الشريط داخل الصفحة.

### A/B/F/G/H — بلا تغيير مقصود
الهاتف المطوي، Split View، iPad، المكتب: لم تتغير تخطيطاتها (القواعد كلها محصورة بمقاسات الكتاب أو اللابتوب). الاستثناء الوحيد: قاعدة «بطاقتان في الصف» لكل الخدمات عند 600–767 لم تعد تنطبق على الكتاب الطولي (عُدّل شرط الوسائط في `src/styles/beauty.css` نفسه بدل غلبته).

### ملفات
| الملف | ماذا |
|---|---|
| `src/index.css` (آخر الملف) | «Book spread» و«Laptop posture» وقواعد الصفحة؛ متغيّر `--tebyan-help-sheet-right` في قاعدة ورقة الشرح القديمة بدل غلبتها |
| `src/components/BookContextPage.tsx` (جديد) | الصفحة المقابلة |
| `src/App.tsx` | صنفا `tebyan-book`/`tebyan-book-main`/`tebyan-book-footer`، `data-book`، `BOOK_BESPOKE_TABS`، رسم الصفحة المقابلة بعد `<main>`، صنف `tebyan-book-overlay` لثلاثة حوارات |
| `ServiceExplorer.tsx` | غلاف `tebyan-service-lead` (‏`display: contents` خارج الكتاب) |
| `AdminDashboard.tsx`، `QawlFasl/HomeView.tsx`، `GlobalCommand.tsx`، `OnboardingTour.tsx`، `LighthouseMode.tsx` | أصناف فقط |
| `src/styles/beauty.css` | شرط وسائط قاعدة البطاقتين |
| `public/updating.html`، `public/privacy-policy.html`، `scripts/generate-qawl-pages.mjs` (+ 48 صفحة مولَّدة في `public/qawl/`) | وسائط الكتاب |
| `docs/iphone-duo-final/audit.cjs`، `live-stress.cjs` | أداتا التدقيق |

لا ملفات «beauty» جديدة. `!important` جديدة فقط حيث تنافس قاعدة `!important` قائمة أو `style` مضمّنًا على الخاصية نفسها (حشوات الترويسة/المسار في اللابتوب، و`transform`)، وكلها معلّقة.

**المفصل الحقيقي (اختياري):** لم يُضف. `tests/duo-layout.test.ts` يمنع `viewport-segments`/`device-posture` في `src/index.css` عمدًا، وWebKit لا يحاكيها. الكعب يقع في منتصف النافذة، وهو موضع المفصل حين يملأ Safari الشاشة الداخلية.

## 3. تعريف الوضعيات
| | الوضعية | المقاسات المقيسة |
|---|---|---|
| A | الشاشة الخارجية طوليًا | 382×580 (كل الشاشات)، 385×571، 320×568 (الرئيسية) |
| B | الخارجية عرضيًا | 594×368 |
| C | الداخلية كتابًا طوليًا | 669×867 |
| D | الداخلية كتابًا عرضيًا | 951×585 |
| E | لابتوب | 951×350، 600×350 |
| F | نصف/قصير داخلي | 669×520 (كل الشاشات)، 600×480 (الرئيسية) |
| G | تابلت/مكتب | 1280×800 (كل الشاشات)، 768×1024، 1024×768، 1440×900 (الرئيسية) |
| H | مراجع هاتف | 390×844 (كل الشاشات)، 360×640، 844×390 (الرئيسية) |
| — | إضافية | 470/620/320 × 350/600/900 (الرئيسية) |
| I | تغيير حي بلا إعادة تحميل | 951×585 ← 669×867 ← 470×700 ← 382×580 ← 594×368 ← 951×350 ← 951×585 |
| J | ضغط الوصول | نص 200% (669×867، 951×585، 382×580)، داكن (951×585)؛ وعلى عيّنة: حركة مفعّلة، لوحة مفاتيح، منطقة آمنة غير متناظرة |

«الرئيسية» = الشاشات الأساسية: `home discover ask qawlfasl qawl-question oracle council decisionroom growth rukni mylibrary contact admin-route help-popup updating-page`.

## 4. المصفوفة: كل شاشة × كل وضعية

القاعدة: **PASS** = في كل مقاسات الوضعية: لا تمرير أفقي في الصفحة، لا عنصر مهم مقطوع خارج النافذة، لا عنصر/نص على الكعب (في الكتاب)، أهداف اللمس الظاهرة ≥44px. **PARTIAL** = يمرّ التخطيط وبقي قصور مذكور في §6. **FAIL** = خرق أحد الثلاثة الأولى. **NOT_TESTED** = لم يُقس. I = تسلسل التغيير الحي على الشاشة نفسها؛ J = نص 200% (669×867، 951×585، 382×580) + داكن (951×585) على الشاشة نفسها.

| الشاشة | A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|---|
| `home` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `discover` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `ask` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `qawlfasl` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `oracle` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `concepts` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `knowledgecenter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `mindmap` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `truthmanuscript` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `timemachine` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `council` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `strategicarena` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `creativelab` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `ar` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `story` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `roadmap` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `quizzes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `analytics` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `mylibrary` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `loyalty` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `contact` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `decisionroom` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `simulation` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `lab` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `knowledgegraph` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `growth` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `ripple` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `rukni` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `adminusers` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `adminqawlfasl` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `adminmessages` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `qawl-route` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `qawl-question` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `qawl-missing` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `admin-route` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `unknown-route` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `updating-page` | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PASS | PARTIAL | PASS | PASS |
| `home-typing` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `discover-search` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `discover-empty` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `discover-filter` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `help-popup` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `onboarding` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `global-command` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `user-menu` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `offline` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `oracle-result` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `ask-result` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `qawl-search` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `qawl-emergency` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `kc-tab-2` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `kc-tab-3` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `creativelab-sub` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `rukni-progress` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `rukni-contact` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `growth-step-2` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `growth-step-3` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `decision-wisdom` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `simulation-roleplay` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `council-opposing` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `kg-classic` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `login-modal` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `loading-state` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_TESTED | NOT_TESTED |
| `qawl-static-index` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `qawl-static-article` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PARTIAL |
| `privacy-page` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

المجموع: 66 شاشة × 10 أعمدة = 660 خانة: **PASS 645، PARTIAL 13، FAIL 0، NOT_TESTED 2** (هيكل التحميل في I/J: لا يبقى ظاهرًا مدة تسلسل كامل). BLOCKED خارج المصفوفة: البداية (Splash)، وضع التركيز، نافذة التثبيت، شريط الخطأ العام (§1).

## 5. القياسات (بعد التعديل، على بناء الإنتاج `vite preview`)
| المقياس | النتيجة |
|---|---|
| حالات المصفوفة A–H | 834 (منها 198 بمقاس كتاب) |
| تمرير أفقي في الصفحة (`documentElement.scrollWidth > clientWidth`) | **0** |
| تمرير أفقي في `<main>` | 0 في التطبيق؛ صفحة «نُحدّث البرنامج» 4–9px في `main.folio` غير القابلة للتمرير (أوراق الكتاب ثلاثية الأبعاد، موجود قبل هذا الفرع في كل المقاسات، `body` يقصّه فلا تمرير مرئي) |
| عناصر مهمة مقطوعة خارج النافذة | **0** |
| عناصر/نصوص على الكعب (مركز ± 16px) في مقاسات الكتاب | **0** (يُحسب الجزء المرسوم فعلًا: صفوف الشرائح القابلة للتمرير الجانبي تُقصّ عند حافة صفحتها) |
| أهداف لمس <44px ظاهرة | **0** (كانت 62 حالة في 1024–1440 باللمس، وأزرار الأعمار في دليل الطوارئ 43px، ورابطان في صفحات قول فصل الثابتة 39/32px — كلها أُصلحت) |
| أخطاء تنفيذ | 0 |
| I: تسلسل حي لكل شاشة (455 خطوة) | الصفحة لم يُعَد تحميلها في أي خطوة، 0 تمرير أفقي، 0 على الكعب، 0 مقطوع |
| I: حالة محفوظة | المستشار الكلي: نص مكتوب + منظور مختار + ورقة الشرح مفتوحة — باقية في الخطوات السبع؛ كل الخدمات: فئة مختارة + موضع تمرير (260px) باقيان؛ اسأل تبيان: النص المكتوب باقٍ |
| J: 260 قياسًا لكل شاشة | 0 تمرير أفقي، 0 مقطوع؛ عناصر على الكعب بنص 200% فقط في 9 شاشات (§6) |
| J: لوحة مفاتيح (حقل مركّز ثم ارتفاع 350) | 382/669/951: الحقل يبقى مركّزًا ويُرى بعد تمريره، ولا يغطيه شريط التحكم (يتنحّى أثناء الكتابة) |
| J: حركة مفعّلة مقابل مخفّضة | لا فرق في القياسات (كل الجولات أصلًا بـ `reducedMotion: reduce`) |
| J: منطقة آمنة غير متناظرة | محاكاة 47px يسارًا في الترويسة وزرّي رجوع/شرح: 0 تمرير، 0 مقطوع، 0 على الكعب. `env(safe-area-inset-*)` نفسها لا تُحاكى في WebKit → على الجهاز NOT_TESTED |

## 6. ما بقي
**P0:** لا شيء معروف.

**P1:**
- لم يُختبر على Duo حقيقي ولا في Safari على جهاز. موضع الكعب = منتصف النافذة؛ إن لم يملأ Safari الشاشة الداخلية تمامًا (أعمدة المتصفح) فقد لا يطابق المفصل الفعلي ببضع نقاط.
- المفصل الحقيقي (`viewport-segments`) لم يُستعمل: ممنوع باختبار قائم ولا يُحاكى. NOT_TESTED.

**P2:**
- نص 200% في الكتاب: يقع على الكعب زر واحد أو سطر في `mylibrary` (وسم «المستشار»)، `simulation`/`simulation-roleplay` (زر «تقمص الأدوار المباشر»)، `admin-route` (زر «تشغيل تحليل الذكاء الاصطناعي»)، `ask-result` (حقل السؤال)، `user-menu` (القائمة المنسدلة تتسع)، `qawl-static-*` (سطر «مرجع الوالدين الموثوق» في الشريط العلوي). لا تمرير ولا قطع. ملاحظة: «تكبير الصفحة» في Safari يصغّر عرض النافذة فيخرج من الكتاب أصلًا؛ هذا اختبار أقسى من الواقع.
- «نُحدّث البرنامج»: فيض 4–9px غير مرئي في `main.folio` (سابق).
- الحوار الأطول من النافذة في الكتاب يمرّر داخل صفحته (الدخول عند 951×585)؛ زر الإغلاق فوقه يظهر عند أعلى التمرير.
- الصفحة المقابلة تعرض «شرح الصفحة» العام لخدمات ليس لها شرح خاص في `getPageHelpDetails` (نص موجود أصلًا، لم نكتب جديدًا).
- لوحة الإدارة (`/admin`) في الكتاب: أزرار التحكم على الأولى طويلة؛ زر «AI» العائم القديم يبقى فوق الركن الأيسر.
- بعد إعادة الأساس على `main@d0df47b` (‏PR #122: حذف الحساب، إخفاء دخول Google في تطبيق iOS) لم تُعد جولة الصور؛ التغييرات هناك لا تمسّ التخطيط، و`lint`/`test`/`build` أُعيدت عليها.

## 7. قبل/بعد (WebKit 1x)
| | قبل (`main`) | بعد |
|---|---|---|
| كل الخدمات 669×867 | `iphone-duo-final/before-discover-669x867.jpg` | `iphone-duo-final/after-discover-669x867.jpg` |
| اسأل تبيان 669×867 | `before-ask-669x867.jpg` | `after-ask-669x867.jpg` |
| المستشار الكلي 951×585 | `before-oracle-951x585.jpg` | `after-oracle-951x585.jpg` |
| كل الخدمات 951×585 | `before-discover-951x585.jpg` | `after-discover-951x585.jpg` |
| الرئيسية 669×867 / 951×585 | — | `after-home-669x867.jpg` / `after-home-951x585.jpg` |
| سؤال قول فصل 951×585 | — | `after-qawl-question-951x585.jpg` |
| لابتوب 951×350 / 600×350 / مطوي عرضي 594×368 | — | `after-oracle-951x350.jpg` / `after-oracle-600x350.jpg` / `after-home-594x368.jpg` |

## 8. الفحوص
| الفحص | `main@6259228` | الفرع (بعد إعادة الأساس على `d0df47b`) |
|---|---|---|
| `npm run lint` (`tsc --noEmit`) | PASS | PASS |
| `npm test` | PASS 93/93 | PASS 100/100 (يشمل اختبارات #122) |
| `npm run build` (حارس PWA + حارس العرض + توليد صفحات قول فصل) | PASS | PASS |
| `tests/duo-layout.test.ts` (لا segments/posture، لا قفل تكبير، dvh، 44px) | PASS | PASS |
| فحص AGENTS.md على الفرق (لا `gemini-1.5`، لا `AIza`، لا مفاتيح) | — | PASS |

## 9. إعادة التدقيق
```bash
npm ci && npm run build
npx vite preview --port 5170 --strictPort --host 127.0.0.1
# في طرفية ثانية:
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers BASE=http://127.0.0.1:5170 \
  SHOTS=/tmp/duo-shots node docs/iphone-duo-final/audit.cjs /tmp/duo-matrix.json          # A–H (~50 دقيقة)
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers BASE=http://127.0.0.1:5170 \
  SETTLE=4000 node docs/iphone-duo-final/live-stress.cjs /tmp/duo-live.json                # I و J (~45 دقيقة)
# جزء: node docs/iphone-duo-final/audit.cjs out.json C,D home,discover,oracle
```
النتائج المجمّعة لهذه الجولة: `docs/iphone-duo-final/report.json`.

## 10. قائمة فحص للمالك على الجهاز
1. افتح الـ Duo كتابًا طوليًا في Safari على `/?tab=oracle`: هل يقع خيط الكعب الذهبي على المفصل تمامًا؟ هل يقطع المفصل أي حرف أو زر؟
2. الشيء نفسه عرضيًا (`/`، `/?tab=discover`، `/qawl/q-1`): الأداة يمينًا، والسياق (الفهرس/الشرح) يسارًا ويمرّر وحده.
3. افتح «شرح» ولوحة الأوامر وتسجيل الدخول في الكتاب: تظهر في وسط صفحة لا على المفصل.
4. اطوِ نصف طيّة كاللابتوب: المحتوى أعلى، والشريط أسفل؛ اكتب في حقل: الشريط يتنحّى ولا يغطي الحقل.
5. اكتب نصًا، اختر منظورًا، ثم اطوِ وافتح وأدر الجهاز: النص والاختيار باقيان بلا إعادة تحميل.
6. الشاشة الخارجية مغلقًا (382×580): مهمة واحدة، الخلفية من الحافة للحافة (لم تتغير عن الجولة السابقة).
7. صفحة قول فصل الثابتة `/qawl/q-1/` وسياسة الخصوصية مفتوحتين كتابًا.
8. VoiceOver: الصفحة المقابلة تُقرأ بعد المحتوى، وعناوينها مستوى 2.

## 11. الجزء 2 — الطباعة (بعد دمج #123)
**الخلل:** استعلامات الكتاب واللابتوب لم تكن مقيّدة بالشاشة. عرض A4 المطبوع (~658px) يقع بين 640 و760 وارتفاعه فوق 520، فكانت طباعة جواب قول فصل أو سياسة الخصوصية أو صفحة من التطبيق تأخذ تخطيط الصفحتين، ومعه الصفحة المقابلة الثابتة.
**الإصلاح:** كل بديل في كل استعلام Duo جديد صار يبدأ بـ `screen and`، بما في ذلك البديلان المفصولان بفاصلة. شمل ذلك `src/index.css`، و`scripts/generate-qawl-pages.mjs` (وأُعيد منه توليد الصفحات الثمانية والأربعين، لا يدويًا)، و`public/privacy-policy.html`، و`public/updating.html`. أما قاعدة البطاقتين في `beauty.css` فأُضيف لها بديل `print` كي تبقى الطباعة كما كانت قبل #123.
**التحقق** (WebKit، `emulateMedia({media:'print'})`، عرض 658×930): في صفحة سؤال قول فصل `article` بلا شبكة و`.trust` ثابت الموضع (static)؛ وفي مكتبة قول فصل `.wrap` كتلة واحدة؛ وفي سياسة الخصوصية عمود واحد؛ وفي «نُحدّث البرنامج» عمود واحد بعرض 618px. وفي التطبيق (`oracle` و`discover`) الصفحة المقابلة `display:none`، والمحتوى بالعرض الكامل (≈635px)، ولا كعب (`::after` = none)، ولا شريط سفلي. و`/admin` كتلة واحدة. على الشاشة بالعرض نفسه يبقى تخطيط الصفحتين كما هو.
**حارس:** اختبار جديد في `tests/duo-layout.test.ts` يفشل إن ظهر استعلام فيه `min-height: 520px` أو `max-height: 420px` لا يبدأ بـ `screen and`، في الملفات الخمسة.
**تأكيدات:** (أ) ستارة الحوارات (لوحة الأوامر، دليل البداية) تغطي الصفحتين وتستقبل اللمس عليهما. فُحص ذلك بـ `elementFromPoint` عند 20% و80% من العرض وعلى الترويسة، في 951×585 و669×867، والنتيجة: الستارة دائمًا. الحشوة تنقل المحتوى وحده ولا تمسّ مساحة اللمس. (ب) `!important` الجديدة سبع، وكلها على خاصية تفرضها قاعدة `!important` قائمة أو `style` مضمّن: `transform` (‏style مضمّن من الحركة)، وحشوتا الترويسة (قاعدة النوافذ القصيرة)، وخلفيتها (قواعد المظلّة)، وحشوتا `main` (قواعد المسارات). وهي معلّقة في الكود. وتعديل `right` في ورقة الشرح كان على `!important` قائمة أصلًا. (ج) لم يُضعَف أي اختبار: الإضافة اختبار واحد، ولا حذف ولا تخطٍّ.

## Duo ≠ iPad (2026-11-14، فرع `duo-ipad-split-1114`)

**الخلل:** نطاق وضع الكتاب العمودي كان `640–760px`، فيشمل iPad mini عموديًا (744×1133) بصفحتيه وكعبه. **الإصلاح:** السقف صار `720px` في كل استعلام (`src/index.css` ×3، `scripts/generate-qawl-pages.mjs` وصفحات `public/qawl/**` المولّدة، `public/updating.html`، `public/privacy-policy.html`). وفي `src/styles/beauty.css` صار نطاق «عمودان للبطاقات» يبدأ من 721 بدل 761 ليبقى تخطيط التابلت 721–767 كما كان قبل الـDuo. الوضع الأفقي `840–1000` ووضع اللابتوب `560–759 × ≤420` لم يتغيرا، وكلها مقيّدة بـ`screen`.

| الاستعلام | النطاق القديم | النطاق الجديد | طابق مقاس iPad؟ |
|---|---|---|---|
| كتاب عمودي (index.css ×3، qawl، updating، privacy) | 640–760 × ≥520 | 640–720 × ≥520 | نعم، 744×1133 و744×1040 (قبل) / لا (بعد) |
| كتاب أفقي | 840–1000 × ≥520 و≥3:2 | بلا تغيير | لا (أصغر iPad أفقيًا 1024) |
| لابتوب/قصير | 560–759 × ≤420 | بلا تغيير | لا (لا iPad بارتفاع ≤420) |

**القياس** (Playwright WebKit، `isMobile`+`hasTouch`، 7 صفحات: الرئيسية، اكتشف، اسأل، حوار المساعدة، قول فصل، updating، privacy): في المقاسات الـ23 لأجهزة iPad (كاملة الشاشة ومع شريط Safari: 744×1133 … 1366×1024، 744×1040 … 1180×735) لا ختم كعب ولا ظهرت الصفحة المقابلة ولا شبكة الكتاب، وشبكة الخدمات 2/3 أعمدة كتخطيط التابلت. في 669×867 و669×520 و660×800 و700×900 و720×900 و951×585 و880×585 و1000×600 يبقى الكتاب فعّالًا على كل الصفحات.

**حارس:** اختبار جديد في `tests/duo-layout.test.ts` يفشل إن سمح استعلام كتاب عمودي بعرض > 720 أو أفقي > 1000 (والاختبار القائم يفرض `screen`).

**قيد معروف:** نافذة Split View أو Slide Over على iPad بعرض ~640–720 لا تُميَّز عن الـDuo بالمقاس. الفارق الحقيقي الوحيد هو `(horizontal-viewport-segments: 2)` حيث يكشفه المتصفح، وهو ممنوع عمدًا في الاختبار القائم. محاكاة فقط، لا جهاز حقيقي.
