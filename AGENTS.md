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

الوضع الحالي الصحيح:
- Firebase project: tebyan-80d93
- Cloud Run service: tebyan-api
- Cloud Run region: us-central1
- AI model: gemini-2.5-flash
- Secret name: GEMINI_API_KEY
- API rewrite: /api/** → tebyan-api
- لا توجد مفاتيح مكشوفة داخل ملفات المشروع

لا تقم بإعادة توليد أو استبدال هذه الإعدادات تلقائياً. إذا احتجت تعديل الذكاء الاصطناعي، حافظ على gemini-2.5-flash و Cloud Run tebyan-api و Secret Manager كما هي.
