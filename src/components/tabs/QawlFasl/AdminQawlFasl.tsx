import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../../lib/firestoreWrites';
import { db } from '../../../lib/firebase';
import { QawlFaslQuestion, CATEGORIES } from './types';
import { Plus, Edit2, Trash2, Check, X, Sparkles, Loader2, Database, Wand2, UploadCloud } from 'lucide-react';
import { generateQawlFaslContent, GeminiKeyMissingError } from '../../../services/qawlFaslAiService';
import { qawlFaslService } from '../../../services/qawlFaslService';
import AdminQawlFaslBulkGen from '../../AdminQawlFaslBulkGen';
import AdminQawlFaslUpload from './AdminQawlFaslUpload';
import { IS_DEMO_MODE } from '../../../lib/demoMode';
import { loadDemoLibrary } from '../../../data/demoLibrary';
import { DEMO_MISSING_QUESTIONS, DEMO_ANSWER_REPORTS } from '../../../data/demoAdmin';

export default function AdminQawlFasl() {
  const [questions, setQuestions] = useState<QawlFaslQuestion[]>([]);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkGen, setShowBulkGen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState<Partial<QawlFaslQuestion>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [missingQuestions, setMissingQuestions] = useState<any[]>(() => (IS_DEMO_MODE ? DEMO_MISSING_QUESTIONS : []));
  const [answerReports, setAnswerReports] = useState<any[]>(() => (IS_DEMO_MODE ? DEMO_ANSWER_REPORTS : []));
  const loadReports = () => {
    if (IS_DEMO_MODE) return;
    qawlFaslService.getAnswerReports().then(setAnswerReports).catch((e) => console.warn('[Admin] answer reports unavailable:', e));
  };
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<string | null>(null);

  const showAlert = (msg: string) => setAlertDialog(msg);
  const DEMO_NOTE = '\n(نسخة العرض: تمت العملية في الذاكرة فقط ولا يُحفظ شيء.)';
  const showConfirm = (msg: string, onConfirm: () => void) => setConfirmDialog({ message: msg, onConfirm });

  const loadMissing = () => {
    if (IS_DEMO_MODE) return;
    qawlFaslService.getMissingQuestions().then(setMissingQuestions);
  };

  useEffect(() => {
    if (IS_DEMO_MODE) {
      let cancelled = false;
      void loadDemoLibrary().then(lib => {
        if (cancelled) return;
        // بعض الأسئلة مسودات كي تظهر الحالتان في الجدول.
        setQuestions(lib.map((q, i) => (i % 9 === 4 ? { ...q, status: 'draft' } : q)) as QawlFaslQuestion[]);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }
    const unsub = onSnapshot(collection(db, 'qawl_fasl_questions'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as QawlFaslQuestion));
      setQuestions(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoading(false);
    });
    
    // Load missing
    loadMissing();
    loadReports();

    return () => unsub();
  }, []);

  const openNew = () => {
    setEditingId('new');
    setFormData({
      title: '',
      categoryId: CATEGORIES[0].id,
      ageGroups: [],
      riskLevel: 'low',
      keywords: [],
      quickSummary: '',
      quickAnswer: { sayThis: '', dontSayThis: '', doThisNow: '' },
      commonMistake: '',
      educationalView: '',
      suggestedAnswer: '',
      byAgeVersions: [],
      practicalSteps: [],
      exercises: [],
      whenToWorry: '',
      resources: [],
      closingThought: '',
      status: 'draft'
    });
    setAiContext('');
  };

  const handleGenerate = async () => {
    const questionText = formData.title || formData.question;
    if (!questionText) {
      showAlert('الرجاء كتابة السؤال في حقل "العنوان" أولاً.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const generatedData = await generateQawlFaslContent(questionText, aiContext);
      setFormData(prev => ({
        ...prev,
        ...generatedData,
        // Ensure arrays are initialized if missing
        ageGroups: prev.ageGroups?.length ? prev.ageGroups : ['4-6', '7-9', '10-12'],
        status: prev.status || 'draft'
      }));
    } catch (error: any) {
      if (error.code === "GEMINI_API_KEY_NOT_CONFIGURED") {
          showAlert('يبدو أن هناك تعثراً في الوصول، جرد العودة للوضع المجاني عبر الإعدادات وسأستمر معك.');
       } else {
         console.error(error);
         showAlert('حدث خطأ أثناء التوليد. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMigrateCategories = async () => {
    showConfirm('هل أنت متأكد؟ سيتم تحديث تصنيفات جميع الأسئلة تلقائيًا.', async () => {
        if (IS_DEMO_MODE) { showAlert('تم التحديث بنجاح!' + DEMO_NOTE); return; }
        setIsMigrating(true);
        try {
            await qawlFaslService.migrateAllQuestionsToMainCategory();
            showAlert('تم التحديث بنجاح!');
        } catch (e) {
            console.error(e);
            showAlert('خطأ أثناء التحديث.');
        } finally {
            setIsMigrating(false);
        }
    });
  };

  const handleRunAnalysis = async () => {
      if (IS_DEMO_MODE) { showAlert('تم التحليل بنجاح! لا أسئلة ناقصة جديدة.' + DEMO_NOTE); return; }
      setIsProcessing(true);
      try {
          await qawlFaslService.analyzeSearchLogs();
          showAlert('تم التحليل بنجاح!');
          loadMissing();
      } catch (e) {
          console.error(e);
          showAlert('خطأ أثناء التحليل.');
      } finally {
          setIsProcessing(false);
      }
  };

  const save = async () => {
    const isNew = editingId === 'new';
    if (IS_DEMO_MODE) {
      const id = isNew ? `demo-new-${Date.now()}` : editingId!;
      setQuestions(prev => isNew ? [{ ...(formData as any), id } as QawlFaslQuestion, ...prev] : prev.map(q => (q.id === id ? ({ ...q, ...(formData as any) } as QawlFaslQuestion) : q)));
      setEditingId(null);
      showAlert('تم الحفظ.' + DEMO_NOTE);
      return;
    }
    const ref = isNew ? doc(collection(db, 'qawl_fasl_questions')) : doc(db, 'qawl_fasl_questions', editingId!);
    try {
      await setDoc(ref, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setEditingId(null);
    } catch (e) {
      console.error(e);
      showAlert('Error saving data');
    }
  };

  const remove = async (id: string) => {
    showConfirm('هل أنت متأكد من حذف هذا السؤال؟', async () => {
      if (IS_DEMO_MODE) { setQuestions(prev => prev.filter(q => q.id !== id)); showAlert('تم الحذف بنجاح' + DEMO_NOTE); return; }
      setIsProcessing(true);
      try {
        await deleteDoc(doc(db, 'qawl_fasl_questions', id));
        showAlert('تم الحذف بنجاح');
      } catch (e: any) {
        console.error(e);
        showAlert(`حدث خطأ أثناء الحذف: ${e.message || 'خطأ غير معروف'}`);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  if (showBulkGen) {
    return (
      <div className="bg-white rounded-[24px] overflow-hidden relative">
        <button onClick={() => setShowBulkGen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full z-10"><X /></button>
        <AdminQawlFaslBulkGen />
      </div>
    );
  }

  if (showUpload) {
    return (
      <div className="bg-white rounded-[24px] overflow-hidden relative p-4 md:p-8">
        <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full z-10"><X /></button>
        <AdminQawlFaslUpload />
      </div>
    );
  }

  if (editingId) {
    return (
      <div className="p-4 md:p-6 bg-white rounded-[24px] space-y-6 max-h-[80vh] overflow-y-auto overflow-x-hidden">
         <div className="flex justify-between items-center gap-3 sticky top-0 bg-white z-10 py-2 border-b">
            <h2 className="text-xl md:text-2xl font-bold leading-snug">إضافة / تعديل سؤال</h2>
            <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-100 rounded-full"><X /></button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">السؤال (العنوان)</label>
                <input type="text" placeholder="مثال: طفلي سألني أين الله؟" className="w-full border p-3 rounded-xl font-bold" value={formData.title || formData.question || ''} onChange={e => setFormData({...formData, title: e.target.value, question: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">التصنيف</label>
                <select className="w-full border p-3 rounded-xl" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 <label className="block text-sm font-bold mb-1 text-blue-900">سياق إضافي للذكاء الاصطناعي (اختياري)</label>
                 <textarea 
                   className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none focus:border-blue-500 mb-3" 
                   rows={3} 
                   placeholder="أضف توجيهات إضافية مثل: ركز على الجانب النفسي أكثر من الشرعي..."
                   value={aiContext}
                   onChange={e => setAiContext(e.target.value)}
                 />
                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="w-full bg-black hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
                 >
                   {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} 
                   {isGenerating ? 'جاري التوليد...' : 'توليد الإجابة بالذكاء الاصطناعي'}
                 </button>
              </div>
            </div>

            <div className="space-y-4 bg-zinc-50 p-4 rounded-[16px] border min-w-0">
               <h3 className="font-bold text-lg border-b pb-2 leading-snug">المحتوى المولّد (معاينة سريعة)</h3>
               {formData.quickSummary ? (
                 <div className="space-y-3 text-sm">
                   <div><strong className="text-black">الملخص السريع:</strong> {formData.quickSummary}</div>
                   <div><strong className="text-emerald-600">قل للطفل:</strong> {formData.quickAnswer?.sayThis}</div>
                   <div><strong className="text-rose-600">لا تقل له:</strong> {formData.quickAnswer?.dontSayThis}</div>
                   <div><strong className="text-amber-600">افعل الآن:</strong> {formData.quickAnswer?.doThisNow}</div>
                   <div><strong className="text-black">مرجع شرعي:</strong> {formData.religiousReference || 'لا يوجد'}</div>
                   <p className="text-xs text-zinc-500 mt-4">* تم توليد باقي التفاصيل مثل الخطوات العملية وحسب العمر والمصادر بنجاح.</p>
                 </div>
               ) : (
                 <div className="text-center text-zinc-400 py-12">
                   لم يتم التوليد بعد. اكتب السؤال واضغط على الزر الأزرق.
                 </div>
               )}
            </div>
         </div>

         <div className="border-t pt-4">
            <div>
              <label className="block text-sm font-bold mb-1">الحالة</label>
              <select className="w-full md:w-1/3 border p-3 rounded-xl mb-4" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="draft">مسودة (غير منشور)</option>
                <option value="published">منشور</option>
              </select>
            </div>
            <button onClick={save} className="w-full sm:w-auto bg-black hover:bg-zinc-900 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2">
              <Check className="w-5 h-5"/> حفظ البيانات
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 overflow-x-clip">
      {alertDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-4">تنبيه</h3>
            <p className="mb-6 text-zinc-600 whitespace-pre-wrap">{alertDialog}</p>
            <button onClick={() => setAlertDialog(null)} className="w-full bg-black text-white py-3 rounded-xl font-bold">موافق</button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-4">تأكيد</h3>
            <p className="mb-6 text-zinc-600 whitespace-pre-wrap">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">نعم، متأكد</button>
              <button onClick={() => setConfirmDialog(null)} className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold leading-snug">إدارة أسئلة قول فصل</h2>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          <button 
            disabled={isProcessing}
            onClick={handleRunAnalysis} className="bg-white text-[#6E5F8E] border border-[#8E7AAE]/25 hover:bg-[#F4F0F8] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="تحليل البحث"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            <span className="inline">تحليل البحث</span>
          </button>
          <button 
            disabled={isProcessing}
            onClick={async () => {
              if (IS_DEMO_MODE) { showAlert('تم توليد 5 مسودات جديدة!' + DEMO_NOTE); return; }
              setIsProcessing(true);
              try {
                await qawlFaslService.autoGenerateMissingDrafts();
                showAlert('تم توليد 5 مسودات جديدة!');
              } catch (e: any) {
                if (e instanceof GeminiKeyMissingError) {
                  showAlert('يبدو أن هناك تعثراً في الوصول، جرد العودة للوضع المجاني عبر الإعدادات وسأستمر معك.');
                } else {
                  console.error(e);
                  showAlert('خطأ أثناء توليد المسودات.');
                }
              } finally {
                setIsProcessing(false);
              }
            }} className="bg-white text-[#6E5F8E] border border-[#8E7AAE]/25 hover:bg-[#F4F0F8] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="توليد مسودات ذكية"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            <span className="inline">توليد مسودات</span>
          </button>
          <button 
            onClick={handleMigrateCategories} 
            disabled={isMigrating || isProcessing} 
            className="bg-white text-[#6E5F8E] border border-[#8E7AAE]/25 hover:bg-[#F4F0F8] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="تحديث التصنيفات"
          >
            <Wand2 className="w-4 h-4"/> <span className="inline">{(isMigrating || isProcessing) ? 'جاري التحديث...' : 'تحديث التصنيفات'}</span>
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => setShowBulkGen(true)} className="bg-white text-[#6E5F8E] border border-[#8E7AAE]/25 hover:bg-[#F4F0F8] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="التوليد الشامل"
          >
            <Database className="w-4 h-4"/> <span className="inline">التوليد الشامل</span>
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => setShowUpload(true)} className="bg-white text-[#6E5F8E] border border-[#8E7AAE]/25 hover:bg-[#F4F0F8] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="رفع الأسئلة"
          >
            <UploadCloud className="w-4 h-4"/> <span className="inline">رفع الأسئلة</span>
          </button>
          <button 
            disabled={isProcessing}
            onClick={openNew} className="bg-[#6E5B91] text-white hover:bg-[#5F4E7F] disabled:opacity-50 font-bold p-2 md:px-4 rounded-xl flex items-center justify-center gap-1 md:gap-2 transition-colors text-xs md:text-sm min-h-11"
            title="سؤال جديد"
          >
             <Plus className="w-4 h-4"/> <span className="inline">سؤال جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-[#FBF8F8] border border-rose-200/60 rounded-[16px] p-4 md:p-6 mb-8 text-[#7A1F33] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-1"><Database className="w-5 h-5"/> إدارة النظام الآلي والتهيئة</h3>
           <p className="text-sm">هذه الإجراءات تؤثر بشكل كبير على قاعدة البيانات. استخدمها بحذر.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
            <button 
              disabled={isProcessing}
              onClick={async () => {
                showConfirm('هل أنت متأكد من مسح جميع البيانات؟ سيتم تصفير النظام تماماً للبدء من جديد.', async () => {
                  if (IS_DEMO_MODE) { showAlert('في العرض لا يُمسح النظام: هذا الزر معطّل عمدًا حتى لا تُفقد البيانات النموذجية.'); return; }
                  setIsProcessing(true);
                  try {
                    const result = await qawlFaslService.backupAndResetQuestions();
                    showAlert(`تم مسح النظام بنجاح! تم حذف ${result.count} سؤال.`);
                  } catch (e: any) {
                    console.error(e);
                    showAlert(`حدث خطأ أثناء المسح: ${e.message || 'خطأ غير معروف'}.`);
                  } finally {
                    setIsProcessing(false);
                  }
                });
            }} className="bg-white hover:bg-rose-50 disabled:opacity-60 text-[#7A1F33] border border-rose-300/70 font-bold px-4 md:px-5 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 leading-snug">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                تهيئة ومسح النظام (مع نسخة احتياطية)
            </button>

            <button 
              disabled={isProcessing}
              onClick={async () => {
                showConfirm('سيتم توليد 10 أسئلة جديدة الآن موزعة على المحاور. سيستغرق ذلك بضع دقائق. هل تريد المتابعة؟', async () => {
                  if (IS_DEMO_MODE) { showAlert('اكتملت العملية!\nنُشر: 7\nبحاجة لمراجعة: 2\nتخطي للتكرار: 1\nأخطاء: 0' + DEMO_NOTE); return; }
                  setIsProcessing(true);
                  try {
                    const res = await qawlFaslService.generateDailyQawlFaslQuestions();
                    showAlert(`اكتملت العملية!\nنُشر: ${res.published}\nبحاجة لمراجعة: ${res.needsReview}\nتخطي للتكرار: ${res.skipped}\nأخطاء: ${res.errors}`);
                  } catch (e: any) {
                    console.error(e);
                    showAlert(`حدث خطأ أثناء التوليد: ${e.message || 'خطأ غير معروف'}. تأكد من صلاحيات المشرف وجودة الاتصال.`);
                  } finally {
                    setIsProcessing(false);
                  }
                });
            }} className="bg-[#6E5B91] hover:bg-[#5F4E7F] disabled:opacity-60 text-white font-bold px-4 md:px-5 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 leading-snug">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                توليد 10 أسئلة (دفعة يومية)
            </button>
        </div>
      </div>

      {questions.length > 0 && (() => {
        const publishedCount = questions.filter(q => q.status === 'published').length;
        const draftCount = questions.length - publishedCount;
        const R = 30;
        const C = 2 * Math.PI * R;
        const publishedLen = (publishedCount / questions.length) * C;
        return (
          <div className="mb-4 flex items-center gap-5 rounded-[16px] border border-[#8E7AAE]/12 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" role="img" aria-label={`منشور ${publishedCount} · مسودة ${draftCount} · ${questions.length}`}>
            <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90" aria-hidden="true">
              <circle cx="38" cy="38" r={R} fill="none" stroke="#E9E2F1" strokeWidth="7" />
              <circle cx="38" cy="38" r={R} fill="none" stroke="#8E7AAE" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${publishedLen} ${C}`} />
              <text x="38" y="38" textAnchor="middle" dominantBaseline="central" transform="rotate(90 38 38)" className="fill-[#182231]" style={{ fontSize: 18, fontWeight: 900 }}>{questions.length}</text>
            </svg>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F0F8] px-3 py-1.5 text-[#6E5F8E]"><span className="h-2 w-2 rounded-full bg-[#8E7AAE]" />منشور <span className="font-black">{publishedCount}</span></span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F6F8] px-3 py-1.5 text-[#64788D]"><span className="h-2 w-2 rounded-full bg-[#E9E2F1] ring-1 ring-[#8E7AAE]/30" />مسودة <span className="font-black">{draftCount}</span></span>
            </div>
          </div>
        );
      })()}

      <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border overflow-hidden">
        <table className="hidden md:table w-full text-right text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="p-4 font-bold text-zinc-600">العنوان</th>
              <th className="p-4 font-bold text-zinc-600">التصنيف</th>
              <th className="p-4 font-bold text-zinc-600">الحالة</th>
              <th className="p-4 font-bold text-zinc-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-8 text-center text-zinc-500">جاري التحميل...</td></tr> : null}
            {!loading && questions.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-zinc-500">لا يوجد أسئلة.</td></tr> : null}
            {questions.map(q => (
              <tr key={q.id} className="border-t">
                <td className="p-4 font-bold text-zinc-800">{q.title || q.question}</td>
                 <td className="p-4 text-zinc-500">{CATEGORIES.find(c => c.id === (q.categoryId || q.categorySlug))?.title || q.category || 'غير مصنف'}</td>
                 <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${q.status==='published' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-800'}`}>{q.status === 'published' ? 'منشور' : q.status === 'draft' ? 'مسودة' : q.status}</span></td>
                 <td className="p-4 flex gap-2">
                   <button onClick={() => { setEditingId(q.id); setFormData(q as any); }} className="text-zinc-400 hover:text-black disabled:opacity-30" disabled={isProcessing}><Edit2 size={16} /></button>
                   <button onClick={() => remove(q.id)} className="text-zinc-400 hover:text-rose-600 disabled:opacity-30" disabled={isProcessing}><Trash2 size={16} /></button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="md:hidden divide-y divide-zinc-100">
          {loading ? <div className="p-8 text-center text-zinc-500">جاري التحميل...</div> : null}
          {!loading && questions.length === 0 ? <div className="p-8 text-center text-zinc-500">لا يوجد أسئلة.</div> : null}
          {questions.map(q => (
            <div key={q.id} className="p-4 space-y-3">
              <div className="space-y-2">
                <p className="font-black text-zinc-900 leading-relaxed">{q.title || q.question}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold">
                    {CATEGORIES.find(c => c.id === (q.categoryId || q.categorySlug))?.title || q.category || 'غير مصنف'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${q.status==='published' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-800'}`}>{q.status === 'published' ? 'منشور' : q.status === 'draft' ? 'مسودة' : q.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setEditingId(q.id); setFormData(q as any); }} className="bg-zinc-100 text-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 min-h-11 disabled:opacity-30" disabled={isProcessing}><Edit2 size={16} /> تعديل</button>
                <button onClick={() => remove(q.id)} className="bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center justify-center gap-2 min-h-11 disabled:opacity-30" disabled={isProcessing}><Trash2 size={16} /> حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Suggested Questions Dashboard */}
      <div className="mt-12 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border p-6">
        <h3 className="text-xl font-bold mb-6 border-b pb-4">اقتراحات محتوى جديدة (بناءً على طلب المستخدمين)</h3>
        {missingQuestions.length === 0 ? <p className="text-zinc-500">لا توجد اقتراحات حاليًا.</p> : (
            <div className="space-y-4">
                {missingQuestions.map(mq => (
                    <div key={mq.id} className="p-4 border rounded-xl bg-zinc-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="min-w-0">
                            <p className="font-bold">{mq.query}</p>
                            <span className="text-xs text-zinc-500">مطلوب {mq.frequency} مرة</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-black text-white px-3 py-2 rounded-lg text-sm font-bold" onClick={() => {
                                if (IS_DEMO_MODE) { setMissingQuestions(prev => prev.filter(x => x.id !== mq.id)); showAlert('تم إعداد إجابة مقترحة للسؤال «' + mq.query + '» وانتقل إلى المسودات.' + DEMO_NOTE); return; }
                                // Simple approve hook
                                qawlFaslService.updateMissingQuestionStatus(mq.id, 'approved', mq.query, 'جاري إعداد الإجابة...');
                                qawlFaslService.getMissingQuestions().then(setMissingQuestions);
                            }}>توليد إجابة</button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* «بلّغ عن خطأ» reports from the answer trust panel */}
      <div className="mt-8 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border p-6">
        <h3 className="text-xl font-bold mb-6 border-b pb-4">بلاغات الأخطاء في الأجوبة</h3>
        {answerReports.length === 0 ? <p className="text-zinc-500">لا توجد بلاغات حالياً.</p> : (
          <div className="space-y-3">
            {answerReports.map(r => (
              <div key={r.id} className={"p-4 border rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 " + (r.status === 'resolved' ? 'bg-white opacity-60' : 'bg-zinc-50')}>
                <div className="min-w-0 space-y-1">
                  <p className="font-bold">{r.questionTitle || r.questionId}</p>
                  <p className="text-xs text-zinc-500">{r.questionId}{r.createdAt?.toDate ? ' · ' + r.createdAt.toDate().toLocaleString('ar-u-nu-latn') : ''}</p>
                  {r.note && <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words">{r.note}</p>}
                  {r.contact && <p className="text-xs text-zinc-600 break-all">للتواصل: {r.contact}</p>}
                </div>
                {r.status !== 'resolved' && (
                  <button className="w-full sm:w-auto shrink-0 bg-black text-white px-3 py-2 rounded-lg text-sm font-bold" onClick={async () => {
                    if (IS_DEMO_MODE) { setAnswerReports(prev => prev.map(x => (x.id === r.id ? { ...x, status: 'resolved' } : x))); return; }
                    try { await qawlFaslService.resolveAnswerReport(r.id); loadReports(); } catch (e) { console.error(e); }
                  }}>تمت المعالجة</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
