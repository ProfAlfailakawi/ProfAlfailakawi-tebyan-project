import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader2, Sparkles, X, Volume2, Activity } from 'lucide-react';
import { universalOracle } from '../services/gemini';
import { generateAudioForText } from '../services/qawlFaslAiService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initRecognition = () => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      // You can set standard Arabic to help recognition, even if we speak back in dialect
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
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
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
        if (audioRef.current) {
           audioRef.current.pause();
        }
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
      // Warm, affectionate, non-artificial persona in white dialect
      const prompt = language === 'ar' 
        ? `أنتِ صديقة أو مستشارة ذكية وحنونة جداً. أجيبي بكلمات قليلة ومباشرة بلهجة عامية بيضاء سهلة ولطيفة (نبرة دافئة وقريبة للقلب). المستخدم قال: "${finalTranscript}"`
        : `You are a very warm, smart, and affectionate friend. Answer very briefly and directly in a comforting voice. The user said: "${finalTranscript}"`;

      const gptResult = await universalOracle(prompt, 'Voice Assistant', language);
      setResponse(gptResult);
      
      const cleanText = gptResult.replace(/[*#_`~]/g, '');
      const audioUrl = await generateAudioForText(cleanText);
      
      if (audioUrl) {
         if (audioRef.current) {
             audioRef.current.pause();
         }
         audioRef.current = new Audio(audioUrl);
         audioRef.current.onplay = () => setIsSpeaking(true);
         audioRef.current.onended = () => setIsSpeaking(false);
         await audioRef.current.play();
      } else {
          // Fallback to browser TTS if generation fails
          const synth = window.speechSynthesis;
          synth.cancel();
          const utter = new SpeechSynthesisUtterance(cleanText);
          utter.lang = language === 'ar' ? 'ar-SA' : 'en-US';
          utter.onstart = () => setIsSpeaking(true);
          utter.onend = () => setIsSpeaking(false);
          synth.speak(utter);
      }
      
    } catch (e) {
      console.error(e);
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
      if (audioRef.current) {
          audioRef.current.pause();
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
                 <div className={cn("w-[500px] h-[500px] rounded-full blur-[100px] transition-all duration-1000", 
                    isSpeaking ? "bg-emerald-500/30 scale-110 animate-pulse" : "bg-indigo-500/20"
                 )}></div>
             </div>

             <div className="z-10 text-center mt-4 mb-6">
                 <h3 className="text-2xl font-bold text-white/80">
                     {language === 'ar' ? 'المساعد الحنون' : 'Warm Assistant'}
                 </h3>
                 <p className="text-zinc-500 text-sm mt-1">
                     {language === 'ar' ? 'تحدث معي كصديق يسمعك بصدق' : 'Speak to me like a friend'}
                 </p>
             </div>

             <div className="z-10 flex-1 flex flex-col items-center justify-center min-h-[150px] w-full max-w-lg relative">
                 <AnimatePresence mode="popLayout">
                    {isProcessing && (
                         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                            <p className="text-emerald-400/80 animate-pulse font-medium text-sm">{language === 'ar' ? 'أفكر في أفضل رد يريحك...' : 'Thinking of the best response...'}</p>
                         </motion.div>
                    )}
                    {response && !isProcessing && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center w-full px-4">
                            <div className="p-4 max-h-[50vh] overflow-y-auto w-full no-scrollbar markdown-body font-medium text-base md:text-lg leading-relaxed text-zinc-100 text-center [&_p]:text-zinc-100 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-emerald-400">
                                <ReactMarkdown>{response}</ReactMarkdown>
                            </div>
                        </motion.div>
                    )}
                    {!isProcessing && !response && (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center w-full px-4">
                            {errorStatus ? (
                                <p className="text-rose-400 font-medium text-sm mb-4">{errorStatus}</p>
                            ) : isListening ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center gap-1">
                                        {[1,2,3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: [1, 1.5, 1] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-2 h-2 rounded-full bg-emerald-400"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-emerald-400 font-bold animate-pulse text-sm tracking-widest uppercase">{language === 'ar' ? 'أنا أسمعك...' : 'LISTENING...'}</p>
                                    {transcript && (
                                        <p className="text-white/60 font-medium text-lg px-2 mt-4">{transcript}</p>
                                    )}
                                </div>
                            ) : transcript ? (
                                <p className="text-xl font-bold text-white/50 pb-2 mb-2">{transcript}</p>
                            ) : (
                                <p className="text-zinc-500 italic text-lg">{language === 'ar' ? 'تحدث بحرية...' : 'Speak freely...'}</p>
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

