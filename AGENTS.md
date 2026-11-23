# قنوات وإيميلات الدعم (Tebyan Project Rules)

مهم جداً: لا تغيّر إعدادات الذكاء الاصطناعي الحالية في مشروع Tebyan.

القواعد الإلزامية:

1. لا تستخدم نهائياً أي موديل قديم:
   gemini-1.5-flash
   gemini-1.5-pro

2. الموديل المعتمد في كل ملفات المشروع هو:
   gemini-2.5-flash

3. ممنوع تعديل `firebase.json` بطريقة تلغي ربط `/api/**` مع Cloud Function `api`.
   يجب أن يبقى الربط كالتالي (كما في `firebase.json` → hosting.rewrites):
   /api/** → Cloud Function: api (الكود في `functions/index.js`)
   region: us-central1

4. ممنوع توجيه `/api/**` إلى index.html، أو حذف rewrite الخاص بالدالة `api`،
   أو نقله إلى خدمة أخرى (مثل Cloud Run) دون قرار صريح من المالك.

5. ممنوع وضع `GEMINI_API_KEY` داخل الكود أو داخل أي ملف مثل:
   .env
   firebase-applet-config.json
   src/*
   server.ts
   GitHub

6. مفتاح Gemini يجب أن يبقى فقط في Google Secret Manager باسم:
   GEMINI_API_KEY

7. الدالة `api` (Cloud Function، us-central1):
   يجب أن تقرأ `GEMINI_API_KEY` من Secret Manager كـ Secret Reference.

8. لا تضف أي API key مكشوف داخل الواجهة أو ملفات المشروع.

9. لا تحذف retry logic الموجود في `server.ts` الخاص بأخطاء Gemini المؤقتة مثل:
   503
   service unavailable
   high demand
   overloaded
   temporarily unavailable

10. قبل أي نشر، تأكد أن الملفات لا تحتوي على:
    gemini-1.5-flash
    gemini-1.5-pro
    أي مفتاح يبدأ بـ AIza (باستثناء مفتاح الـ Firebase العام في `firebase-applet-config.json`)
    أي private key
    أي service account json

11. بعد أي تعديل، يجب نشر الاثنين إذا تغيرت ملفات الواجهة أو السيرفر:
    - Firebase Hosting (تلقائي عند الدمج في main عبر `.github/workflows/ci.yml`)
    - الدالة `api` إذا تغيّر `functions/` (يدوي فقط: `npm run deploy`؛ خطوة CI تنبّه إن تأخرت)

12. لا ترفع ملفات:
    node_modules
    dist
    .env
    .env.*
    *.backup*

الوضع الحالي الصحيح (محدّث 2026-07-08 ليطابق الواقع):
- Firebase project: tebyan-app-2026 (حساب volcanokw — نُقل في 2026-10-29؛ قبله tebyan-clean-2026 ثم tebyan-80d93)
- Hosting site: tebyan-app-2026
- باك-إند الإنتاج: Cloud Function باسم "api" (region us-central1) — هو المربوط في firebase.json عبر /api/**
- باك-إند التطوير/البديل: server.ts (يُشغَّل عبر `npm run dev`، ويُبنى إلى dist/server.js؛ غير موصول بالإنتاج)
- قاعدة مهمة: يجب إبقاء functions/index.js و server.ts **متطابقين سلوكياً** (كاش + rate-limit + retry) لأن كليهما يخدم /api في سياقين مختلفين
- AI model: gemini-2.5-flash
- Secret name: GEMINI_API_KEY (في Secret Manager / بيئة الدالة)
- App Check: جاهز للتفعيل — ضع VITE_RECAPTCHA_SITE_KEY في الواجهة و APP_CHECK_ENFORCE=true في الدالة
- النشر: `npm run deploy` (يبني وينشر hosting + functions:api + firestore:rules)
- لا توجد مفاتيح مكشوفة داخل ملفات المشروع

ملاحظة على البندين 3 و4 أعلاه: صُحّحا في 2026-11-13 ليطابقا `firebase.json` (كانا يذكران Cloud Run tebyan-api). عند أي تعديل، حافظ على ربط /api/** بالدالة "api"، وأبقِ server.ts متطابقاً كنسخة احتياطية.

لا تقم بإعادة توليد أو استبدال هذه الإعدادات تلقائياً. إذا احتجت تعديل الذكاء الاصطناعي، حافظ على gemini-2.5-flash و GEMINI_API_KEY في Secret Manager كما هي.

<!-- native-parity-rule:start -->
## قاعدة إلزامية: أي تحديث للموقع يُستكمل في Apple وGoogle وعلى iPhone Duo

تسري على كل وكيل (Claude، Codex، Gemini وغيرها) وكل مساهم. لا يُعدّ أي تغيير في الموقع منجزًا، ولا يُدمج ولا يُنشر، قبل استيفاء البنود التالية.

تطبيقات تبيان:

| المنصة | المعرّف | المكان |
|---|---|---|
| Apple (Capacitor: iPhone / iPad / Mac) | `com.dralfailakawi.tebyan.ios` | `apple/` في هذا المستودع |
| Google Play (Capacitor Android) | `kw.edu.tebyan.app` | `google/` في هذا المستودع |

الموقع الحي: https://tebyan.dr-alfailakawi.com. قشرة Capacitor تحمّله مباشرة عبر `server.url`، فكل ما يُنشر على الموقع يصل إلى مستخدمي التطبيق فورًا دون مراجعة متجر.

1. **افحص داخل القشرة لا في المتصفح فقط.** كل تغيير في الواجهة أو السلوك يُجرَّب داخل WebView التطبيق (WKWebView في Apple وAndroid WebView في Google). انتبه خصوصًا لما يختلف عن المتصفح: الطباعة، التنزيل، المشاركة، النوافذ المنبثقة، تسجيل الدخول الخارجي، العودة من بوابة الدفع، الكاميرا والميكروفون، الإشعارات، والروابط الخارجية.

2. **حدّث المشروع الأصلي عندما يمسّه التغيير.** يلزم تحديث القشرتين معًا إذا أضاف التغيير أو عدّل: نطاقًا جديدًا يتنقل إليه التطبيق (`allowNavigation`)، إذنًا (كاميرا، ميكروفون، صور، موقع، إشعارات)، إضافة Capacitor أو جسرًا أصليًا، الاسم أو الأيقونة أو الألوان أو شاشة الإطلاق، الروابط العميقة، أو ما يغيّر بيانات المتجر والخصوصية.
   - Apple: عدّل `apple/app.config.json` و`apple/capacitor.config.json` وما يلزم في `apple/ios`، ثم `npx cap sync ios`، وارفع رقم البناء، وتحقق بـ `apple/apple-release.sh preflight` و`apple/apple-release.sh build-sim`. حدّث `apple-release/` إن تغيّرت بيانات المتجر أو الخصوصية.
   - Google: طبّق التغيير نفسه في `google/capacitor.config.json` و`google/android` (ومنه `AndroidManifest.xml`)، وارفع `versionCode`، وتحقق بـ `google/google-release.sh preflight` و`google/google-release.sh build-debug`. الحزمة الموقّعة للمتجر: `google/google-release.sh bundle` على جهاز المالك.
   - صفحات القشرة (`apple/www`) مصدر واحد للتطبيقين: `google/google-release.sh sync` ينسخها إلى Android، فلا تُنشئ نسخة ثانية منها.

3. **iPhone Duo بكل الوضعيات.** كل تغيير يظهر للمستخدم يُفحص على محاكي iPhone Duo في: الوضع المغلق (الشاشة الخارجية)، نصف المفتوح (وضع الطاولة ووضع الكتاب)، والمفتوح (الشاشة الداخلية) طولًا وعرضًا، وفي المظهرين الفاتح والداكن وباتجاه RTL. المطلوب: لا تمرير أفقي، لا محتوى أو أزرار تحت المفصل أو خارج المنطقة الآمنة، ولا نص مقطوع، وتبقى الحالة محفوظة عند الطي والفتح. احفظ لقطات الإثبات في `docs/iphone-duo/`. إن تعذّر المحاكي فاستخدم المقاسات المكافئة الموثّقة في `docs/` واذكر ذلك.

4. **التقرير إلزامي.** كل PR وكل تقرير نهائي يتضمن قسمًا بعنوان «Apple / Google / iPhone Duo» يذكر: ما فُحص وبأي وضعية، ما عُدّل في المشروعين الأصليين، وما لم يُنفَّذ ولماذا. فحص `Native parity` في CI يفشل على أي PR يخلو وصفه من هذا القسم. ممنوع تخطّي أي بند بصمت؛ التغيير الذي لا يمسّ التطبيقات يُكتب فيه ذلك مع السبب.

5. **حدود ثابتة.** الإرسال لمراجعة App Store أو لإنتاج Google Play قرار المالك وحده. الرفع إلى TestFlight أو الاختبار الداخلي يكون بطلب منه. لا تُرفع مفاتيح التوقيع أو كلمات المرور إلى Git أبدًا.
<!-- native-parity-rule:end -->
