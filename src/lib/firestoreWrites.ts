/**
 * النقطة الوحيدة التي تمرّ منها كل كتابة إلى Firestore.
 *
 * تبيان يكتب من المتصفح في سبعة وأربعين موضعًا موزّعة على سبعة عشر ملفًا. وضع
 * العرض يَعِد بألّا يكتب شيئًا، ووعدٌ كهذا لا يُفرض بحراسةٍ موزّعة: موضعٌ واحد
 * يُنسى — اليوم أو بعد ستة أشهر حين يُضاف موضعٌ جديد — يُبطل الضمانة كلها، ولا
 * سبيل للتأكد من سبعة وأربعين موضعًا بالمراجعة البصرية.
 *
 * فبدل ذلك: تُستورد دوال الكتابة من هنا لا من `firebase/firestore` مباشرة، وهذا
 * الملف وحده يقرأ الراية. و`scripts/verify-demo-write-guard.mjs` يفشل البناء إن
 * استورد أي ملف آخر دالة كتابة من المصدر مباشرة — فالقاعدة محروسة آليًا لا
 * بالاتفاق.
 *
 * القراءة (`getDoc`, `getDocs`, `onSnapshot`, `query`, `collection`, `doc` …) تبقى
 * تُستورد من `firebase/firestore` كالمعتاد: العرض يقرأ بحرية، وهذا هو المقصود.
 */
import {
  addDoc as fsAddDoc,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  writeBatch as fsWriteBatch,
  runTransaction as fsRunTransaction,
} from 'firebase/firestore';
import { IS_DEMO_MODE, DemoWriteBlockedError } from './demoMode';

/* الرمي لا الإرجاع الصامت: مسار الحفظ الذي يظنّ أنه نجح وهو لم يكتب شيئًا يكذب
   على المستخدم. أما المستدعي الذي يطيب له التجاهل فيلتقط الخطأ بنفسه. */
function blockInDemo(operation: string): void {
  if (IS_DEMO_MODE) throw new DemoWriteBlockedError(operation);
}

export const addDoc: typeof fsAddDoc = ((...args: Parameters<typeof fsAddDoc>) => {
  blockInDemo('addDoc');
  return fsAddDoc(...args);
}) as typeof fsAddDoc;

export const setDoc: typeof fsSetDoc = ((...args: Parameters<typeof fsSetDoc>) => {
  blockInDemo('setDoc');
  return fsSetDoc(...args);
}) as typeof fsSetDoc;

export const updateDoc: typeof fsUpdateDoc = ((...args: Parameters<typeof fsUpdateDoc>) => {
  blockInDemo('updateDoc');
  return fsUpdateDoc(...args);
}) as typeof fsUpdateDoc;

export const deleteDoc: typeof fsDeleteDoc = ((...args: Parameters<typeof fsDeleteDoc>) => {
  blockInDemo('deleteDoc');
  return fsDeleteDoc(...args);
}) as typeof fsDeleteDoc;

/* الدفعة تُمنع عند الإنشاء لا عند `commit()`: الاستدعاء الذي يبني دفعة ثم يسلّمها
   إلى دالة أخرى كان سيمرّ لو انتظرنا حتى الالتزام. */
export const writeBatch: typeof fsWriteBatch = ((...args: Parameters<typeof fsWriteBatch>) => {
  blockInDemo('writeBatch');
  return fsWriteBatch(...args);
}) as typeof fsWriteBatch;

/* المعاملة تُمنع كذلك عند الاستدعاء: هي قراءةٌ ثم كتابة، ولا معنى لتشغيل نصفها. */
export const runTransaction: typeof fsRunTransaction = ((...args: Parameters<typeof fsRunTransaction>) => {
  blockInDemo('runTransaction');
  return fsRunTransaction(...args);
}) as typeof fsRunTransaction;
