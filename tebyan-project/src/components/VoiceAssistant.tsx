import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader2, Sparkles, X, Volume2, Activity } from 'lucide-react';
import { universalOracle } from '../services/gemini';
import { cn } from '../lib/utils';

export const VoiceAssistant = ({ language }: { language: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const initRecognition = () => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim()) {
           handleProcess(transcriptRef.current);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'aborted') {
          console.warn('Speech recognition aborted - this is often benign.');
          return;
        }
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorStatus(language === 'ar' ? 'يرجى السماح بالوصول للميكروفون من إعدادات المتصفح، أو فتح التطبيق في علامة تبويب جديدة.' : 'Please allow microphone access in your browser settings, or open this app in a new tab.');
        } else if (event.error === 'network') {
          setErrorStatus(language === 'ar' ? 'خطأ في الشبكة. يرجى التحقق من اتصالك.' : 'Network error. Please check your connection.');
        } else {
          setErrorStatus(language === 'ar' ? `حدث خطأ: ${event.error}` : `Error: ${event.error}`);
        }
        setIsListening(false);
      };
    }
  };

  useEffect(() => {
    // Warm up voices
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const toggleListen = () => {
    setErrorStatus(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorStatus(language === 'ar' ? 'عذراً، المتصفح الخاص بك لا يدعم مساعد الصوت.' : 'Sorry, your browser does not support voice assistant.');
      return;
    }
    
    initRecognition();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcriptRef.current.trim()) {
        handleProcess(transcriptRef.current);
      }
    } else {
      setTranscript('');
      transcriptRef.current = '';
      setResponse('');
      setIsListening(true);
      try {
        recognitionRef.current?.start();
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (e) {
        console.error("SpeechRecognition start error:", e);
        setErrorStatus(language === 'ar' ? 'حدث خطأ عند محاولة بدء المساعد الصوتي.' : 'Error starting voice assistant.');
        setIsListening(false);
      }
    }
  };

  const handleProcess = async (textToProcess?: string) => {
    const finalTranscript = textToProcess || transcript;
    if (!finalTranscript.trim()) return;
    setIsProcessing(true);
    try {
      const gptResult = await universalOracle(
        `أجب باختصار شديد ومباشر وبطريقة مسموعة للمستخدم (كأنك مساعد صوتي ذكي يتحدث). المستخدم قال المشكلة التالية: "${finalTranscript}".
         اللغة: ${language === 'ar' ? 'العربية' : 'English'}`, 
        'Voice Assistant', 
        language
      );
      setResponse(gptResult);
      
      // Speak the response
      const synth = window.speechSynthesis;
      synth.cancel(); // Stop any current speech
      const utter = new SpeechSynthesisUtterance(gptResult.replace(/[*#_]/g, '')); // Clean markdown for speech
      utter.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      
      if (language === 'ar') {
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('ar') && v.name.includes('Female')) ||
                              voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Google') || v.name.includes('Premium'))) || 
                              voices.find(v => v.lang.startsWith('ar'));
        if (preferredVoice) utter.voice = preferredVoice;
      }
      
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      
      synth.speak(utter);
    } catch (e) {
      setResponse(language === 'ar' ? 'عذراً، حدث خطأ في الاتصال.' : 'Sorry, connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopAll = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      window.speechSynthesis.cancel();
      setIsListening(false);
      setIsSpeaking(false);
      setIsOpen(false);
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open_voice_assistant', handleOpen);
    return () => window.removeEventListener('open_voice_assistant', handleOpen);
  }, []);

  return (
    <>
      {/* Assistant Modal/Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "fixed inset-0 z-[100] w-full h-full bg-zinc-950 text-white overflow-hidden flex flex-col p-6 items-center justify-center"
            )}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
             <button 
                onClick={stopAll} 
                className={cn(
                    "absolute top-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all",
                    language === 'ar' ? "right-8" : "left-8"
                )}
             >
                <X className="w-6 h-6" />
             </button>

             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className="w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
             </div>

             <div className="z-10 text-center mt-4 mb-12">
                 <h3 className="text-3xl font-black text-white/90">
                     {language === 'ar' ? 'وضع العمق والتركيز' : 'Zen Deep Dive'}
                 </h3>
                 <p className="text-zinc-500 text-lg mt-2">
                     {language === 'ar' ? 'مساحة للتفكير العميق بعيدآ عن المشتتات' : 'A space for deep thinking away from distractions'}
                 </p>
             </div>

             <div className="z-10 flex-1 flex flex-col items-center justify-center min-h-[200px] w-full max-w-4xl relative">
                 <AnimatePresence mode="popLayout">
                    {isProcessing && (
                         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mb-6" />
                            <p className="text-zinc-400 animate-pulse font-medium text-lg">{language === 'ar' ? 'أتعمق في المشهد...' : 'Deep diving...'}</p>
                         </motion.div>
                    )}
                    {response && !isProcessing && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center w-full">
                            <div className="p-8 max-h-[60vh] overflow-y-auto w-full no-scrollbar">
                                <p className="text-white font-medium text-center text-3xl md:text-5xl leading-relaxed tracking-tight">{response}</p>
                            </div>
                        </motion.div>
                    )}
                    {!isProcessing && !response && (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center w-full">
                            {errorStatus ? (
                                <p className="text-rose-400 font-bold mb-4">{errorStatus}</p>
                            ) : isListening ? (
                                <div className="space-y-8">
                                    <div className="flex justify-center gap-2">
                                        {[1,2,3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: [1, 1.5, 1] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-4 h-4 rounded-full bg-emerald-400"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-emerald-400 font-black animate-pulse text-lg tracking-widest uppercase">{language === 'ar' ? 'أنا أستمع لك... تفضل' : 'LISTENING...'}</p>
                                    {transcript && (
                                        <p className="text-white/60 font-medium text-2xl md:text-4xl px-4 mt-8">{transcript}</p>
                                    )}
                                </div>
                            ) : transcript ? (
                                <p className="text-3xl font-bold text-white/50 pb-4 mb-4">{transcript}</p>
                            ) : (
                                <p className="text-zinc-600 italic text-2xl">{language === 'ar' ? 'بانتظار صوتك...' : 'Waiting for your voice...'}</p>
                            )}
                         </motion.div>
                    )}
                 </AnimatePresence>
             </div>

             <div className="z-10 flex justify-center mt-auto pb-12">
                 <button
                    onClick={toggleListen}
                    className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_60px_rgba(255,255,255,0.1)] border border-white/20",
                        isListening 
                          ? "bg-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.4)] animate-pulse border-rose-500" 
                          : "bg-white/10 hover:bg-white/20 hover:scale-105"
                    )}
                 >
                     {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                 </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
