# قنوات وإيميلات الدعم (Tebyan Project Rules)

مهم جداً: لا تغيّر إعدادات الذكاء الاصطناعي الحالية في مشروع Tebyan.

القواعد الإلزامية:

1. لا تستخدم نهائياً أي موديل قديم:
   gemini-1.5-flash
   gemini-1.5-pro

2. الموديل المعتمد في كل ملفات المشروع هو:
   gemini-2.5-flash

3. الإنتاج يستخدم Cloud Functions for Firebase وليس Cloud Run.
   يجب أن يبقى الربط كالتالي في `firebase.json`:
   /api/** → Cloud Function: api
   region: us-central1

4. ممنوع إعادة توجيه `/api/**` إلى `index.html` أو حذف الـ rewrite الخاص بالـ Cloud Function.

5. ممنوع وضع `GEMINI_API_KEY` داخل الكود أو داخل أي ملف مثل:
   .env
   firebase-applet-config.json
   src/*
   server.ts
   GitHub

6. مفتاح Gemini يجب أن يبقى فقط في Google Secret Manager واسمه في بيئة الدالة:
   GEMINI_API_KEY

7. دالة `api` في `functions/index.js` تقرأ `GEMINI_API_KEY` من المتغيرات البيئية (أو Secret Manager).

8. لا تضف أي API key مكشوف داخل الواجهة أو ملفات المشروع.

9. لا تحذف retry logic الموجود في `functions/index.js` أو `server.ts` الخاص بأخطاء Gemini المؤقتة مثل:
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

11. بعد أي تعديل، يجب نشر:
    - Firebase Hosting
    - Cloud Functions (api)

12. لا ترفع ملفات:
    node_modules
    dist
    .env
    .env.*
    *.backup*

الوضع الحالي الصحيح:
- Firebase project: tebyan-clean-2026
- Hosting site: tebyan-clean-2026
- باك-إند الإنتاج: Cloud Function باسم "api" (region us-central1) — هو المربوط في firebase.json عبر /api/**
- باك-إند التطوير/البديل: server.ts (يُشغَّل عبر `npm run dev &`)
- قاعدة مهمة: يجب إبقاء functions/index.js و server.ts **متطابقين سلوكياً** (كاش + rate-limit + retry) لأن كليهما يخدم /api في سياقين مختلفين. (التعديلات في server.ts غالباً تتم من خلال functions/aiCore.cjs المشترك).
- AI model: gemini-2.5-flash
- Secret name: GEMINI_API_KEY (في بيئة الدالة)
- App Check: جاهز للتفعيل — ضع VITE_RECAPTCHA_SITE_KEY في الواجهة و APP_CHECK_ENFORCE=true في الدالة
- النشر: `npm run deploy &` (يبني وينشر hosting + functions:api + firestore:rules)
- لا توجد مفاتيح مكشوفة داخل ملفات المشروع
