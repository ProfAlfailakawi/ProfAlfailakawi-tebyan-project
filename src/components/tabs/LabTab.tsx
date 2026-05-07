import React from 'react';
import { motion } from 'motion/react';
import { Zap, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

const labTools = [
  { id: 'collider', ar: 'مُصادم الأفكار', en: 'Cognitive Collider', tooltip: { ar: 'دمج وتصادم الأفكار المتناقضة لتوليد أفكار جديدة', en: 'Collide contradicting ideas to generate new ones' } },
  { id: 'design', ar: 'تصميم استراتيجي', en: 'Strategic Design', tooltip: { ar: 'تصميم مسارات وخطط شاملة وممنهجة', en: 'Design systematic strategic paths' } },
  { id: 'scout', ar: 'كشاف الأدوات', en: 'Tool Scout', tooltip: { ar: 'البحث عن أفضل الأدوات التقنية المناسبة لاحتياجاتك', en: 'Find best tech tools for your needs' } },
  { id: 'personas', ar: 'تحليل الشخصيات', en: 'Persona Analysis', tooltip: { ar: 'تحليل شخصيات الأفراد والدوافع النفسية', en: 'Analyze personas and psychological motives' } },
  { id: 'udl', ar: 'تدقيق الشمولية', en: 'Inclusivity Audit', tooltip: { ar: 'فحص التوافق مع مبادئ التصميم الشامل', en: 'Audit compliance with universal design principles' } },
  { id: 'mindmap', ar: 'خريطة ذهنية', en: 'Mind Map', tooltip: { ar: 'توليد خرائط ذهنية بصرية للمفاهيم المعقدة', en: 'Generate visual mind maps for complex concepts' } },
  { id: 'family', ar: 'التبسيط الشامل', en: 'Universal Explain', tooltip: { ar: 'تبسيط المعلومات المعقدة لشرحها لأي شخص', en: 'Simplify complex info for anyone' } },
  { id: 'career', ar: 'خريطة المهن', en: 'Career Map', tooltip: { ar: 'رسم مسارات مهنية مستقبلية مبنية على المهارات', en: 'Map future careers based on skills' } },
  { id: 'workshop', ar: 'مصنع الورش', en: 'Workshop Factory', tooltip: { ar: 'تصميم ورش عمل ولقاءات تفاعلية متكاملة', en: 'Design complete interactive workshops' } }
];

export const LabTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [activeLabTool, setActiveLabTool] = React.useState('collider');
  const [labInput, setLabInput] = React.useState('');
  const [labInput2, setLabInput2] = React.useState(''); // For Collider
  const [labColliderResult, setLabColliderResult] = React.useState<string | null>(null);
  const [labDesign, setLabDesign] = React.useState<any>(null);
  const [labScout, setLabScout] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (initialValue) {
      setLabInput(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);
  const [labPersonas, setLabPersonas] = React.useState<any[]>([]);
  const [labPodcast, setLabPodcast] = React.useState('');
  const [labUdl, setLabUdl] = React.useState<any[]>([]);
  const [labMindMap, setLabMindMap] = React.useState<any>(null);
  const [labFamilyExplanation, setLabFamilyExplanation] = React.useState('');
  const [labCareer, setLabCareer] = React.useState<any[]>([]);
  const [labWorkshop, setLabWorkshop] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetAllLabResults = () => {
    setLabColliderResult(null);
    setLabDesign(null); 
    setLabScout([]); 
    setLabPersonas([]); 
    setLabPodcast(''); 
    setLabUdl([]); 
    setLabMindMap(null); 
    setLabFamilyExplanation(''); 
    setLabCareer([]); 
    setLabWorkshop(null);
  };

  const handleRunLabTool = async () => {
    if (!labInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { 
        generateInstructionalDesign, scoutTools, generatePersonas, auditUDL,
        generateMindMap, explainSimply, careerCompass, generateWorkshop, universalOracle
      } = await import('../../services/gemini');
      resetAllLabResults();
      switch (activeLabTool) {
        case 'collider': 
           if (!labInput2.trim()) { throw new Error("يجب توفير الفكرة الثانية للتصادم!"); }
           setLabColliderResult(await universalOracle(
               `أنت في وضع "مُصادم الأفكار". لقد رمى المستخدم هذين المفهومين المتناقضين في الثقب الأسود:
                المفهوم الأول: "${labInput}"
                المفهوم الثاني: "${labInput2}"
                مهمتك: دمج هذين المفهومين بطريقة مسرحية وفلسفية وتوليد وليدة فكرية جديدة تماماً ومدهشة. اخلق بعداً ثالثاً لم يُفكر به من قبل.`,
               'Cognitive Collider',
               language
           ));
           break;
        case 'design': setLabDesign(await generateInstructionalDesign(labInput, "General")); break;
        case 'scout': setLabScout(await scoutTools(labInput)); break;
        case 'personas': setLabPersonas(await generatePersonas(labInput)); break;
        case 'udl': setLabUdl(await auditUDL(labInput)); break;
        case 'mindmap': setLabMindMap(await generateMindMap(labInput)); break;
        case 'family': setLabFamilyExplanation(await explainSimply(labInput, 'شخص غير خبير', language) || ''); break;
        case 'career': setLabCareer(await careerCompass(labInput, language)); break;
        case 'workshop': setLabWorkshop(await generateWorkshop(labInput, language)); break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
       <TabHeader 
         icon={Zap}
         title={{ ar: 'المختبر الإبداعي', en: 'Creative Lab' }}
         description={{ 
             ar: 'استخدم أدوات المختبر المتنوعة لابتكار حلول وتصاميم استراتيجية متقدمة مبنية على أسس علمية.', 
             en: 'Use various lab tools to innovate advanced strategic solutions and designs based on scientific principles.' 
         }}
         language={language}
         onBack={() => handleTabChange('discover', '')}
         onClose={() => handleTabChange('discover', '', true)}
       />
       <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-100 space-y-10">
         <div className="space-y-4">
           <h2 className="text-xl font-bold flex items-center gap-2">
             {language === 'ar' ? 'أدوات المختبر' : 'Lab Tools'}
           </h2>
           <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
             {labTools.map(tool => (
               <button 
                 key={tool.id} 
                 onClick={() => {
                   setActiveLabTool(tool.id);
                   resetAllLabResults();
                 }} 
                 title={language === 'ar' ? tool.tooltip.ar : tool.tooltip.en}
                 className={cn(
                   "px-6 py-3 rounded-full border-2 text-sm font-bold transition-all break-words text-wrap md:whitespace-nowrap cursor-pointer", 
                   activeLabTool === tool.id ? "bg-black text-white border-black shadow-[0_8px_30px_rgb(0,0,0,0.04)]" : "bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300"
                 )}
               >
                 {language === 'ar' ? tool.ar : tool.en}
               </button>
             ))}
           </div>
         </div>
         
         <div className="flex flex-col md:flex-row gap-4">
            {activeLabTool === 'collider' ? (
                <div className="flex-1 flex flex-col md:flex-row gap-4">
                    <input 
                      value={labInput} 
                      onChange={(e) => setLabInput(e.target.value)} 
                      className="flex-1 p-6 border-4 border-zinc-50 rounded-[16px] text-xl font-bold focus:border-indigo-200 outline-none transition-all placeholder:text-zinc-300" 
                      placeholder={language === 'ar' ? "الفكرة الأولى (مثال: العدمية)..." : "Concept A..."} 
                    />
                    <div className="flex items-center justify-center -mx-2 z-10 hidden md:flex">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black shadow-lg">VS</div>
                    </div>
                    <input 
                      value={labInput2} 
                      onChange={(e) => setLabInput2(e.target.value)} 
                      className="flex-1 p-6 border-4 border-zinc-50 rounded-[16px] text-xl font-bold focus:border-rose-200 outline-none transition-all placeholder:text-zinc-300" 
                      placeholder={language === 'ar' ? "الفكرة الثانية (مثال: الأمل)..." : "Concept B..."} 
                    />
                </div>
            ) : (
                <input 
                  value={labInput} 
                  onChange={(e) => setLabInput(e.target.value)} 
                  className="flex-1 p-6 border-4 border-zinc-50 rounded-[16px] text-xl font-bold focus:border-zinc-200/80 outline-none transition-all" 
                  placeholder={language === 'ar' ? "أدخل الموضوع أو التحدي..." : "Enter topic or challenge..."} 
                />
            )}
           <button 
             onClick={handleRunLabTool} 
             disabled={isLoading || (activeLabTool === 'collider' && (!labInput || !labInput2))}
             className={cn(
               "md:px-12 py-4 rounded-[16px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-3",
               (isLoading || (activeLabTool === 'collider' && (!labInput || !labInput2))) ? "bg-zinc-400 cursor-not-allowed" : activeLabTool === 'collider' ? "bg-gradient-to-r from-indigo-600 to-rose-600 text-white hover:opacity-90 cursor-pointer" : "bg-black text-white hover:bg-zinc-900 cursor-pointer"
             )}
           >
             {isLoading ? (
               <>
                 <RefreshCw className="w-5 h-5 animate-spin" />
                 <span>{language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</span>
               </>
             ) : activeLabTool === 'collider' ? (
               <span>{language === 'ar' ? 'تصادم 💥' : 'COLLIDE 💥'}</span>
             ) : (
               <span>{language === 'ar' ? 'تشغيل المختبر' : 'Run Lab'}</span>
             )}
           </button>
         </div>
  
         {error && <div className="text-rose-500 font-bold">{error}</div>}
  
         <div className="space-y-8 animate-in fade-in slide-in-from-top-4 relative min-h-[200px]">
            {isLoading ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="w-full bg-transparent rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center space-y-6 py-32 border-2 border-dashed border-zinc-200/80"
               >
                 <div className="relative">
                   <div className="w-20 h-20 border-8 border-zinc-100 rounded-full"></div>
                   <RefreshCw className="w-20 h-20 text-black animate-spin absolute top-0 left-0" />
                 </div>
                 <div className="text-2xl md:text-3xl font-bold text-black">
                   {language === 'ar' ? 'جاري التحليل والابتكار...' : 'Analyzing & Innovating...'}
                 </div>
                 <p className="text-zinc-400 font-bold max-w-md text-center text-sm px-6">
                   {language === 'ar' ? 'نقوم حالياً باستخدام محركات الذكاء الاصطناعي لإنشاء مخرجات تعليمية دقيقة ومخصصة لك.' : 'We are utilizing AI engines to create precise and customized educational outputs for you.'}
                 </p>
               </motion.div>
            ) : (
              <>
                {activeLabTool === 'collider' && labColliderResult && (
                  <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="bg-black text-white rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl"
                  >
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px]"></div>
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.5)] flex items-center justify-center mb-10">
                            <Zap className="w-10 h-10 text-white animate-pulse" />
                         </div>
                         <div className="markdown-body font-serif rtl:font-sans text-xl md:text-2xl leading-[1.8] text-center text-white/90 [&_p]:text-white/90 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-indigo-300">
                            <ReactMarkdown>{labColliderResult}</ReactMarkdown>
                         </div>
                     </div>
                  </motion.div>
                )}

                {activeLabTool === 'design' && labDesign && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {['analysis', 'design', 'development', 'implementation', 'evaluation'].map((key, i) => {
                        const val = labDesign[key];
                        const stepNames: Record<string, {ar: string, en: string, color: string}> = {
                          analysis: { ar: 'التحليل', en: 'Analysis', color: 'bg-blue-500' },
                          design: { ar: 'التصميم', en: 'Design', color: 'bg-indigo-500' },
                          development: { ar: 'التطوير', en: 'Development', color: 'bg-violet-500' },
                          implementation: { ar: 'التنفيذ', en: 'Implementation', color: 'bg-emerald-500' },
                          evaluation: { ar: 'التقويم', en: 'Evaluation', color: 'bg-rose-500' }
                        };
                        const step = stepNames[key] || { ar: key, en: key, color: 'bg-zinc-500' };
                        
                        return (
                          <motion.div 
                            key={key} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[24px] p-6 border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-zinc-200/80 transition-all flex flex-col h-full"
                          >
                            <div className={cn("absolute top-0 right-0 w-2 h-full", step.color)}></div>
                            <div className="flex flex-col h-full">
                              <div className={cn("w-10 h-10 rounded-[16px] mb-4 flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]", step.color)}>
                                {i + 1}
                              </div>
                              <h4 className="text-sm font-bold uppercase text-zinc-400 mb-3 tracking-widest">
                                {language === 'ar' ? step.ar : step.en}
                              </h4>
                              <div className="text-sm font-bold text-zinc-700 leading-relaxed flex-grow markdown-body">
                                 <ReactMarkdown>{val || ''}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
      
                {activeLabTool === 'scout' && labScout.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {labScout?.map((tool: any, i: number) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-200 transition-all"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center mb-6">
                          <Zap className="text-blue-500 w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-black mb-3">{tool.name}</h4>
                        <p className="text-zinc-600 font-bold leading-relaxed mb-6">{tool.description}</p>
                        <div className="bg-blue-50/50 p-4 rounded-[16px] border border-blue-100/50 text-sm font-bold text-black italic">
                          <span className="font-bold">💡 {language === 'ar' ? 'نصيحة:' : 'Tip:'}</span> {tool.usage_tip}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
      
                {activeLabTool === 'personas' && labPersonas.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {labPersonas?.map((p: any, i: number) => (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.1 }}
                         className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden"
                       >
                          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500/10"></div>
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-6">
                             <div className="w-14 h-14 bg-indigo-100 rounded-[16px] flex items-center justify-center text-indigo-600 text-2xl font-bold">
                               {p?.name?.[0] || 'S'}
                             </div>
                             <div>
                               <h4 className="text-xl font-bold text-black">{p.name}</h4>
                               <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{p.learning_style}</div>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="bg-zinc-50 p-4 rounded-[16px] border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">{language === 'ar' ? 'التحديات الرئيسية' : 'Key Challenges'}</div>
                                <div className="text-sm font-bold text-zinc-700">{p.challenges}</div>
                             </div>
                             <div className="bg-indigo-50/30 p-4 rounded-[16px] border border-indigo-100/30">
                                <div className="text-[10px] font-bold text-indigo-400 uppercase mb-2">{language === 'ar' ? 'الاحتياجات التعليمية' : 'Educational Needs'}</div>
                                <div className="text-sm font-bold text-indigo-700 font-bold">🎯 {p.needs}</div>
                             </div>
                          </div>
                       </motion.div>
                     ))}
                   </div>
                )}
      
                {activeLabTool === 'udl' && labUdl.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {labUdl?.map((item: any, i: number) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white p-6 rounded-[24px] md:rounded-[32px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-emerald-100 transition-colors"
                      >
                        <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold break-words text-wrap md:whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                          {item.category}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-black text-lg mb-1">{item.recommendation}</div>
                          <div className="text-sm font-bold text-zinc-500">
                            <span className="text-emerald-500 font-bold">{language === 'ar' ? 'الأثر:' : 'Impact:'}</span> {item.impact}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
      
                {activeLabTool === 'mindmap' && labMindMap && (
                   <div className="space-y-12">
                     <div className="flex justify-center">
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         className="bg-black text-white px-12 py-6 rounded-[24px] text-2xl md:text-3xl font-bold shadow relative z-20 border-4 border-zinc-800"
                       >
                          {labMindMap.central}
                       </motion.div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        <div className="absolute top-1/2 bottom-0 left-1/2 w-1 bg-zinc-100 -translate-x-1/2 z-0 hidden lg:block"></div>
                        {labMindMap.branches?.map((b: any, i: number) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[24px] md:rounded-[32px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200/80 relative z-10 hover:border-black transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          >
                             <h4 className="text-xl font-bold text-black mb-3">{b.title}</h4>
                             <p className="text-sm font-bold text-zinc-500 leading-relaxed">{b.description}</p>
                             <div className="absolute -top-3 -right-3 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-400">
                               {i + 1}
                             </div>
                          </motion.div>
                        ))}
                     </div>
                   </div>
                )}
      
                {activeLabTool === 'family' && labFamilyExplanation && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="markdown-body p-12 bg-white border-2 border-yellow-100 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full -mr-12 -mt-12"></div>
                     <div className="relative z-10 text-zinc-800 leading-relaxed">
                       <ReactMarkdown>{labFamilyExplanation}</ReactMarkdown>
                     </div>
                   </motion.div>
                )}
      
                {activeLabTool === 'career' && labCareer.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {labCareer?.map((job: any, i: number) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] md:rounded-[32px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-black transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-2 h-full bg-black transition-all group-hover:w-4"></div>
                        <h4 className="text-2xl font-bold text-black mb-4 group-hover:text-black transition-colors">{job.title}</h4>
                        <div className="space-y-6">
                          <div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}</div>
                            <p className="text-sm font-bold text-zinc-600 leading-relaxed">{job.skills}</p>
                          </div>
                          <div className="bg-brand-emerald/5 p-4 rounded-[16px] border border-brand-emerald/10 text-xs font-bold text-brand-emerald text-center">
                            <span className="bg-brand-emerald text-white px-2 py-0.5 rounded mr-1">🚀</span> {job.impact}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
      
                {activeLabTool === 'workshop' && labWorkshop && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="bg-black text-white p-16 rounded-[2.5rem] text-center space-y-6 shadow relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_5s_infinite]"></div>
                       <motion.h3 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto relative z-10"
                       >
                         {labWorkshop?.title}
                       </motion.h3>
                       <div className="flex flex-wrap justify-center gap-4 relative z-10">
                          <span className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full font-bold text-sm border border-white/10">👥 {labWorkshop?.target_audience}</span>
                          <span className="bg-black px-6 py-2 rounded-full font-bold text-sm shadow-lg">⏱️ {labWorkshop?.duration}</span>
                       </div>
                    </div>
    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                       >
                          <h4 className="text-xl font-bold text-zinc-400 uppercase tracking-widest mb-6">🎯 {language === 'ar' ? 'الأهداف التعليمية' : 'Learning Objectives'}</h4>
                          <ul className="space-y-4">
                             {labWorkshop?.objectives?.map((obj: string, i: number) => (
                               <li key={i} className="flex flex-wrap gap-4 items-center bg-zinc-50 p-4 rounded-[16px] border border-zinc-100 font-bold text-zinc-700 transform transition-transform hover:translate-x-2">
                                  <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shrink-0 text-xs">{i+1}</div>
                                  {obj}
                               </li>
                             ))}
                          </ul>
                       </motion.div>
    
                       <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 0.1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                       >
                          <h4 className="text-xl font-bold text-zinc-400 uppercase tracking-widest mb-6">🛠️ {language === 'ar' ? 'الأدوات والمواد' : 'Materials & Tools'}</h4>
                          <div className="flex flex-wrap gap-3">
                             {labWorkshop?.materials?.map((mat: string, i: number) => (
                               <span key={i} className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-[16px] font-bold text-sm border border-indigo-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                 {mat}
                               </span>
                             ))}
                          </div>
                       </motion.div>
                    </div>
      
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <motion.div 
                         initial={{ x: -20, opacity: 0 }}
                         animate={{ x: 0, opacity: 1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow"
                       >
                          <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 select-none">🧊</div>
                          <h4 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                            <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-black text-xl">🧊</span>
                            {language === 'ar' ? 'كسر الجليد' : 'Ice Breaker'}
                          </h4>
                          <p className="text-2xl md:text-3xl font-bold leading-tight text-black mb-4">"{labWorkshop?.icebreaker?.title}"</p>
                          <p className="text-zinc-500 font-bold leading-relaxed">{labWorkshop?.icebreaker?.description}</p>
                       </motion.div>
                       
                       <motion.div 
                         initial={{ x: 20, opacity: 0 }}
                         animate={{ x: 0, opacity: 1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow"
                       >
                          <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 select-none">🤝</div>
                          <h4 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xl">🤝</span>
                            {language === 'ar' ? 'النشاط التفاعلي' : 'Interactive Activity'}
                          </h4>
                          <h5 className="text-2xl font-bold text-black mb-3">{labWorkshop?.interactive_activity?.title}</h5>
                          <p className="text-zinc-500 font-bold leading-relaxed bg-emerald-50/50 p-6 rounded-[16px] border border-emerald-100/50 italic">
                            {labWorkshop?.interactive_activity?.instructions}
                          </p>
                       </motion.div>
                    </div>
      
                    <div className="space-y-6">
                        <h4 className="text-2xl font-bold text-black px-4 flex flex-wrap md:flex-nowrap items-center gap-4">
                          <span className="w-2 h-8 bg-black rounded-full"></span>
                          {language === 'ar' ? 'محاور الورشة' : 'Workshop Axes'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {labWorkshop?.axes?.map((axis: any, i: number) => (
                             <motion.div 
                               key={i} 
                               initial={{ y: 20, opacity: 0 }}
                               animate={{ y: 0, opacity: 1 }}
                               transition={{ delay: i * 0.1 }}
                               className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all group"
                             >
                               <div className="flex justify-between items-start mb-6">
                                  <div className="w-12 h-12 bg-black text-white rounded-[16px] flex items-center justify-center font-bold text-xl group-hover:bg-black transition-colors">
                                    {i + 1}
                                  </div>
                                  <span className="text-xs font-bold text-black bg-black/10 px-4 py-2 rounded-full">{axis?.duration_minutes} min</span>
                               </div>
                               <h5 className="text-2xl font-bold text-black mb-4">{axis?.title}</h5>
                               <ul className="space-y-4">
                                  {axis?.key_points?.map((pt: string, idx: number) => (
                                    <li key={idx} className="text-sm font-bold text-zinc-600 flex gap-3 items-start">
                                       <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full mt-2 shrink-0"></div>
                                       {pt}
                                    </li>
                                  ))}
                               </ul>
                             </motion.div>
                           ))}
                        </div>
                    </div>
      
                    <motion.div 
                       initial={{ y: 30, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       className="bg-black text-white p-16 rounded-[2.5rem] text-center shadow space-y-4"
                    >
                       <h4 className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">{language === 'ar' ? 'الخلاصة المدوية' : 'The Final Impression'}</h4>
                       <p className="text-2xl md:text-4xl font-bold italic leading-tight max-w-4xl mx-auto relative">
                         <span className="absolute -top-8 -left-8 text-8xl text-white/10 select-none">"</span>
                         {labWorkshop?.closing}
                         <span className="absolute -bottom-12 -right-8 text-8xl text-white/10 select-none">"</span>
                       </p>
                    </motion.div>
                  </div>
                )}
              </>
            )}
         </div>
       </div>
    </motion.div>
  );
});
