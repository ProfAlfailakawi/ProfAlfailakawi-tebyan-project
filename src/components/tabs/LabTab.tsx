import React from 'react';
import { motion } from 'motion/react';
import { Zap, RefreshCw, Box, Camera, Mic, Play, Volume2, Sparkles, LayoutGrid, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { KnowledgeMemoryService } from '../../services/knowledgeMemoryService';
import { proxyGenerateContent, proxyGenerateAudio } from '../../lib/aiProxy';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

const labTools = [
  { id: 'collider', ar: 'مُصادم الأفكار', en: 'Cognitive Collider', tooltip: { ar: 'دمج وتصادم الأفكار المتناقضة لتوليد أفكار جديدة', en: 'Collide contradicting ideas to generate new ones' } },
  { id: 'collision', ar: 'مرايا العقول', en: 'Perspectives Collision', tooltip: { ar: 'مجلس افتراضي يناقش فكرتك من زوايا متضاربة ومتكاملة', en: 'Virtual council discussing your idea from conflicting angles' } },
  { id: 'podcast', ar: 'بودكاست واقعي', en: 'Realistic Podcast', tooltip: { ar: 'يحوله إلى حوار طبيعي جداً بين شخص أو أكثر، لا قراءة نصية', en: 'Turns it into a natural multi-voice conversation, not a read-aloud text' } },
  { id: 'symbols', ar: 'توليد الرموز', en: 'Symbol Factory', tooltip: { ar: 'تحويل المفاهيم المجردة إلى رموز بصرية تعبيرية عميقة', en: 'Transform abstract concepts into profound visual symbols' } },
  { id: 'sound', ar: 'صوت الأفكار', en: 'Idea Echo', tooltip: { ar: 'تحويل ترددات ورنين الأفكار إلى تمثيلات بصرية موجية', en: 'Transform idea frequencies and resonance into visual waveforms' } },
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
  const [activeLabPurpose, setActiveLabPurpose] = React.useState('understand');
  const [showLabPurposePicker, setShowLabPurposePicker] = React.useState(true);
  const [labInput, setLabInput] = React.useState('');
  const [labInput2, setLabInput2] = React.useState(''); // For Collider
  const [labColliderResult, setLabColliderResult] = React.useState<string | null>(null);
  const [labDesign, setLabDesign] = React.useState<any>(null);
  const [labScout, setLabScout] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (initialValue) {
      if (labTools.some(t => t.id === initialValue)) {
        setActiveLabTool(initialValue);
        resetAllLabResults();
      } else {
        setLabInput(initialValue);
      }
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue, onValueUsed]);
  const [labPersonas, setLabPersonas] = React.useState<any[]>([]);
  const [labPodcast, setLabPodcast] = React.useState<any>(null);
  const [labPodcastAudioUrl, setLabPodcastAudioUrl] = React.useState<string | null>(null);
  const [labPodcastAudioMessage, setLabPodcastAudioMessage] = React.useState<string | null>(null);
  const [labUdl, setLabUdl] = React.useState<any[]>([]);
  const [labMindMap, setLabMindMap] = React.useState<any>(null);
  const [labFamilyExplanation, setLabFamilyExplanation] = React.useState('');
  const [labCareer, setLabCareer] = React.useState<any[]>([]);
  const [labWorkshop, setLabWorkshop] = React.useState<any>(null);
  const [labSymbol, setLabSymbol] = React.useState<any>(null);
  const [labSound, setLabSound] = React.useState<any>(null);
  const [labCollision, setLabCollision] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const labPurposes = React.useMemo(() => ([
    { id: 'understand', title: { ar: 'أبي أفهمها ببساطة', en: 'Understand it simply' }, hint: { ar: 'تبسيط وخريطة ذهنية وزوايا متعددة', en: 'Simplify, map, and see angles' }, toolIds: ['family', 'mindmap', 'collision', 'podcast'] },
    { id: 'create', title: { ar: 'أبي فكرة جديدة', en: 'Create a new idea' }, hint: { ar: 'تصادم أفكار ورموز وصوت للفكرة', en: 'Collide ideas, symbols, and resonance' }, toolIds: ['collider', 'symbols', 'sound'] },
    { id: 'build', title: { ar: 'أبي أحولها لمشروع', en: 'Turn it into a project' }, hint: { ar: 'تصميم ومسارات مهنية وورش', en: 'Design, careers, and workshops' }, toolIds: ['design', 'career', 'workshop'] },
    { id: 'audit', title: { ar: 'أبي أفحصها بجدية', en: 'Audit it seriously' }, hint: { ar: 'شخصيات وشمولية وأدوات مناسبة', en: 'Personas, inclusivity, and tools' }, toolIds: ['personas', 'udl', 'scout'] }
  ]), [language]);

  const activeLabPurposeMeta = React.useMemo(() => activeLabPurpose === 'all'
    ? { id: 'all', title: { ar: 'المختبر الكامل', en: 'Full lab' }, hint: { ar: 'كل أدوات المختبر كما هي', en: 'All lab tools unchanged' }, toolIds: labTools.map(t => t.id) }
    : (labPurposes.find(p => p.id === activeLabPurpose) || labPurposes[0]), [activeLabPurpose, labPurposes]);

  const visibleLabTools = React.useMemo(() => {
    const selected = activeLabPurposeMeta;
    return labTools.filter(tool => selected.toolIds.includes(tool.id));
  }, [activeLabPurposeMeta]);

  const playIdeaSound = React.useCallback((freq: number, amp: number, type: string) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Normalize wave type
      const validTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
      const normalizedType = type.toLowerCase() as OscillatorType;
      oscillator.type = validTypes.includes(normalizedType) ? normalizedType : 'sine';
      
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Enveloping (Fade in/out to avoid popping)
      const volume = (amp / 100) * 0.2; // Keep it safe for ears
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 2);
    } catch (e) {
      console.error("Audio Synthesis error:", e);
    }
  }, []);

  React.useEffect(() => {
    if (labSound && !isLoading) {
      // Auto-play on first load
      const timer = setTimeout(() => {
        playIdeaSound(labSound.frequency, labSound.amplitude, labSound.waveType);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [labSound, isLoading, playIdeaSound]);

  const [permissionStatus, setPermissionStatus] = React.useState<'idle' | 'prompting' | 'granted' | 'denied'>('idle');

  const requestPermissions = async () => {
    setPermissionStatus('prompting');
    try {
      // Request camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (err) {
      console.error("Permission denied:", err);
      setPermissionStatus('denied');
    }
  };

  React.useEffect(() => {
    // Only collider check if needed
  }, [activeLabTool]);

  const resetAllLabResults = () => {
    setLabColliderResult(null);
    setLabDesign(null); 
    setLabScout([]); 
    setLabPersonas([]); 
    setLabPodcast(null); 
    setLabPodcastAudioUrl(null);
    setLabPodcastAudioMessage(null); 
    setLabUdl([]); 
    setLabMindMap(null); 
    setLabFamilyExplanation(''); 
    setLabCareer([]); 
    setLabWorkshop(null);
    setLabSymbol(null);
    setLabSound(null);
    setLabCollision(null);
  };


  const buildLabFallbackPodcast = (topic: string) => ({
    title: language === 'ar' ? `بودكاست واقعي: ${topic.slice(0, 48)}` : `Realistic Podcast: ${topic.slice(0, 48)}`,
    guests: language === 'ar' ? ['المحاور', 'ضيف متخصص'] : ['Host', 'Specialist Guest'],
    dialogue: language === 'ar'
      ? [
          { speaker: 'المحاور', text: `خلينا نبدأ من الفكرة نفسها: ${topic}` },
          { speaker: 'ضيف متخصص', text: 'الفكرة تحتاج تفكيك هادئ، ثم تحويلها إلى خطوات صغيرة قابلة للفهم.' },
          { speaker: 'المحاور', text: 'يعني لا نكتفي بالانبهار، نريد معنى عملياً واضحاً.' },
          { speaker: 'ضيف متخصص', text: 'بالضبط، القيمة تظهر حين تتحول الفكرة إلى قرار أو سلوك أو تجربة نافعة.' }
        ]
      : [
          { speaker: 'Host', text: `Let us start with the core idea: ${topic}` },
          { speaker: 'Specialist Guest', text: 'It needs calm unpacking, then small understandable steps.' },
          { speaker: 'Host', text: 'So we are not chasing surprise; we want practical meaning.' },
          { speaker: 'Specialist Guest', text: 'Exactly. The value appears when the idea becomes a useful action.' }
        ],
    conclusion: language === 'ar' ? 'الفكرة الجيدة لا تنتهي في الأذن؛ تبدأ حين تغيّر طريقة النظر.' : 'A good idea does not end in the ear; it begins when it changes how we see.'
  });

  const podcastToSpeechText = (podcast: any) => {
    const lines = Array.isArray(podcast?.dialogue)
      ? podcast.dialogue.map((line: any) => `${line?.speaker || 'Speaker'}: ${line?.text || ''}`).join('\n')
      : '';
    return `${podcast?.title || 'Podcast'}\n\n${lines}\n\n${podcast?.conclusion || ''}`.trim();
  };

  const audioResponseToUrl = (audio: any) => {
    if (!audio?.audioData) return null;
    return `data:${audio.mimeType || 'audio/wav'};base64,${audio.audioData}`;
  };

  const handleRunLabTool = async () => {
    if (!labInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { 
        generateInstructionalDesign, scoutTools, generatePersonas, auditUDL,
        generateMindMap, explainSimply, careerCompass, generateWorkshop, universalOracle,
        generateSymbol, generateIdeaSound, generatePerspectivesCollision, generateResurrectionPodcast
      } = await import('../../services/gemini');
      resetAllLabResults();
      
      const contextQuery = activeLabTool === 'collider' ? `${labInput} VS ${labInput2}` : labInput;

      switch (activeLabTool) {
        case 'collider': 
           if (!labInput2.trim()) { throw new Error("يجب توفير الفكرة الثانية للتصادم!"); }
           const colliderPrompt = `أنت في وضع "مُصادم الأفكار". لقد رمى المستخدم هذين المفهومين المتناقضين في الثقب الأسود:
                المفهوم الأول: "${labInput}"
                المفهوم الثاني: "${labInput2}"
                مهمتك: دمج هذين المفهومين بطريقة مسرحية وفلسفية وتوليد وليدة فكرية جديدة تماماً ومدهشة. اخلق بعداً ثالثاً لم يُفكر به من قبل.`;
           const colliderRes = await KnowledgeMemoryService.processUnderstanding(
               contextQuery,
               colliderPrompt,
               { temperature: 0.9 },
               async (q, p) => await universalOracle(p, 'Cognitive Collider', language) || ''
           );
           setLabColliderResult(colliderRes.text);
           break;
        case 'design': setLabDesign(await generateInstructionalDesign(labInput, "General")); break;
        case 'scout': setLabScout(await scoutTools(labInput)); break;
        case 'personas': setLabPersonas(await generatePersonas(labInput)); break;
        case 'udl': setLabUdl(await auditUDL(labInput)); break;
        case 'mindmap': setLabMindMap(await generateMindMap(labInput)); break;
        case 'family': setLabFamilyExplanation(await explainSimply(labInput, 'شخص غير خبير', language) || ''); break;
        case 'career': setLabCareer(await careerCompass(labInput, language)); break;
        case 'workshop': setLabWorkshop(await generateWorkshop(labInput, language)); break;
        case 'symbols':
          const symbolRes = await KnowledgeMemoryService.processUnderstanding(
              labInput,
              "توليد رمز بصري فلسفي",
              { temperature: 0.8 },
              async () => {
                  const res = await generateSymbol(labInput, language);
                  return JSON.stringify(res);
              }
          );
          try {
              setLabSymbol(JSON.parse(symbolRes.text));
          } catch(e) {
              setLabSymbol(symbolRes.text);
          }
          break;
        case 'sound':
          setLabSound(await generateIdeaSound(labInput, language));
          break;
        case 'collision':
          setLabCollision(await generatePerspectivesCollision(labInput, language));
          break;
        case 'podcast': {
          setLabPodcastAudioMessage(null);
          setLabPodcastAudioUrl(null);
          let podcastResult: any;
          try {
            podcastResult = await generateResurrectionPodcast(labInput, language);
          } catch (podcastError) {
            console.error('Lab podcast script error:', podcastError);
            podcastResult = buildLabFallbackPodcast(labInput);
            setLabPodcastAudioMessage(language === 'ar' ? 'تم إنشاء نسخة مسموعة احتياطية لأن صياغة الحوار الذكي تعثّرت مؤقتاً.' : 'A backup spoken version was created because smart dialogue generation was temporarily unavailable.');
          }
          setLabPodcast(podcastResult);
          try {
            const audio = await proxyGenerateAudio({ text: podcastToSpeechText(podcastResult), style: 'podcast' });
            const audioUrl = audioResponseToUrl(audio);
            if (audioUrl) {
              setLabPodcastAudioUrl(audioUrl);
            } else {
              setLabPodcastAudioMessage(audio?.message || (language === 'ar' ? 'تم إنشاء الحوار، لكن الصوت غير متاح حالياً من الخادم.' : 'The dialogue was created, but audio is currently unavailable from the server.'));
            }
          } catch (audioError) {
            console.error('Lab podcast audio error:', audioError);
            setLabPodcastAudioMessage(language === 'ar' ? 'تم إنشاء الحوار، لكن تعذّر توليد الملف الصوتي حالياً.' : 'The dialogue was created, but the audio file could not be generated right now.');
          }
          break;
        }
      }
    } catch (err: any) {
      setError("أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isLoading && (labSymbol || labColliderResult || labWorkshop || labDesign || labScout.length > 0 || labPersonas.length > 0 || labUdl.length > 0 || labMindMap || labFamilyExplanation || labCareer.length > 0 || labSound || labPodcast)) {
       setTimeout(() => {
           document.getElementById('lab-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isLoading, labSymbol, labColliderResult, labWorkshop, labDesign, labScout, labPersonas, labUdl, labMindMap, labFamilyExplanation, labCareer, labSound, labPodcast]);

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
       <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#8FA9C7]/15 space-y-10">
         <div className="space-y-5">
           <div className="flex items-center justify-between gap-4 flex-wrap">
             <div>
               <h2 className="text-xl font-black flex items-center gap-2 text-[#182231]">
                 <Sparkles className="w-5 h-5" />
                 {language === 'ar' ? 'ماذا تريد من المختبر؟' : 'What do you need from the lab?'}
               </h2>
               <p className="text-sm text-[#64788D] font-bold mt-2">
                 {language === 'ar' ? 'اختر مقصدك أولاً؛ الأدوات كلها موجودة، لكن تبيان يقرّب لك الأنسب.' : 'Choose your intent first; all tools remain available, Tibyan simply brings the best fit closer.'}
               </p>
             </div>
             <button
               type="button"
               onClick={() => { setActiveLabPurpose('all'); setShowLabPurposePicker(false); }}
               className="px-5 py-3 rounded-full bg-[#8E7AAE] text-white font-black text-xs flex items-center gap-2 hover:bg-black active:scale-95 transition-all"
             >
               <LayoutGrid className="w-4 h-4" />
               {language === 'ar' ? 'المختبر الكامل' : 'Full lab'}
             </button>
           </div>

           <div className="space-y-3">
             <button
               type="button"
               onClick={() => setShowLabPurposePicker(v => !v)}
               className="w-full flex items-center justify-between gap-3 rounded-[20px] border border-[#8FA9C7]/18 bg-white/88 px-4 py-3 text-right shadow-sm active:scale-[0.99] transition-all"
             >
               <div>
                 <div className="font-black text-sm md:text-base text-[#182231]">{language === 'ar' ? activeLabPurposeMeta.title.ar : activeLabPurposeMeta.title.en}</div>
                 <div className="text-[11px] md:text-xs font-bold text-[#64788D] mt-0.5">{language === 'ar' ? activeLabPurposeMeta.hint.ar : activeLabPurposeMeta.hint.en}</div>
               </div>
               <ChevronDown className={cn("w-5 h-5 text-[#8E7AAE] transition-transform", showLabPurposePicker && "rotate-180")} />
             </button>
             {showLabPurposePicker && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                 {labPurposes.filter(purpose => purpose.id !== 'all').map(purpose => (
                   <button
                     key={purpose.id}
                     type="button"
                     onClick={() => { setActiveLabPurpose(purpose.id); setShowLabPurposePicker(false); }}
                     className={cn(
                       "text-right p-4 rounded-[22px] border transition-all active:scale-[0.98]",
                       activeLabPurpose === purpose.id ? "bg-[#8E7AAE] text-white border-[#8E7AAE] shadow-lg" : "bg-[#F7F5F2] text-[#3D4A5A] border-[#8FA9C7]/15 hover:bg-white hover:border-zinc-300"
                     )}
                   >
                     <div className="font-black text-sm mb-1">{language === 'ar' ? purpose.title.ar : purpose.title.en}</div>
                     <div className={cn("text-[11px] leading-relaxed font-bold", activeLabPurpose === purpose.id ? "text-white/70" : "text-[#7C8796]")}>{language === 'ar' ? purpose.hint.ar : purpose.hint.en}</div>
                   </button>
                 ))}
               </div>
             )}
           </div>

           <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
             {visibleLabTools.map(tool => (
               <button 
                 key={tool.id} 
                 onClick={() => {
                   setActiveLabTool(tool.id);
                   resetAllLabResults();
                 }} 
                 title={language === 'ar' ? tool.tooltip.ar : tool.tooltip.en}
                 className={cn(
                   "px-6 py-3 rounded-full border-2 text-sm font-bold transition-all break-words text-wrap md:whitespace-nowrap cursor-pointer", 
                   activeLabTool === tool.id ? "bg-[#8E7AAE] text-white border-[#8E7AAE] shadow-[0_8px_30px_rgb(0,0,0,0.04)]" : "bg-white text-[#64788D] border-[#8FA9C7]/15 hover:border-zinc-300"
                 )}
               >
                 <span>{language === 'ar' ? tool.ar : tool.en}</span>
                 <span className={cn("block text-[10px] mt-1 font-bold", activeLabTool === tool.id ? "text-white/60" : "text-[#7C8796]")}>{language === 'ar' ? tool.tooltip.ar : tool.tooltip.en}</span>
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
                        <div className="w-10 h-10 bg-[#8E7AAE] text-white rounded-full flex items-center justify-center font-black shadow-lg">VS</div>
                    </div>
                    <input 
                      value={labInput2} 
                      onChange={(e) => setLabInput2(e.target.value)} 
                      className="flex-1 p-6 border-4 border-zinc-50 rounded-[16px] text-xl font-bold focus:border-rose-200 outline-none transition-all placeholder:text-zinc-300" 
                      placeholder={language === 'ar' ? "الفكرة الثانية (مثال: الأمل)..." : "Concept B..."} 
                    />
                </div>
            ) : activeLabTool === 'artest' ? null : (
                <input 
                  value={labInput} 
                  onChange={(e) => setLabInput(e.target.value)} 
                  className="flex-1 p-6 border-4 border-zinc-50 rounded-[16px] text-xl font-bold focus:border-[#8FA9C7]/25/80 outline-none transition-all" 
                  placeholder={language === 'ar' ? "أدخل الموضوع أو التحدي..." : "Enter topic or challenge..."} 
                />
            )}
            
            {true && (
              <button 
                onClick={handleRunLabTool} 
                disabled={isLoading || (activeLabTool === 'collider' && (!labInput || !labInput2))}
                className={cn(
                  "md:px-12 py-4 rounded-[16px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-3",
                  (isLoading || (activeLabTool === 'collider' && (!labInput || !labInput2))) ? "bg-zinc-400 cursor-not-allowed" : activeLabTool === 'collider' ? "bg-gradient-to-r from-indigo-600 to-rose-600 text-white hover:opacity-90 cursor-pointer" : "bg-[#8E7AAE] text-white hover:bg-zinc-900 cursor-pointer"
                )}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</span>
                  </>
                ) : activeLabTool === 'collider' ? (
                  <span>{language === 'ar' ? 'تصادم 💥' : 'COLLIDE 💥'}</span>
                ) : activeLabTool === 'podcast' ? (
                  <span>{language === 'ar' ? 'إنشاء بودكاست واقعي' : 'Create Realistic Podcast'}</span>
                ) : (
                  <span>{language === 'ar' ? 'تشغيل المختبر' : 'Run Lab'}</span>
                )}
              </button>
            )}
         </div>
         
  
         {error && <div className="text-rose-500 font-bold">{error}</div>}
  
         <div id="lab-results" className="space-y-8 animate-in fade-in slide-in-from-top-4 relative min-h-[200px]">
            {isLoading ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="w-full bg-transparent rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center space-y-6 py-32 border-2 border-dashed border-[#8FA9C7]/25/80"
               >
                 <div className="relative">
                   <div className="w-20 h-20 border-8 border-[#8FA9C7]/15 rounded-full"></div>
                   <RefreshCw className="w-20 h-20 text-[#182231] animate-spin absolute top-0 left-0" />
                 </div>
                 <div className="text-2xl md:text-3xl font-bold text-[#182231]">
                   {language === 'ar' ? 'جاري التحليل والابتكار...' : 'Analyzing & Innovating...'}
                 </div>
                 <p className="text-[#7C8796] font-bold max-w-md text-center text-sm px-6">
                   {language === 'ar' ? 'نقوم حالياً باستخدام محركات الذكاء الاصطناعي لإنشاء مخرجات دقيقة ومخصصة لك.' : 'We are utilizing AI engines to create precise and customized outputs for you.'}
                 </p>
               </motion.div>
            ) : (
              <>
                {activeLabTool === 'symbols' && labSymbol && (
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="flex flex-col items-center gap-8 py-12 bg-[#F7F5F2] rounded-[40px] border border-[#8FA9C7]/15 shadow-inner"
                   >
                     <div className="relative w-56 h-56 flex items-center justify-center">
                        <motion.div 
                           animate={{ 
                             rotate: [0, 90, 180, 270, 360],
                             borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 20% 80% / 25% 80% 20% 75%"]
                           }}
                           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                           className="w-full h-full bg-black/[0.03] border border-[#8E7AAE]/5 backdrop-blur-sm"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="relative">
                             <motion.div 
                               animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                               transition={{ duration: 3, repeat: Infinity }}
                               className="absolute inset-0 bg-black/20 blur-2xl rounded-full"
                             />
                             <Box className="w-16 h-16 text-[#182231] relative z-10" />
                           </div>
                        </div>
                     </div>
                     <div className="text-center space-y-6 max-w-xl px-6">
                         <div className="space-y-3">
                           <h3 className={cn(
                             "text-4xl md:text-5xl font-black text-[#182231] tracking-tight",
                             language === 'en' && "uppercase"
                           )}>
                             {labSymbol.symbolName}
                           </h3>
                           <div className="h-1.5 w-24 bg-black mx-auto rounded-full opacity-20" />
                        </div>
                        <p className="text-[#465568] font-bold leading-relaxed italic text-xl px-8 block">
                           {labSymbol.description}
                        </p>
                        <div className="pt-8 border-t border-[#8FA9C7]/25/60 mt-6 w-full">
                           <div className="inline-block px-5 py-1.5 bg-[#F1EEF4] text-[#64788D] text-[10px] font-black uppercase tracking-[0.2em] mb-4 rounded-full border border-[#8FA9C7]/25">
                              {language === 'ar' ? 'البعد الفلسفي' : 'PHILOSOPHICAL ESSENCE'}
                           </div>
                           <p className="text-lg font-bold text-[#182231] leading-relaxed max-w-lg mx-auto">{labSymbol.significance}</p>
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {activeLabTool === 'sound' && labSound && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-[#F1EEF4] text-[#182231] p-8 md:p-12 rounded-[40px] flex flex-col items-center gap-10 overflow-hidden relative shadow-2xl border border-white/5"
                   >
                     {/* ... sound UI ... */}
                     <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
                     
                     <div className="w-full max-w-lg space-y-4 text-center mb-4 relative z-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-brand-emerald font-black tracking-wide">
                           <Zap className="w-3 h-3" />
                           {language === 'ar' ? 'رنين الأفكار: لكل فكرة بصمة صوتية في الوعي' : 'IDEA RESONANCE: EVERY CONCEPT HAS A SONIC SIGNATURE'}
                        </div>
                     </div>

                     <div className="flex gap-1.5 h-40 items-center relative z-10 group cursor-pointer" onClick={() => playIdeaSound(labSound.frequency, labSound.amplitude, labSound.waveType)}>
                        {[...Array(40)].map((_, i) => (
                           <motion.div 
                              key={i}
                              animate={{ 
                                height: [20, Math.random() * 140 + 20, 20],
                                opacity: [0.3, 0.8, 0.3],
                                backgroundColor: i % 2 === 0 ? "rgba(var(--mood-primary-rgb), 1)" : "rgba(255,255,255,0.4)"
                              }}
                              transition={{ 
                                duration: 0.3 + (i * 0.02), 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 bg-white/20 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                           />
                        ))}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-3xl backdrop-blur-md">
                           <div className="bg-white text-[#182231] p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                              <Play className="w-8 h-8 fill-current" />
                           </div>
                        </div>
                     </div>

                     <div className="text-center space-y-6 relative z-10">
                        <div className="space-y-2">
                           <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">
                              {language === 'ar' ? 'الرنين الإدراكي' : 'COGNITIVE RESONANCE'}
                           </div>
                           <h4 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic drop-shadow-xl">
                              {labInput}
                           </h4>
                        </div>

                        <div className="max-w-md mx-auto p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md shadow-2xl">
                           <p className="text-xl font-bold text-white/90 leading-relaxed italic">
                              "{labSound.sonicDescription}"
                           </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 md:gap-8 justify-center mt-6">
                           <button 
                             onClick={() => playIdeaSound(labSound.frequency, labSound.amplitude, labSound.waveType)}
                             className="bg-white text-[#182231] p-4 rounded-2xl border border-white/20 hover:bg-zinc-200 transition-all flex flex-col items-center justify-center group shadow-xl"
                           >
                              <Volume2 className="w-5 h-5 mb-1 group-hover:scale-[1.03] transition-transform" />
                              <div className="text-[10px] font-black uppercase">{language === 'ar' ? 'استماع' : 'LISTEN'}</div>
                           </button>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="text-[10px] text-[#64788D] font-black uppercase mb-1">{language === 'ar' ? 'التردد' : 'PITCH'}</div>
                              <div className="text-xl font-black text-white">{labSound.frequency}<span className="text-[10px] ml-0.5 opacity-50">Hz</span></div>
                           </div>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="text-[10px] text-[#64788D] font-black uppercase mb-1">{language === 'ar' ? 'النمط' : 'WAVE'}</div>
                              <div className="text-base font-black text-white truncate">{labSound.waveType}</div>
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 )}

                 {activeLabTool === 'collision' && labCollision && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-[#F7F5F2] rounded-[40px] p-8 md:p-12 border border-[#8FA9C7]/25"
                   >
                      <div className="text-center mb-12">
                         <div className="inline-block px-4 py-1.5 bg-[#8E7AAE] text-white rounded-full text-xs font-bold mb-4 uppercase tracking-widest">
                           {language === 'ar' ? 'مجلس مرايا العقول' : 'COUNCIL OF MIRRORS'}
                         </div>
                         <h3 className="text-3xl font-black text-[#182231]">
                           "{labInput}"
                         </h3>
                      </div>

                      <div className="space-y-6 mb-12">
                         {labCollision.dialogue?.map((msg: any, i: number) => (
                           <motion.div 
                             key={i}
                             initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.2 }}
                             className={cn(
                               "flex flex-col gap-2 p-6 rounded-[24px] max-w-2xl",
                               i % 2 === 0 ? "bg-[#FAF9F6]/88 border border-[#8FA9C7]/15 shadow-sm self-start ml-auto" : "bg-[#F1EEF4] text-[#182231] border border-[#8E7AAE] self-end mr-auto"
                             )}
                           >
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-lg text-[#182231]">
                                 {msg.character?.[0]}
                               </div>
                               <div>
                                 <div className={cn("font-black text-lg", i % 2 !== 0 && "text-white")}>{msg.character}</div>
                                 <div className={cn("text-xs font-bold", i % 2 === 0 ? "text-[#64788D]" : "text-[#7C8796]")}>{msg.role}</div>
                               </div>
                             </div>
                             <p className="font-medium leading-relaxed italic">
                               "{msg.message}"
                             </p>
                           </motion.div>
                         ))}
                      </div>

                      <div className="bg-mood-primary/10 rounded-[32px] p-8 border border-mood-primary/20 text-center">
                         <div className="text-mood-primary text-sm font-black uppercase tracking-widest mb-4">
                           {language === 'ar' ? 'الخلاصة الجوهرية' : 'SYNTHESIS'}
                         </div>
                         <p className="text-xl font-bold text-[#182231] leading-relaxed">
                           {labCollision.synthesis}
                         </p>
                      </div>
                   </motion.div>
                 )}

                 {activeLabTool === 'podcast' && labPodcast && (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-[#182231] text-white rounded-[40px] p-6 md:p-12 border border-white/10 shadow-2xl overflow-hidden relative"
                   >
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,122,174,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,195,189,0.18),transparent_30%)] pointer-events-none" />
                     <div className="relative z-10 space-y-8">
                       <div className="text-center space-y-4">
                         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-black tracking-widest uppercase">
                           <Mic className="w-4 h-4" />
                           {language === 'ar' ? 'بودكاست واقعي' : 'REALISTIC PODCAST'}
                         </div>
                         <h3 className="text-3xl md:text-5xl font-black leading-tight max-w-4xl mx-auto">
                           {labPodcast.title}
                         </h3>
                         <p className="text-white/60 font-bold text-sm md:text-base max-w-2xl mx-auto">
                           {language === 'ar'
                             ? 'حوار مكتوب بروح حلقة حقيقية: أخذ ورد، مقاطعات خفيفة، تردد إنساني، وجمل قصيرة تصلح للتسجيل، وليس نصاً مقروءاً.'
                             : 'A conversation shaped like a real episode: back-and-forth, light interruptions, human hesitation, and short recordable lines.'}
                         </p>
                       </div>

                       {(labPodcastAudioUrl || labPodcastAudioMessage) && (
                         <div className="rounded-[24px] bg-white/10 border border-white/10 p-4 md:p-5">
                           {labPodcastAudioUrl ? (
                             <audio controls className="w-full" src={labPodcastAudioUrl}>
                               {language === 'ar' ? 'المتصفح لا يدعم تشغيل الصوت.' : 'Your browser does not support audio playback.'}
                             </audio>
                           ) : null}
                           {labPodcastAudioMessage && (
                             <p className="mt-3 text-sm font-bold leading-relaxed text-white/70">{labPodcastAudioMessage}</p>
                           )}
                         </div>
                       )}

                       {labPodcast.guests?.length > 0 && (
                         <div className="flex flex-wrap justify-center gap-3">
                           {labPodcast.guests.map((guest: string, i: number) => (
                             <span key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white/85">
                               {guest}
                             </span>
                           ))}
                         </div>
                       )}

                       <div className="space-y-4">
                         {labPodcast.dialogue?.map((line: any, i: number) => (
                           <motion.div
                             key={i}
                             initial={{ opacity: 0, y: 12 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: i * 0.05 }}
                             className={cn(
                               "rounded-[28px] p-5 md:p-6 border max-w-3xl",
                               i % 2 === 0
                                 ? "bg-white text-[#182231] border-white/20 ml-auto"
                                 : "bg-white/10 text-white border-white/10 mr-auto"
                             )}
                           >
                             <div className="flex items-center gap-3 mb-3">
                               <div className={cn(
                                 "w-10 h-10 rounded-full flex items-center justify-center font-black",
                                 i % 2 === 0 ? "bg-[#F1EEF4] text-[#8E7AAE]" : "bg-white/15 text-white"
                               )}>
                                 {line.speaker?.[0] || '•'}
                               </div>
                               <div className="font-black text-sm md:text-base">{line.speaker}</div>
                             </div>
                             <p className="text-lg md:text-xl leading-relaxed font-bold">
                               {line.text}
                             </p>
                           </motion.div>
                         ))}
                       </div>

                       {labPodcast.conclusion && (
                         <div className="bg-white/10 rounded-[32px] p-6 md:p-8 border border-white/10 text-center">
                           <div className="text-white/50 text-xs font-black uppercase tracking-widest mb-3">
                             {language === 'ar' ? 'نهاية الحلقة' : 'EPISODE CLOSE'}
                           </div>
                           <p className="text-xl md:text-2xl font-black leading-relaxed">
                             {labPodcast.conclusion}
                           </p>
                         </div>
                       )}
                     </div>
                   </motion.div>
                 )}

                 {activeLabTool === 'collider' && labColliderResult && (
                  <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="bg-zinc-900 text-zinc-100 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl"
                  >
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]"></div>
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.3)] flex items-center justify-center mb-10">
                            <Zap className="w-10 h-10 text-white animate-pulse" />
                         </div>
                         <div className="markdown-body font-serif rtl:font-sans text-xl md:text-2xl leading-[1.8] text-center text-white [&_p]:!text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_strong]:!text-indigo-300 [&_li]:!text-white/90">
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
                          implementation: { ar: 'التنفيذ', en: 'Implementation', color: 'bg-[#EEF4F1]0' },
                          evaluation: { ar: 'التقويم', en: 'Evaluation', color: 'bg-rose-500' }
                        };
                        const step = stepNames[key] || { ar: key, en: key, color: 'bg-[#F7F5F2]0' };
                        
                        return (
                          <motion.div 
                            key={key} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[24px] p-6 border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-[#8FA9C7]/25/80 transition-all flex flex-col h-full"
                          >
                            <div className={cn("absolute top-0 right-0 w-2 h-full", step.color)}></div>
                            <div className="flex flex-col h-full">
                              <div className={cn("w-10 h-10 rounded-[16px] mb-4 flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]", step.color)}>
                                {i + 1}
                              </div>
                              <h4 className="text-sm font-bold uppercase text-[#7C8796] mb-3 tracking-widest">
                                {language === 'ar' ? step.ar : step.en}
                              </h4>
                              <div className="text-sm font-bold text-[#3D4A5A] leading-relaxed flex-grow markdown-body">
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
                        className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-200 transition-all"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center mb-6">
                           <Zap className="text-blue-500 w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-bold text-[#182231] mb-3">{tool.name}</h4>
                        <p className="text-[#465568] font-bold leading-relaxed mb-6">{tool.description}</p>
                        <div className="bg-blue-50/50 p-4 rounded-[16px] border border-blue-100/50 text-sm font-bold text-[#182231] italic">
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
                         className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden"
                       >
                          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500/10"></div>
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-6">
                             <div className="w-14 h-14 bg-indigo-100 rounded-[16px] flex items-center justify-center text-indigo-600 text-2xl font-bold">
                               {p?.name?.[0] || 'S'}
                             </div>
                             <div>
                               <h4 className="text-xl font-bold text-[#182231]">{p.name}</h4>
                               <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{p.learning_style}</div>
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="bg-[#F7F5F2] p-4 rounded-[16px] border border-[#8FA9C7]/15">
                                <div className="text-[10px] font-bold text-[#7C8796] uppercase mb-2">{language === 'ar' ? 'التحديات الرئيسية' : 'Key Challenges'}</div>
                                <div className="text-sm font-bold text-[#3D4A5A]">{p.challenges}</div>
                             </div>
                             <div className="bg-indigo-50/30 p-4 rounded-[16px] border border-indigo-100/30">
                                <div className="text-[10px] font-bold text-indigo-400 uppercase mb-2">{language === 'ar' ? 'الاحتياجات الأساسية' : 'Core Needs'}</div>
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
                         className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white p-6 rounded-[24px] md:rounded-[32px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#A8C3BD]/25 transition-colors"
                       >
                         <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold break-words text-wrap md:whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                           {item.category}
                         </div>
                         <div className="flex-1">
                           <div className="font-bold text-[#182231] text-lg mb-1">{item.recommendation}</div>
                           <div className="text-sm font-bold text-[#64788D]">
                             <span className="text-[#6E948A] font-bold">{language === 'ar' ? 'الأثر:' : 'Impact:'}</span> {item.impact}
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
                         className="bg-[#8E7AAE] text-white px-12 py-6 rounded-[24px] text-2xl md:text-3xl font-bold shadow relative z-20 border-4 border-zinc-800"
                       >
                          {labMindMap.central}
                       </motion.div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        <div className="absolute top-1/2 bottom-0 left-1/2 w-1 bg-[#F1EEF4] -translate-x-1/2 z-0 hidden lg:block"></div>
                        {labMindMap.branches?.map((b: any, i: number) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[24px] md:rounded-[32px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#8FA9C7]/25/80 relative z-10 hover:border-[#8E7AAE] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          >
                             <h4 className="text-xl font-bold text-[#182231] mb-3">{b.title}</h4>
                             <p className="text-sm font-bold text-[#64788D] leading-relaxed">{b.description}</p>
                             <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#F1EEF4] rounded-full flex items-center justify-center text-xs font-bold text-[#7C8796]">
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
                     className="markdown-body p-12 bg-[#FAF9F6]/88 border-2 border-yellow-100 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full -mr-12 -mt-12"></div>
                     <div className="relative z-10 text-[#273548] leading-relaxed">
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
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] md:rounded-[32px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#8E7AAE] transition-all group relative overflow-hidden"
                       >
                         <div className="absolute top-0 left-0 w-2 h-full bg-black transition-all group-hover:w-4"></div>
                         <h4 className="text-2xl font-bold text-[#182231] mb-4 group-hover:text-[#182231] transition-colors">{job.title}</h4>
                         <div className="space-y-6">
                           <div>
                             <div className="text-[10px] font-bold text-[#7C8796] uppercase tracking-widest mb-2">{language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}</div>
                             <p className="text-sm font-bold text-[#465568] leading-relaxed">{job.skills}</p>
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
                    <div className="bg-[#8E7AAE] text-white p-16 rounded-[2.5rem] text-center space-y-6 shadow relative overflow-hidden">
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
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                       >
                          <h4 className="text-xl font-bold text-[#7C8796] uppercase tracking-widest mb-6">🎯 {language === 'ar' ? 'الأهداف الرئيسية' : 'Core Objectives'}</h4>
                          <ul className="space-y-4">
                             {labWorkshop?.objectives?.map((obj: string, i: number) => (
                               <li key={i} className="flex flex-wrap gap-4 items-center bg-[#F7F5F2] p-4 rounded-[16px] border border-[#8FA9C7]/15 font-bold text-[#3D4A5A] transform transition-transform hover:translate-x-2">
                                  <div className="w-8 h-8 bg-[#8E7AAE] text-white rounded-lg flex items-center justify-center shrink-0 text-xs">{i+1}</div>
                                  {obj}
                               </li>
                             ))}
                          </ul>
                       </motion.div>
    
                       <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 0.1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                       >
                          <h4 className="text-xl font-bold text-[#7C8796] uppercase tracking-widest mb-6">🛠️ {language === 'ar' ? 'الأدوات والمواد' : 'Materials & Tools'}</h4>
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
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow"
                       >
                          <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 select-none">🧊</div>
                          <h4 className="text-2xl font-bold text-[#182231] mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#182231] text-xl">🧊</span>
                             {language === 'ar' ? 'كسر الجليد' : 'Ice Breaker'}
                          </h4>
                          <p className="text-2xl md:text-3xl font-bold leading-tight text-[#182231] mb-4">"{labWorkshop?.icebreaker?.title}"</p>
                          <p className="text-[#64788D] font-bold leading-relaxed">{labWorkshop?.icebreaker?.description}</p>
                       </motion.div>
                       
                       <motion.div 
                         initial={{ x: 20, opacity: 0 }}
                         animate={{ x: 0, opacity: 1 }}
                         className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow"
                       >
                          <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 select-none">🤝</div>
                          <h4 className="text-2xl font-bold text-[#182231] mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-[#5F837A] text-xl">🤝</span>
                             {language === 'ar' ? 'النشاط التفاعلي' : 'Interactive Activity'}
                          </h4>
                          <h5 className="text-2xl font-bold text-[#182231] mb-3">{labWorkshop?.interactive_activity?.title}</h5>
                          <p className="text-[#64788D] font-bold leading-relaxed bg-[#EEF4F1]/50 p-6 rounded-[16px] border border-[#A8C3BD]/25/50 italic">
                             {labWorkshop?.interactive_activity?.instructions}
                          </p>
                       </motion.div>
                    </div>
      
                    <div className="space-y-6">
                        <h4 className="text-2xl font-bold text-[#182231] px-4 flex flex-wrap md:flex-nowrap items-center gap-4">
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
                               className="bg-white p-8 rounded-[24px] md:rounded-[32px] border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all group"
                             >
                               <div className="flex justify-between items-start mb-6">
                                  <div className="w-12 h-12 bg-[#8E7AAE] text-white rounded-[16px] flex items-center justify-center font-bold text-xl group-hover:bg-black transition-colors">
                                    {i + 1}
                                  </div>
                                  <span className="text-xs font-bold text-[#182231] bg-black/10 px-4 py-2 rounded-full">{axis?.duration_minutes} min</span>
                               </div>
                               <h5 className="text-2xl font-bold text-[#182231] mb-4">{axis?.title}</h5>
                               <ul className="space-y-4">
                                  {axis?.key_points?.map((pt: string, idx: number) => (
                                    <li key={idx} className="text-sm font-bold text-[#465568] flex gap-3 items-start">
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
                       className="bg-[#8E7AAE] text-white p-16 rounded-[2.5rem] text-center shadow space-y-4"
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
