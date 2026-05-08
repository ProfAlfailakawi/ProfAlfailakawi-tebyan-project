import React, { useState, useRef } from 'react';
import { collection, getDocs, doc, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { generateQawlFaslContent, GeminiKeyMissingError } from '../../../services/qawlFaslAiService';
import { CATEGORIES } from './types';

interface UploadReport {
  total: number;
  saved: number;
  duplicates: number;
  needsReview: number;
  errors: number;
  categoryDistribution?: Record<string, number>;
}

export default function AdminQawlFaslUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<UploadReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [stopGeneration, setStopGeneration] = useState(false);
  const stopRef = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setReport(null);
      setProgress(0);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);
    setReport(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(sheet);

      if (data.length === 0) {
        alert('الملف فارغ!');
        setIsUploading(false);
        return;
      }

      // Fetch existing questions to check for duplicates
      const snap = await getDocs(collection(db, 'qawl_fasl_questions'));
      const existingQuestions = new Set(snap.docs.map(d => d.data().question?.trim()));

      let saved = 0;
      let duplicates = 0;
      let needsReview = 0;
      let errors = 0;
      const categoryDistribution: Record<string, number> = {};

      // Group into batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + BATCH_SIZE);

        for (const row of chunk) {
          const normalizedRow: Record<string, any> = {};
          if (row && typeof row === 'object') {
            Object.keys(row).forEach(key => {
              const normalizedKey = key.trim().toLowerCase();
              normalizedRow[normalizedKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            });
          }

          const qText = normalizedRow['question'] || normalizedRow['question'] || normalizedRow['السؤال'] || '';
          if (!qText) {
            errors++;
            continue;
          }

          if (existingQuestions.has(qText)) {
            duplicates++;
            continue;
          }

          const newDocRef = doc(collection(db, 'qawl_fasl_questions'));
          
          // Data Extraction and Cleanup
          const ageGroupStr = normalizedRow['agegroup'] || normalizedRow['agegroups'] || '';
          const keywordsStr = normalizedRow['keywords'] || '';

          // Fallbacks for missing categorizations
          const cSlug = normalizedRow['categoryslug'] || 'general';
          const catTitle = normalizedRow['category'] || CATEGORIES.find(c => c.id === cSlug)?.title || 'قسم عام';
          
          let mainCat = normalizedRow['maincategory'];
          if (!mainCat) {
            mainCat = normalizedRow['category'];
          }
          if (!mainCat) {
            mainCat = 'غير مصنف';
          }
          
          const riskLevel = normalizedRow['risklevel'] || 'medium';

          batch.set(newDocRef, {
            question: qText,
            categoryId: cSlug,
            categorySlug: cSlug,
            category: catTitle,
            mainCategory: mainCat,
            ageGroups: ageGroupStr ? String(ageGroupStr).split(',').map((s: string) => s.trim()) : ['7-9', '10-12'],
            keywords: keywordsStr ? String(keywordsStr).split(',').map((s: string) => s.trim()) : [],
            riskLevel: riskLevel,
            status: 'draft',
            source: 'bulk-upload',
            reviewStatus: {
              educational: 'needs_review',
              religious: 'needs_review',
              sources: 'needs_review'
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          categoryDistribution[mainCat] = (categoryDistribution[mainCat] || 0) + 1;
          saved++;
          needsReview++;
          existingQuestions.add(qText); // prevent duplicates within the same file
        }

        await batch.commit();
        setProgress(Math.round(((i + chunk.length) / data.length) * 100));
        // Small delay to let the UI breathe
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setReport({
        total: data.length,
        saved,
        duplicates,
        needsReview,
        errors,
        categoryDistribution
      });

    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء معالجة الملف.');
    } finally {
      setIsUploading(false);
      setProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
    }
  };

  const handleGenerateAnswers = async () => {
    if (isGenerating) return;
    
    const confirmMsg = 'سيتم البحث عن كافة الأسئلة بصيغة "مسودة" التي لا تحتوي على إجابات، وتوليد الإجابات لها ببطء عبر الذكاء الاصطناعي. هل أنت متأكد؟ (الرجاء ترك الصفحة مفتوحة)';
    if (!confirm(confirmMsg)) return;

    setIsGenerating(true);
    setStopGeneration(false);
    stopRef.current = false;

    try {
      // Find questions that need generation
      const q = query(collection(db, 'qawl_fasl_questions'), where('status', '==', 'draft'));
      const snap = await getDocs(q);
      
      const unprocessed = snap.docs.filter(d => {
        const data = d.data();
        return !data.quickSummary && data.source === 'bulk-upload'; // Only unprocessed bulk uploaded ones
      });

      if (unprocessed.length === 0) {
        alert('لا توجد مسودات مرفوعة معلقة بدون إجابات.');
        setIsGenerating(false);
        return;
      }

      setGenProgress({ current: 0, total: unprocessed.length });

      for (let i = 0; i < unprocessed.length; i++) {
        if (stopRef.current) {
          console.log('Generation stopped by user');
          break;
        }

        const docSnap = unprocessed[i];
        const data = docSnap.data();

        try {
          // Add a context to explain it's a draft process safely
          const generatedData = await generateQawlFaslContent(data.question);
          
          const batch = writeBatch(db);
          batch.update(docSnap.ref, {
            ...generatedData,
            status: 'draft', // FORCE KEEP AS DRAFT
            updatedAt: serverTimestamp()
          });
          
          await batch.commit();
        } catch (err: any) {
          console.error(`Error generating for ${data.question}`, err);
          const errorStr = (err?.message || JSON.stringify(err)).toLowerCase();
          if (errorStr.includes("api key") || errorStr.includes("gemini_api_key_not_configured")) {
             throw err; // Stop the whole process if API key is the issue
          }
          // Continue to next on other errors
        }

        setGenProgress({ current: i + 1, total: unprocessed.length });
        
        // Wait 2-3 seconds between requests to prevent AI rate limiting
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      alert('تم إنهاء التوليد.');
    } catch (e: any) {
      const errorStr = (e?.message || JSON.stringify(e)).toLowerCase();
      if (errorStr.includes("api key") || errorStr.includes("gemini_api_key_not_configured")) {
        alert('لم أستطع الوصول للمحرك الآن.. جرّب مرة أخرى أو تأكد من المفتاح في الإعدادات.');
      } else {
        console.error(e);
        alert('يبدو أن الفكرة تحتاج لحظة إضافية… جرّب مرة أخرى.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[16px] border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-xl font-bold text-zinc-800 mb-2 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-black" />
          الرفع المجمع لملفات (Excel / CSV)
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          ارفع ملف يحتوي على آلاف الأسئلة دفعة واحدة. سيتم معالجة الملف في مجموعات (Batching) وحفظها كمسودات (Drafts) بأمان.
          الأعمدة المتوقعة: <code className="bg-zinc-100 px-1 py-0.5 rounded">question, category, mainCategory, categorySlug, ageGroup, riskLevel, keywords</code>
        </p>

        <div className="flex gap-2 mb-6">
           <button onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + "question,category,mainCategory,categorySlug,ageGroup,riskLevel,keywords\n" + "أين الله؟,الإيمان والأسئلة الدينية,الإيمان والأسئلة الوجودية,faith-religious-questions,7-9,low,الله, وجود الله\n";
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "qawl_fasl_template.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
           }} className="text-sm text-black hover:text-blue-800 underline font-bold">
             تحميل ملف قالب (Template)
           </button>
        </div>

        <div className="border-2 border-dashed border-zinc-300 rounded-[16px] p-8 text-center bg-zinc-50 hover:bg-zinc-100 transition-colors">
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="bulk-upload"
            disabled={isUploading}
          />
          <label htmlFor="bulk-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-blue-100 text-black rounded-full flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <span className="font-bold text-black">اضغط لاختيار ملف</span>
              <span className="text-zinc-500 block text-sm mt-1">
                {file ? file.name : "يدعم صيغ .xlsx و .csv"}
              </span>
            </div>
          </label>
        </div>

        {file && !isUploading && progress === 0 && !report && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={processFile}
              className="bg-black hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl"
            >
              بدء الرفع والمعالجة
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm font-bold text-zinc-600">
              <span>جاري المعالجة...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-400 text-center">الرجاء عدم إغلاق النافذة</p>
          </div>
        )}

        {report && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 p-6 rounded-[16px]">
            <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5" /> اكتملت المعالجة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
                <div className="text-2xl font-bold text-zinc-800">{report.total}</div>
                <div className="text-xs font-bold text-zinc-500 mt-1">الأسئلة بالملف</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
                <div className="text-2xl font-bold text-emerald-600">{report.saved}</div>
                <div className="text-xs font-bold text-zinc-500 mt-1">تم حفظها بنجاح</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
                <div className="text-2xl font-bold text-rose-500">{report.duplicates}</div>
                <div className="text-xs font-bold text-zinc-500 mt-1">متكررة (تم تخطيها)</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
                <div className="text-2xl font-bold text-amber-500">{report.needsReview}</div>
                <div className="text-xs font-bold text-zinc-500 mt-1">تحتاج مراجعة (كـ مسودة)</div>
              </div>
            </div>

            {report.categoryDistribution && Object.keys(report.categoryDistribution).length > 0 && (
              <div className="bg-white p-5 rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h4 className="font-bold text-zinc-800 mb-3 text-sm">توزيع التصنيفات المضافة:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.categoryDistribution).map(([cat, count]) => (
                    <div key={cat} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-sm flex gap-2 items-center">
                      <span className="font-bold">{cat}</span>
                      <span className="bg-white text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[16px] border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-xl font-bold text-zinc-800 mb-2 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-600" />
          توليد الإجابات للأسئلة المرفوعة (AI Batch)
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          ستقوم هذه الأداة بجلب جميع المسودات المرفوعة مؤخراً ولا تحتوي على إجابات، وتقوم بتوليدها وتنسيقها بواسطة الذكاء الاصطناعي تدريجياً لعدم تجاوز حد الاستخدام. سيتم حفظها جميعاً كـ (مسودة).
        </p>

        {isGenerating ? (
          <div className="space-y-4 bg-indigo-50 border border-indigo-100 p-6 rounded-[16px] text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div className="font-bold text-indigo-900">
              جاري التوليد... ({genProgress.current} من {genProgress.total})
            </div>
            <div className="w-full max-w-md mx-auto bg-indigo-200 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => {
                stopRef.current = true;
                setStopGeneration(true);
              }}
              className="mt-4 flex items-center gap-2 text-rose-600 font-bold hover:text-rose-700 mx-auto"
            >
              <StopCircle className="w-5 h-5" /> إيقاف مؤقت
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerateAnswers}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl"
          >
            <PlayCircle className="w-5 h-5" />
            توليد الإجابات للمسودات الآن
          </button>
        )}
      </div>
    </div>
  );
}
