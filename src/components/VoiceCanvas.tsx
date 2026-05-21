import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Loader2, StopCircle } from 'lucide-react';
import { universalOracle } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { useAcoustics } from '../hooks/useAcoustics';

export const VoiceCanvas = ({ isOpen, onClose, language }: { isOpen: boolean, onClose: () => void, language: string }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const { playSound } = useAcoustics();

  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('close_overlays', handleClose);
    return () => window.removeEventListener('close_overlays', handleClose);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setResult(null);
      startListening();
    } else {
      stopListening();
    }
    
    return () => {
        stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setResult(language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت. الرجاء المتابعة كتابياً.' : 'Speech recognition not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        playSound('chime');
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
            setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Only trigger process if we explicitly stopped it or it auto-stopped with content
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const processQuery = async () => {
    stopListening();
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await universalOracle(
        `أنت الآن "العقل المدبر" (Mastermind). أجب بأسلوب شاعري، حكيم جداً، ومختصر جداً، على هذا التفكير الصوتي: "${transcript}". استخدم الفواصل والكلمات العميقة في سطرين كحد أقصى.`,
        'Oracle Voice',
        language
      );
      setResult(res);
      playSound('chime');
    } catch (error) {
      console.error(error);
      setResult(language === 'ar' ? 'حدث خطأ في الاتصال الكوني.' : 'Connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // If transcript hasn't changed for 2.5 seconds while listening, process it automatically
    let timeout: NodeJS.Timeout;
    if (isListening && transcript.trim().length > 0) {
       timeout = setTimeout(() => {
         processQuery();
       }, 2500);
    }
    return () => clearTimeout(timeout);
  }, [transcript, isListening]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ y: '100%', opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: '100%', opacity: 0 }}
           transition={{ type: 'spring', damping: 25, stiffness: 200 }}
           className="fixed inset-0 z-[300] bg-black text-white p-6 md:p-12 overflow-y-auto flex flex-col items-center justify-center font-sans tracking-wide"
           dir={language === 'ar' ? 'rtl' : 'ltr'}
           onClick={(e) => {
             if (e.target === e.currentTarget) onClose();
           }}
        >
           <button 
             onClick={onClose}
             className="absolute top-6 left-6 md:top-12 md:left-12 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
           >
             <X className="w-6 h-6" />
           </button>

           <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center space-y-16 relative">
              
              {!result && !isProcessing && (
                 <motion.div
                  animate={isListening ? { scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3], rotate: [0, 180, 360] } : {}}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-white/10 flex items-center justify-center cursor-pointer bg-gradient-to-tr from-indigo-500/10 to-rose-500/10 shadow-[0_0_60px_rgba(255,255,255,0.05)] hover:bg-white/5 transition-all"
                  onClick={isListening ? processQuery : startListening}
                 >
                    {isListening ? (
                       <StopCircle className="w-12 h-12 text-white/80" />
                    ) : (
                       <Mic className="w-12 h-12 text-white/50" />
                    )}
                 </motion.div>
              )}

              {isProcessing && (
                  <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center relative">
                     <div className="absolute inset-0 border-t-2 border-l-2 border-white/30 rounded-full animate-spin"></div>
                     <div className="absolute inset-2 border-b-2 border-r-2 border-rose-500/30 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                     <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
              )}

              <div className="min-h-[120px] w-full text-3xl md:text-5xl lg:text-7xl font-black text-white leading-tight break-words">
                 {isProcessing ? (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-white/40 tracking-widest block"
                    >
                      ...
                    </motion.span>
                 ) : transcript ? (
                    <span>{transcript}</span>
                 ) : !result && (
                    <motion.div 
                      animate={{ opacity: [0.3, 0.8, 0.3] }} 
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="text-white/30 font-light"
                    >
                      {language === 'ar' ? 'استمع إليك...' : 'Listening...'}
                    </motion.div>
                 )}
              </div>

              {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-2xl md:text-4xl text-white/90 font-medium leading-relaxed max-w-3xl text-center markdown-body text-shadow-glow"
                  >
                     <ReactMarkdown>{result}</ReactMarkdown>
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-16"
                     >
                       <button 
                         onClick={() => { setResult(null); setTranscript(''); startListening(); }}
                         className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold tracking-widest uppercase transition-colors"
                       >
                         {language === 'ar' ? 'تحدث مجدداً' : 'Speak again'}
                       </button>
                     </motion.div>
                  </motion.div>
              )}

           </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
