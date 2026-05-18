TEBYAN ROOT FIX FILES

ضع الملفات داخل جذر مشروع Tebyan مباشرة.

المسارات داخل هذا ZIP:
- scripts/guard.js
- scripts/apply-tebyan-env-fix.js
- .env.example

ما الذي عدّلناه بالضبط:
1) src/components/tabs/TruthManuscriptTab.tsx
   استبدال:
   process.env.GEMINI_API_KEY
   بـ:
   import.meta.env.VITE_GEMINI_API_KEY

2) src/services/geminiService.ts
   استبدال:
   process.env.GEMINI_API_KEY
   بـ:
   import.meta.env.VITE_GEMINI_API_KEY

3) package.json
   إضافة:
   "prebuild": "node scripts/guard.js"
   داخل scripts.

4) scripts/guard.js
   يمنع البناء إذا رجع أي استخدام غلط داخل src:
   - process.env.GEMINI_API_KEY
   - process.env.API_KEY
   - process.env.VITE_GEMINI_API_KEY

طريقة الاستخدام بعد رفع الملفات:
node scripts/apply-tebyan-env-fix.js
npm run build
firebase deploy --only hosting --project tebyan-80d93 --force

مهم:
لا ترفع ملف .env الحقيقي إلى GitHub.
.env.example فقط آمن للرفع.
