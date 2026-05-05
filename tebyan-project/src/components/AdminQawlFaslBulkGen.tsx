import React, { useState } from 'react';
import { Brain, Upload, CheckCircle2, AlertCircle, Play, FileJson, Download } from 'lucide-react';
import { generateQawlFaslContent, GeminiKeyMissingError } from '../services/qawlFaslAiService';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface CategorizedQuestion {
  question: string;
  category: string;
  categorySlug: string;
}

const slugify = (text: string) => {
    // Simple slugifier for Arabic/English
    return text
        .toLowerCase()
        .replace(/[^\w\s\u0621-\u064A]/g, '') // Keep Arabic characters and alphanumeric
        .trim()
        .replace(/\s+/g, '-');
};

export default function AdminQawlFaslBulkGen() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [categorizedQuestions, setCategorizedQuestions] = useState<CategorizedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ id: string; message: string; type: 'info'|'success'|'error'; timestamp: string }[]>([]);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);

  const addLog = (message: string, type: 'info'|'success'|'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const timestamp = now.toLocaleString("ar-KW", {
      dateStyle: "short",
      timeStyle: "medium"
    });
    setLogs(prev => [{ id, message, type, timestamp }, ...prev]);
  };

  const loadDefaultIndex = async () => {
    try {
      const response = await fetch('/questions_index.json');
      const data = await response.json();
      if (Array.isArray(data)) {
        const mapped = data.map(q => ({
            question: q,
            category: 'غير مصنف',
            categorySlug: 'uncategorized'
        }));
        setCategorizedQuestions(mapped);
        addLog(`Loaded ${data.length} questions from system index.`, 'success');
      }
    } catch (err) {
      addLog('Failed to load default index file. Please upload manually.', 'error');
    }
  };

  const downloadResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedResults, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "qawl_fasl_generation_results.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      
      let finalQuestions: CategorizedQuestion[] = [];

      // Try JSON
      try {
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed)) {
            parsed.forEach(item => {
                if (typeof item === 'object' && item.category && Array.isArray(item.questions)) {
                    // Method 1: Organized JSON
                    const cat = item.category;
                    const slug = slugify(cat);
                    item.questions.forEach((q: string) => {
                        finalQuestions.push({ question: q, category: cat, categorySlug: slug });
                    });
                } else if (typeof item === 'string') {
                    finalQuestions.push({ question: item, category: 'غير مصنف', categorySlug: 'uncategorized' });
                }
            });
        }
        
        if (finalQuestions.length > 0) {
            setCategorizedQuestions(finalQuestions);
            addLog(`Loaded ${finalQuestions.length} categorized questions from JSON.`, 'success');
            return;
        }
      } catch (e) {
        // Fallback to TXT
      }

      // Method 2: TXT with Headers
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let currentCategory = 'غير مصنف';
      let currentSlug = 'uncategorized';

      lines.forEach(line => {
          if (line.startsWith('#')) {
              currentCategory = line.substring(1).trim();
              currentSlug = slugify(currentCategory);
          } else if (line.length > 5) {
              finalQuestions.push({
                  question: line,
                  category: currentCategory,
                  categorySlug: currentSlug
              });
          }
      });

      setCategorizedQuestions(finalQuestions);
      addLog(`Loaded ${finalQuestions.length} questions from Text file.`, 'success');
    };
    reader.readAsText(file);
  };

  const startBulkGeneration = async () => {
    if (categorizedQuestions.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setGeneratedResults([]);
    
    const BATCH_SIZE = 10;
    const totalQuestions = categorizedQuestions.length;
    const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);
    
    addLog(`Starting bulk generation for ${totalQuestions} questions in ${totalBatches} batches...`, 'info');

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let b = 0; b < totalBatches; b++) {
        const startIdx = b * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, totalQuestions);
        const batchItems = categorizedQuestions.slice(startIdx, endIdx);
        
        addLog(`--- Starting Batch ${b + 1} / ${totalBatches} ---`, 'info');

        for (let i = 0; i < batchItems.length; i++) {
            const item = batchItems[i];
            const globalIdx = startIdx + i;
            
            if (item.categorySlug === 'uncategorized') {
                addLog(`⚠️ Question saved without detected category: "${item.question.substring(0, 30)}..."`, 'error');
            }

            addLog(`[Batch ${b + 1}] Processing ${i + 1}/${batchItems.length}: "${item.question.substring(0, 40)}..."`, 'info');
            
            try {
                const generatedData = await generateQawlFaslContent(item.question);
                
                // Format and save to Firestore
                const docData = {
                    question: item.question,
                    title: item.question,
                    category: item.category,
                    categorySlug: item.categorySlug,
                    ageGroups: ['4-6', '7-9', '10-12'],
                    sensitivity: 'medium',
                    tags: [],
                    status: 'published',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    reviewStatus: {
                        educational: "needs_review",
                        religious: "needs_review",
                        sources: "needs_review"
                    },
                    ...generatedData
                };
                
                await addDoc(collection(db, 'qawl_fasl_questions'), docData);
                results.push(docData);
                setGeneratedResults([...results]); 
                addLog(`✅ Saved to DB.`, 'success');
                successCount++;
            } catch (error: any) {
                if (error instanceof GeminiKeyMissingError) {
                    addLog(`❌ يبدو أنك قمت بإضافة مفتاح API غير صالح في الإعدادات. الرجاء حذفه من (Settings) للتمكن من استخدام المفتاح المجاني الافتراضي للمنصة.`, 'error');
                } else {
                    console.error(error);
                    addLog(`❌ Failed to process: ${error.message}`, 'error');
                }
                failCount++;
            }
            setProgress(((globalIdx + 1) / totalQuestions) * 100);
        }
    }
    
    addLog(`🎉 All questions processed successfully!`, 'success');
    addLog(`📊 Summary: ${successCount} successful, ${failCount} failed. Total: ${totalQuestions}`, 'info');
    setIsProcessing(false);
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    categorizedQuestions.forEach(q => {
        stats[q.category] = (stats[q.category] || 0) + 1;
    });
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-10 flex justify-between items-start">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-indigo-600" />
                محرك التوليد الشامل (Bulk Generator)
            </h1>
            <p className="text-slate-600 mt-2 font-medium">قم برفع ملف الأسئلة ليقوم الذكاء الاصطناعي بتوليد المحتوى وحفظه في قاعدة البيانات مباشرة.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={loadDefaultIndex}
                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
                <FileJson className="w-4 h-4" /> تحميل الفهرس الافتراضي
            </button>
            {generatedResults.length > 0 && (
                <button 
                    onClick={downloadResults}
                    className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> تحميل النتائج (JSON)
                </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-slate-500" /> ١. رفع ملف الأسئلة</h2>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".txt,.json,.csv"
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        <FileJson className="w-10 h-10 text-indigo-400 mb-3" />
                        <span className="font-bold text-slate-700">اختر ملف (TXT أو JSON)</span>
                        <span className="text-sm text-slate-500 mt-1">يدعم الأسئلة المنظمة بأقسام</span>
                    </label>
                </div>
            </div>

            {categorizedQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        معاينة محتوى الملف
                    </h2>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl text-sm">
                            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">تم اكتشاف:</div>
                            {Object.entries(stats).map(([cat, count]) => (
                                <div key={cat} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                    <span className={cat === 'غير مصنف' ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                                        {cat}:
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">{count} سؤال</span>
                                </div>
                            ))}
                            <div className="mt-3 pt-2 text-right border-t border-slate-200 font-black text-indigo-600">
                                الإجمالي: {categorizedQuestions.length} سؤال
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Play className="w-5 h-5 text-slate-500" /> ٢. بدء التوليد</h2>
                <button
                    onClick={startBulkGeneration}
                    disabled={isProcessing || categorizedQuestions.length === 0}
                    className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    {isProcessing ? (
                        <span>جاري المعالجة ({Math.round(progress)}%)</span>
                    ) : (
                        <>
                            <Brain className="w-5 h-5" />
                            بدء المعالجة الشاملة ({categorizedQuestions.length} سؤال)
                        </>
                    )}
                </button>
                
                {isProcessing && (
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                        <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
                
                <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm font-bold flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>تحذير: لا تقم بإغلاق هذه الصفحة أثناء التوليد. سيتم حفظ كل سؤال في قاعدة البيانات (Firestore) فور اكتماله.</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                Logs / سجل العمليات
            </h2>
            <div className="flex-1 bg-black/50 rounded-xl p-4 overflow-y-auto space-y-2 font-mono text-xs md:text-sm text-left dir-ltr">
                {logs.map(log => (
                    <div key={log.id} className={
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'error' ? 'text-rose-400' :
                        'text-slate-300'
                    }>
                        <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-slate-500 text-center mt-10">Waiting to start...</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
