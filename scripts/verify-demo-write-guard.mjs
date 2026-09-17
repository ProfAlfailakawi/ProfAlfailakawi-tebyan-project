/*
 * يحرس الضمانة الوحيدة التي يقوم عليها وضع العرض: لا كتابة إلى Firestore.
 *
 * تبيان يكتب في عشرات المواضع من المتصفح. والضمانة مفروضة من نقطة واحدة
 * (`src/lib/firestoreWrites.ts`)، وهذا السكربت هو ما يُبقيها نقطةً واحدة: يفشل
 * البناء إن استورد أي ملف دالة كتابة من `firebase/firestore` مباشرة — سواء
 * باستيراد ساكن، أو ديناميكي، أو عبر كائن نطاق (`firestore.addDoc(...)`).
 *
 * السبب أن المخالفة صامتة: موضع كتابة واحد يلتفّ حول النقطة يكتب في بيانات
 * حقيقية أثناء عرضٍ على جهة، ولا شيء في الواجهة يشي بذلك. فحصٌ آلي أرخص من
 * مراجعةٍ بصرية لن تتكرّر مع كل تعديل مستقبلي.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const GUARD = path.join('src', 'lib', 'firestoreWrites.ts').replace(/\\/g, '/');

const WRITE_FNS = ['addDoc', 'setDoc', 'updateDoc', 'deleteDoc', 'writeBatch', 'runTransaction'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === GUARD) continue; // the guard itself is the one legitimate importer
  const text = fs.readFileSync(file, 'utf8');

  // 1. static or dynamic import that destructures a write function out of the SDK
  const importRe = /(?:import\s*\{([^}]*)\}\s*from\s*['"]firebase\/firestore['"]|(?:const|let|var)\s*\{([^}]*)\}\s*=\s*await\s+import\(\s*['"]firebase\/firestore['"]\s*\))/g;
  let m;
  while ((m = importRe.exec(text))) {
    const names = (m[1] || m[2] || '').split(',').map((n) => n.trim().split(/\s+as\s+/)[0].trim());
    const leaked = names.filter((n) => WRITE_FNS.includes(n));
    for (const name of leaked) {
      violations.push(`${rel}: يستورد «${name}» من firebase/firestore مباشرة — استورده من lib/firestoreWrites`);
    }
  }

  // 2. namespace call that sidesteps the import entirely: firestore.addDoc(...)
  for (const name of WRITE_FNS) {
    const nsRe = new RegExp(`\\b[A-Za-z_$][\\w$]*\\.${name}\\s*\\(`, 'g');
    let ns;
    while ((ns = nsRe.exec(text))) {
      const line = text.slice(0, ns.index).split('\n').length;
      // a batch/transaction handle legitimately carries set/update/delete methods
      const receiver = ns[0].split('.')[0];
      if (/^(batch|tx|transaction|t|b)$/i.test(receiver)) continue;
      violations.push(`${rel}:${line}: نداء «${ns[0].trim()}» يتجاوز نقطة الحراسة`);
    }
  }
}

if (violations.length) {
  console.error('فشل حارس الكتابة في وضع العرض:\n' + violations.map((v) => ` - ${v}`).join('\n'));
  console.error('\nكل كتابة إلى Firestore يجب أن تمرّ عبر src/lib/firestoreWrites.ts.');
  process.exit(1);
}

console.log('حارس وضع العرض: كل عمليات الكتابة إلى Firestore تمرّ عبر نقطة حراسة واحدة.');
