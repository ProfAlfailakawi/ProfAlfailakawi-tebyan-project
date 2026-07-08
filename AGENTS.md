# قنوات وإيميلات الدعم (Tebyan Project Rules)

مهم جداً: لا تغيّر إعدادات الذكاء الاصطناعي الحالية في مشروع Tebyan.

القواعد الإلزامية:

1. لا تستخدم نهائياً أي موديل قديم:
   gemini-1.5-flash
   gemini-1.5-pro

2. الموديل المعتمد في كل ملفات المشروع هو:
   gemini-2.5-flash

3. ممنوع تعديل `firebase.json` بطريقة تلغي ربط `/api/**` مع Cloud Run.
   يجب أن يبقى الربط كالتالي:
   /api/** → Cloud Run service: tebyan-api
   region: us-central1

4. ممنوع إعادة `/api/**` إلى:
   function: api
   أو إلى index.html
   أو حذف rewrite الخاص بـ tebyan-api.

5. ممنوع وضع `GEMINI_API_KEY` داخل الكود أو داخل أي ملف مثل:
   .env
   firebase-applet-config.json
   src/*
   server.ts
   GitHub

6. مفتاح Gemini يجب أن يبقى فقط في Google Secret Manager باسم:
   GEMINI_API_KEY

7. خدمة Cloud Run:
   tebyan-api
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
    - Firebase Hosting
    - Cloud Run tebyan-api

12. لا ترفع ملفات:
    node_modules
    dist
    .env
    .env.*
    *.backup*

الوضع الحالي الصحيح (محدّث 2026-07-08 ليطابق الواقع):
- Firebase project: tebyan-clean-2026  (سابقاً tebyan-80d93 — تم الانتقال)
- Hosting site: tebyan-clean-2026
- باك-إند الإنتاج: Cloud Function باسم "api" (region us-central1) — هو المربوط في firebase.json عبر /api/**
- باك-إند التطوير/البديل: server.ts (يُشغَّل عبر `npm run dev`، ويُبنى إلى dist/server.js وهو نسخة Cloud Run tebyan-api)
- قاعدة مهمة: يجب إبقاء functions/index.js و server.ts **متطابقين سلوكياً** (كاش + rate-limit + retry) لأن كليهما يخدم /api في سياقين مختلفين
- AI model: gemini-2.5-flash
- Secret name: GEMINI_API_KEY (في Secret Manager / بيئة الدالة)
- App Check: جاهز للتفعيل — ضع VITE_RECAPTCHA_SITE_KEY في الواجهة و APP_CHECK_ENFORCE=true في الدالة
- النشر: `npm run deploy` (يبني وينشر hosting + functions:api + firestore:rules)
- لا توجد مفاتيح مكشوفة داخل ملفات المشروع

ملاحظة على البندين 3 و4 أعلاه: الإنتاج فعلياً يوجّه /api/** إلى Cloud Function "api" (وليس Cloud Run مباشرة). عند أي تعديل، حافظ على هذا الربط ولا تكسره، وأبقِ server.ts متطابقاً كنسخة احتياطية.

لا تقم بإعادة توليد أو استبدال هذه الإعدادات تلقائياً. إذا احتجت تعديل الذكاء الاصطناعي، حافظ على gemini-2.5-flash و GEMINI_API_KEY في Secret Manager كما هي.
