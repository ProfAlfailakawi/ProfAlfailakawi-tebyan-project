import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { ArrowRight, Lightbulb, UserCheck, ShieldAlert, FileText, CheckCircle2, PlayCircle, BookOpen, Link, Share2, Volume2, Play, Pause, Loader2, Bookmark, BookmarkCheck, Ghost } from 'lucide-react';
import { QawlFaslQuestion, CATEGORIES } from './types';
import { cn } from '../../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { qawlFaslService } from '../../../services/qawlFaslService';
import { generateAudioForText, generatePodcastScript } from '../../../services/qawlFaslAiService';
import { BreathingText } from '../../BreathingText';

interface Props {
  questions: QawlFaslQuestion[];
  onBack: () => void;
  questionId: string;
  onQuestion: (question: any) => void;
  language?: 'ar' | 'en';
}

export default function QuestionDetailView({ questions, onBack, questionId, onQuestion, language = 'ar' }: Props) {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  
  const getDefaultTab = (): 'quick' | 'deep' | 'age' | 'steps' | 'resources' => {
    return 'quick';
  };

  const [activeTab, setActiveTab] = useState<'quick' | 'deep' | 'age' | 'steps' | 'resources'>(getDefaultTab());
  const [related, setRelated] = useState<QawlFaslQuestion[]>([]);
  
  const [shadowResponse, setShadowResponse] = useState<string | null>(null);
  const [isSummoningShadow, setIsSummoningShadow] = useState(false);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentQuestion = questions.find(q => q.id === questionId);
  const lastKnownQuestion = useRef(currentQuestion);

  useEffect(() => {
      if (currentQuestion) lastKnownQuestion.current = currentQuestion;
  }, [currentQuestion]);

  const question = currentQuestion || lastKnownQuestion.current;

  const isSaved = (preferences.savedLibrary || []).some(item => {
    if (!item || !question) return false;
    if (typeof item === 'object') {
      return item.id === question.id || JSON.stringify(item) === JSON.stringify(question);
    }
    return item === question.id;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    // Reset audio state when question changes
    if (audioRef.current && isPlaying) {
        audioRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setIsAudioGenerating(false);

    async function fetchData() {
      if (!questionId) return;
      const relatedQuestions = await qawlFaslService.getRelatedQuestions(questionId);
      setRelated(relatedQuestions);
      await qawlFaslService.incrementViewCount(questionId);
    }
    fetchData();
  }, [questionId]);
  
  const handlePlayAudio = async () => {
    if (audioUrl && audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        return;
    }

    if (isAudioGenerating || !question) return;

    // Browser Speech Synthesis Fallback function
    const playWithBrowserSynth = () => {
      const synth = window.speechSynthesis;
      if (synth.speaking) {
        synth.cancel();
        setIsPlaying(false);
        return;
      }

      const textToSpeak = question.suggestedAnswer || question.quickSummary;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      
      const voices = synth.getVoices();
      if (language === 'ar') {
          // Prefer high quality Arabic voices
          const preferredVoice = voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Google') || v.name.includes('Premium'))) || 
                                voices.find(v => v.lang.startsWith('ar'));
          if (preferredVoice) utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      synth.speak(utterance);
    };

    try {
        setIsAudioGenerating(true);
        // Only attempt AI script if we have reason to believe it might work
        const script = await generatePodcastScript(question);
        
        // Generate the audio based on the script
        let url: string | null = null;
        try {
          url = await generateAudioForText(script);
        } catch (audioErr) {
          console.warn("AI Audio gen failed, falling back to browser synthesis");
        }
        
        if (url) {
            setAudioUrl(url);
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play();
                }
            }, 100);
        } else {
            playWithBrowserSynth();
        }
    } catch (e: any) {
        console.warn("AI Path failed, using reliable browser fallback");
        playWithBrowserSynth();
    } finally {
        setIsAudioGenerating(false);
    }
  };

  if (!question) {
    return (
        <div className="p-8 text-center font-medium text-[#5A5A40]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            جاري تحميل المسألة...
        </div>
    );
  }

  const category = CATEGORIES.find(c => c.id === question.categorySlug);

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl min-h-[80vh] font-sans pb-24">
      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#EBEAE4] sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-6 md:py-10 flex items-start gap-4 md:gap-6">
          <button 
            onClick={onBack}
            className="mt-1 flex items-center justify-center bg-[#F6F5F0] hover:bg-[#EBEAE4] text-[#2A2925] rounded-full w-10 h-10 md:w-12 md:h-12 shrink-0 transition-colors"
          >
            <ArrowRight className="w-5 h-5 md:w-6 h-6" />
          </button>
          <div className="space-y-4 md:space-y-6 flex-1 min-w-0">
             <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold font-mono uppercase tracking-widest">
               <span className="bg-[#EAECE6] text-[#5A5A40] px-3 py-1.5 rounded-full">{category?.title}</span>
               {question.riskLevel === 'high' && <span className="bg-[#FAF0E6] text-[#A6603F] px-3 py-1.5 rounded-full">حساسية</span>}
               <span className="bg-[#F0F4FA] text-[#4A6B8C] px-3 py-1.5 rounded-full">أعمار: {question.ageGroups.join(', ')}</span>
             </div>
             <div className="flex items-start justify-between gap-4">
               <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2A2925] leading-snug lg:leading-tight flex-1 tracking-tight min-w-0">
                 {question.question || question.title}
               </h1>
               <div className="flex items-center gap-2 shrink-0">
                 <button 
                    onClick={() => {
                      if (isSaved) {
                        removeFromLibrary(question);
                      } else {
                        addToLibrary({
                          ...question,
                          type: 'qawlfasl',
                        }, 'qawlfasl');
                      }
                    }}
                   className={cn(
                     "p-3 md:p-4 rounded-full transition-all shrink-0",
                     isSaved
                       ? "bg-[#2A2925] text-white"
                       : "bg-[#F6F5F0] text-[#6B6A65] hover:bg-[#EBEAE4] hover:text-[#2A2925]"
                   )}
                   title={language === 'ar' ? "حفظ في المكتبة" : "Save to Library"}
                 >
                   {isSaved ? (
                     <BookmarkCheck className="w-4 h-4 md:w-5 md:h-5" />
                   ) : (
                     <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
                   )}
                 </button>
                 <button 
                   onClick={async () => {
                     if (navigator.share) {
                       try {
                         await navigator.share({
                           title: question.question || question.title,
                           text: `سؤال مهم سأله طفلي: "${question.question || question.title}". إليك أفضل جواب وجدته في قول فصل:`,
                           url: window.location.href,
                         });
                       } catch (err) {
                         if (err instanceof Error && err.name !== 'AbortError') {
                           console.error(err);
                         }
                       }
                     }
                   }}
                   className="p-3 md:p-4 bg-[#F6F5F0] text-[#6B6A65] rounded-full hover:bg-[#EBEAE4] hover:text-[#2A2925] transition-colors shrink-0"
                   title="مشاركة"
                 >
                   <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
               </div>
             </div>
          </div>
        </div>

        {/* Reassurance Message */}
        <div className="bg-[#F2F0E9] border-y border-[#EBEAE4] py-2 md:py-3 text-center text-[#5A5A40] font-bold text-xs md:text-sm tracking-wide px-4">
          هذا السؤال طبيعي جدًا… ويحدث مع كثير من الأطفال.
        </div>

        {/* Pill Navigation */}
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-3 md:py-6 flex gap-2 md:gap-3 overflow-x-auto no-scrollbar">
           {[
             { id: 'quick', label: 'الجواب السريع', icon: CheckCircle2 },
             { id: 'deep', label: 'تحليل السلوك والسياق', icon: Lightbulb },
             { id: 'age', label: 'حسب العمر', icon: UserCheck },
             { id: 'steps', label: 'خطوات وتمارين', icon: FileText },
             { id: 'resources', label: 'للاستزادة', icon: BookOpen },
           ].map(t => (
              <button
               key={t.id}
               onClick={() => setActiveTab(t.id as any)}
               className={cn(
                 "px-4 py-2.5 md:px-7 md:py-3.5 text-xs md:text-base font-bold flex items-center gap-1.5 md:gap-2 rounded-full shrink-0 whitespace-nowrap transition-all border shadow-sm",
                 activeTab === t.id 
                   ? "bg-[#2A2925] text-white border-[#2A2925] shadow-[0_8px_30px_rgb(0,0,0,0.08)]" 
                   : "bg-white text-[#6B6A65] border-[#EBEAE4] hover:bg-[#F6F5F0]"
               )}
             >
               <t.icon className="w-4 h-4 md:w-5 md:h-5" /> {t.label}
             </button>
           ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 md:py-16 w-full space-y-12 md:space-y-16 flex-1">
        
        {/* Quick Tab */}
        {activeTab === 'quick' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 border border-[#EBEAE4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-1">
                <h3 className="text-xl font-black text-zinc-950 mb-4 flex items-center gap-2">
                   <Lightbulb className="text-zinc-600 w-6 h-6" /> الملخص السريع
                </h3>
                <p className="text-zinc-700 font-medium leading-[1.85] text-base md:text-xl">{question.quickSummary}</p>
              </div>
              <button 
                onClick={handlePlayAudio}
                disabled={isAudioGenerating}
                className={cn(
                    "shrink-0 flex items-center justify-center gap-3 px-8 py-5 rounded-full font-bold transition-all shadow-[0_8px_20px_rgb(0,0,0,0.08)] active:scale-[0.98] text-lg w-full md:w-[340px]",
                    isPlaying ? "bg-[#F2F0E9] text-[#5A5A40] border border-[#EACD9B]" : "bg-[#A68F58] text-white hover:bg-[#8F7948]",
                    isAudioGenerating ? "opacity-75 cursor-wait" : ""
                )}
              >
                {isAudioGenerating ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> جاري التجهيز...</>
                ) : isPlaying ? (
                    <><Pause className="w-6 h-6" /> إيقاف الصوت</>
                ) : (
                    <><Volume2 className="w-6 h-6" /> استمع للإجابة (بودكاست قصة)</>
                )}
              </button>
            </div>

            {/* Devil's Advocate Shadow Button */}
            {!shadowResponse && !isSummoningShadow && (
                <div className="flex justify-center -mt-2 mb-4">
                    <button 
                        onClick={async () => {
                            setIsSummoningShadow(true);
                            try {
                                const { universalOracle } = await import('../../../services/gemini');
                                const res = await universalOracle(
                                    `أنت "القرين الفلسفي" (Devil's Advocate Shadow). 
                                     المستخدم يقرأ إجابة على هذا السؤال الذي يطرحه الأطفال عادة: "${question.question}".
                                     وملخص الإجابة هو: "${question.quickSummary}".
                                     مهمتك: الظهور فجأة للهجوم الفكري الناقد. قم بتحدي ومهاجمة الافتراضات الموجودة في الإجابة أو السؤال نفسه من زاوية مختلفة تماماً (ربما علمية بحتة، عدمية، أو فلسفية صادمة لكن راقية). اجعل المستخدم يعيد التفكير في كل شيء. لا تكن وقحاً، بل تكن حاد الذكاء ومستفزاً فكرياً. لا تستخدم مقدمات، تحدث مباشرة كأنك قرينه الذي ظهر من العدم.`,
                                    'Philosophical Shadow',
                                    'ar'
                                );
                                setShadowResponse(res);
                            } catch(e) {
                                // fail
                            } finally {
                                setIsSummoningShadow(false);
                            }
                        }}
                        className="text-[#A6603F] text-sm font-bold flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#F2D7C8] hover:bg-[#FAF0E6] bg-white transition-colors"
                    >
                        <Ghost className="w-4 h-4" /> استدعاء القرين الفلسفي والمخالف
                    </button>
                </div>
            )}

            {isSummoningShadow && (
                <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-[24px] shadow-2xl flex flex-col items-center justify-center animate-pulse">
                    <Ghost className="w-8 h-8 text-rose-500 mb-4 animate-bounce" />
                    <p className="text-rose-400 font-bold tracking-widest text-sm">جاري استدعاء الظل من العالم الموازي...</p>
                </div>
            )}

            {shadowResponse && (
                <div className="bg-zinc-900 border-l-4 border-rose-600 rounded-[24px] p-6 md:p-10 shadow-[0_10px_40px_rgba(225,29,72,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl"></div>
                    <div className="flex items-start gap-4 md:gap-6 relative z-10">
                        <div className="w-12 h-12 bg-rose-950/50 rounded-full flex items-center justify-center shrink-0 border border-rose-900">
                            <Ghost className="w-6 h-6 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-black text-rose-500 mb-4 tracking-wider">ظلّك الفلسفي يتحدث:</h4>
                            <div className="markdown-body font-serif rtl:font-sans text-rose-100/90 leading-relaxed text-lg">
                                <ReactMarkdown>{shadowResponse}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#F0F5ED] rounded-[24px] p-8 border border-[#DFEBD8] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h4 className="font-bold text-[#4B6B42] mb-4 flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-6 h-6" /> قل للطفل:
                </h4>
                <p className="text-[#2A2925] font-medium leading-[1.85] text-base md:text-lg">"{question.quickAnswer.sayThis}"</p>
              </div>
              
              <div className="bg-[#FAF0E6] rounded-[24px] p-8 border border-[#F2D7C8] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h4 className="font-bold text-[#A6603F] mb-4 flex items-center gap-2 text-lg">
                  <ShieldAlert className="w-6 h-6" /> لا تقل:
                </h4>
                <p className="text-[#2A2925] font-medium leading-[1.85] text-base md:text-lg">"{question.quickAnswer.dontSayThis}"</p>
              </div>
              
              <div className="bg-[#2A2925] text-white rounded-[24px] p-8 shadow-[0_10px_30px_rgb(0,0,0,0.15)] flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <h4 className="font-bold text-[#EBEAE4] mb-4 flex items-center gap-2 text-lg">
                     افعل الآن:
                  </h4>
                  <p className="text-white font-bold leading-[1.85] text-xl">{question.quickAnswer.doThisNow}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deep Tab */}
        {activeTab === 'deep' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 border border-[#EBEAE4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
               <div>
                 <h3 className="text-2xl font-bold text-[#2A2925] mb-4">خطأ شائع احذره</h3>
                 <p className="text-[#A6603F] font-medium bg-[#FAF0E6] p-5 md:p-6 rounded-[16px] border border-[#F2D7C8] leading-[1.85] text-base md:text-lg">
                   {question.commonMistake}
                 </p>
               </div>
               
               <div className="pt-8 border-t border-[#EBEAE4]">
                 <h3 className="text-2xl font-bold text-[#4A6B8C] mb-4">التحليل الاستراتيجي والنفسي</h3>
                 <BreathingText 
                    className="text-[#5A5A40] font-medium leading-[2] text-base md:text-lg" 
                    text={question.educationalView} 
                    language={language}
                 />
               </div>
               
               <div className="pt-8 border-t border-[#EBEAE4]">
                 <h3 className="text-2xl font-bold text-[#A68F58] mb-4">جواب استرشادي</h3>
                 <BreathingText 
                   className="text-[#5A5A40] font-medium leading-[1.85] bg-white/60 backdrop-blur-2xl border border-[#EACD9B] p-5 md:p-6 rounded-[16px] italic text-lg md:text-xl"
                   text={`"${question.suggestedAnswer}"`}
                   language={language}
                 />
               </div>
               
               {question.religiousReference && (
                 <div className="pt-8 border-t border-[#EBEAE4]">
                   <h3 className="text-xl font-bold text-[#4B6B42] mb-4">إضاءة شرعية وتوجيه محكم</h3>
                   <p className="text-[#2A2925] font-bold bg-[#F0F5ED] p-5 md:p-6 rounded-[16px] text-base md:text-lg leading-[1.85]">{question.religiousReference}</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Age Tab */}
        {activeTab === 'age' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {question.byAgeVersions.map((version, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-8 border border-[#EBEAE4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-6 items-start">
                 <div className="shrink-0 bg-[#F2F0E9] text-[#5A5A40] px-6 py-2 rounded-full font-bold text-sm tracking-wide">
                   عمر: {version.age}
                 </div>
                 <p className="text-[#2A2925] font-medium leading-[1.85] text-base md:text-lg pt-1">{version.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 border border-[#EBEAE4] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h3 className="text-2xl font-bold text-[#2A2925] mb-6 flex items-center gap-3">
                <CheckCircle2 className="text-[#4B6B42] w-8 h-8" /> خطوات عملية
              </h3>
              <ul className="space-y-4">
                {question.practicalSteps.map((step, idx) => (
                  <li key={idx} className="flex flex-wrap md:flex-nowrap gap-4 text-[#5A5A40] font-medium bg-white/60 backdrop-blur-2xl p-5 rounded-[16px] border border-[#EBEAE4] text-base md:text-lg">
                    <span className="w-8 h-8 rounded-full bg-[#EAECE6] text-[#2A2925] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                    <span className="mt-1">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 border border-[#EBEAE4] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h3 className="text-2xl font-bold text-[#2A2925] mb-6 flex items-center gap-3">
                <Lightbulb className="text-[#A68F58] w-8 h-8" /> تمارين تطبيقية
              </h3>
              <ul className="space-y-4">
                {question.exercises.map((ex, idx) => (
                  <li key={idx} className="flex flex-wrap md:flex-nowrap gap-4 text-[#5A5A40] font-medium p-4 bg-[#F2F0E9] rounded-[16px] text-base md:text-lg">
                    <span className="shrink-0 text-[#A68F58] font-bold text-2xl leading-none pt-0.5">•</span>
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {question.whenToWorry && (
              <div className="bg-[#FAF0E6] rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 border border-[#F2D7C8] flex flex-col sm:flex-row gap-6">
                 <ShieldAlert className="w-10 h-10 text-[#A6603F] shrink-0" />
                 <div>
                   <h3 className="text-[#A6603F] font-bold text-2xl mb-3">متى أطلب التدخل المختص؟</h3>
                   <p className="text-[#2A2925] font-medium text-base md:text-lg leading-[1.85]">{question.whenToWorry}</p>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {question.resources.map((res, idx) => {
              const Wrapper = res.url ? 'a' : 'div';
              const props = res.url ? { href: res.url, target: '_blank', rel: 'noopener noreferrer' } : {};
              
              return (
                <Wrapper key={idx} {...props} className={cn("block bg-white rounded-[24px] p-6 border border-[#EBEAE4] shadow-[0_2px_8_rgba(0,0,0,0.04)] transition-all group", res.url ? "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#A68F58] cursor-pointer" : "")}>
                  <div className="flex flex-col gap-4">
                     <div className={cn("w-14 h-14 rounded-full bg-[#F2F0E9] flex items-center justify-center text-[#5A5A40] transition-colors", res.url ? "group-hover:text-white group-hover:bg-[#A68F58]" : "")}>
                       {res.type === 'video' ? <PlayCircle className="w-7 h-7" /> : res.type === 'book' ? <BookOpen className="w-7 h-7" /> : res.type === 'study' ? <FileText className="w-7 h-7" /> : <Link className="w-7 h-7" />}
                     </div>
                     <div>
                       <h4 className={cn("font-bold text-[#2A2925] text-xl transition-colors", res.url ? "group-hover:text-[#A68F58]" : "")}>{res.title}</h4>
                       <p className="text-[#6B6A65] font-medium mt-2 leading-[1.85]">{res.description}</p>
                       {!res.url && <p className="text-sm font-bold text-[#A3A19C] mt-3 uppercase tracking-widest">متوفر في المكتبات</p>}
                     </div>
                  </div>
                </Wrapper>
              );
            })}
            </div>
            
            <div className="bg-[#2A2925] text-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 text-center mt-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-[#A68F58] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="font-serif italic font-light text-2xl md:text-3xl mb-6 text-[#EACD9B]">ومضة ختامية</h3>
              <p className="text-xl font-medium leading-[1.85] max-w-2xl mx-auto">"{question.closingThought}"</p>
            </div>

            {/* Trust Layer */}
            <div className="bg-white border border-[#EBEAE4] rounded-[24px] md:rounded-[32px] p-5 md:p-8 lg:p-12 text-center space-y-6">
               <p className="text-[#2A2925] font-bold text-xl">تم إعداد هذه الإجابة عبر مصادر موثوقة</p>
               <div className="flex justify-center gap-3 flex-wrap">
                 {question.reviewStatus.educational === 'published' && <span className="bg-[#F2F0E9] text-[#5A5A40] px-4 py-2 rounded-full text-sm font-bold tracking-wide">✓ تدقيق واعتماد الحالة</span>}
                 {question.reviewStatus.religious === 'published' && <span className="bg-[#F0F5ED] text-[#4B6B42] px-4 py-2 rounded-full text-sm font-bold tracking-wide">✓ التدقيق الشرعي</span>}
                 {question.reviewStatus.sources === 'published' && <span className="bg-[#EAECE6] text-[#2A2925] px-4 py-2 rounded-full text-sm font-bold tracking-wide">✓ المصادر والمراجع</span>}
               </div>

               <div className="pt-8 border-t border-[#EBEAE4] mt-8">
                 <p className="font-bold text-[#5A5A40] mb-6 text-lg">هل وجدت هذه الإجابة مفيدة لموقفك؟</p>
                 <div className="flex flex-wrap gap-4 justify-center">
                   <button onClick={() => qawlFaslService.submitFeedback(questionId, 'positive')} className="bg-[#F0F5ED] text-[#4B6B42] hover:bg-[#E3EEDB] px-6 py-3 rounded-full font-bold transition-colors">نعم، جداً</button>
                   <button onClick={() => qawlFaslService.submitFeedback(questionId, 'partial')} className="bg-[#F6F5F0] text-[#5A5A40] hover:bg-[#EAECE6] px-6 py-3 rounded-full font-bold transition-colors">جزئياً</button>
                   <button onClick={() => qawlFaslService.submitFeedback(questionId, 'negative')} className="bg-[#FAF0E6] text-[#A6603F] hover:bg-[#F2D7C8] px-6 py-3 rounded-full font-bold transition-colors">لا</button>
                 </div>
               </div>
            </div>

            {/* Related Questions */}
            {related.length > 0 && (
              <div className="mt-16 space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-[#2A2925] text-center">أهالي آخرون سألوا أيضاً</h3>
                <div className="grid gap-4 max-w-3xl mx-auto">
                  {related.map(rel => (
                     <button 
                       key={rel.id}
                       onClick={() => onQuestion(rel)}
                       className="bg-white rounded-[24px] p-6 border border-[#EBEAE4] text-right shadow-[0_4px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:border-[#A68F58] transition-all flex items-center justify-between group"
                     >
                        <span className="font-bold text-[#2A2925] text-lg group-hover:text-[#A68F58] transition-colors">{rel.question || rel.title}</span>
                        <div className="w-10 h-10 rounded-full bg-[#F6F5F0] group-hover:bg-[#A68F58] flex items-center justify-center shrink-0 transition-colors">
                          <ArrowRight className="w-5 h-5 text-[#6B6A65] group-hover:text-white" />
                        </div>
                     </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
