import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { TabHeader } from '../TabHeader';

export const QuizTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [quizTopic, setQuizTopic] = React.useState(initialValue || '');

  React.useEffect(() => {
    if (initialValue && onValueUsed) {
        setQuizTopic(initialValue);
        onValueUsed();
    }
  }, [initialValue, onValueUsed]);
  
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startQuiz = async () => {
    if (!quizTopic.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedAnswers({});
    setIsFinished(false);
    setScore(0);
    try {
      const { generateQuiz } = await import('../../services/gemini');
      const q = await generateQuiz(quizTopic);
      setQuestions(q);
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (showFeedback || isFinished) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    setShowFeedback(true);
    
    if (option === questions[currentQuestionIndex].answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      window.dispatchEvent(new CustomEvent('add_xp', { detail: { amount: 100 } }));
    }
  };

  const reset = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setIsFinished(false);
    setScore(0);
  };

   return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
     <TabHeader 
       icon={ClipboardCheck}
       title={{ ar: 'الاختبارات الذكية', en: 'Smart Quizzes' }}
       description={{ 
           ar: 'أدخل الموضوع الذي تريد اختبار معلوماتك فيه، وسأقوم بإنشاء أسئلة متنوعة لتقييم فهمك.', 
           en: 'Enter a topic, and I will generate diversas questions to assess your understanding.' 
       }}
       language={language}
       onBack={() => handleTabChange('discover', '')}
       onClose={() => handleTabChange('discover', '', true)}
     />
     <div 
        className="bg-white rounded-[32px] p-8 border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6 relative overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (isFinished) reset();
            else if (questions.length) reset();
          }
        }}
      >
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-6 py-20"
          >
            <div className="relative">
              <div className="w-20 h-20 border-8 border-zinc-100 rounded-full"></div>
              <RefreshCw className="w-20 h-20 text-emerald-600 animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black text-center">
              {language === 'ar' ? 'جاري تأسيس الاختبار...' : 'Generating quiz...'}
            </div>
            <div className="px-8 py-3 bg-emerald-50 text-emerald-700 rounded-full font-bold animate-pulse">
              {language === 'ar' ? 'نحن نعد لك أسئلة مخصصة لتقييم فهمك' : 'We are preparing custom questions to assess your understanding'}
            </div>
          </motion.div>
        ) : (
          <>
            {!questions.length ? (
              <div className="space-y-4">
                <p className="text-zinc-500 font-bold">{language === 'ar' ? 'أدخل الموضوع الذي جئت من أجله لإنشاء الاختبار المخصص لك:' : 'Enter the topic you came for to create your custom quiz:'}</p>
                <input 
                  value={quizTopic} 
                  onChange={(e) => setQuizTopic(e.target.value)} 
                  className="w-full p-4 md:p-6 text-base md:text-xl font-bold border-2 rounded-[16px] outline-none focus:border-emerald-500" 
                  placeholder={language === 'ar' ? "مثال: مهارات القرن الحادي والعشرين..." : "Example: 21st Century Skills..."} 
                />
                <button 
                  onClick={startQuiz} 
                  disabled={isLoading}
                  title={language === 'ar' ? 'بدء إنشاء الاختبار الذكي' : 'Start smart quiz generation'}
                  className={cn(
                    "w-full py-5 rounded-[16px] font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-3",
                    isLoading ? "bg-zinc-400 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-900 cursor-pointer"
                  )}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>{language === 'ar' ? 'جاري التأسيس...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <span>{language === 'ar' ? 'ابدأ تأسيس الاختبار الآن' : 'Start Quiz Generation'}</span>
                  )}
                </button>
                {error && <div className="text-rose-500 font-bold">{error}</div>}
              </div>
            ) : isFinished ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-20 space-y-8"
              >
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-3xl md:text-5xl">
                   {score === questions.length ? '👑' : '🎉'}
                </div>
                <div className="space-y-2">
                   <h3 className="text-3xl md:text-4xl font-bold text-black">{language === 'ar' ? 'اكتمل الاختبار!' : 'Quiz Completed!'}</h3>
                   <p className="text-xl font-bold text-zinc-500">
                     {language === 'ar' ? `نتيجتك النهائية: ${score} من ${questions.length}` : `Your final score: ${score} out of ${questions.length}`}
                   </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                   <button 
                     onClick={reset}
                     className="px-8 py-4 bg-black text-white rounded-[16px] font-bold shadow-lg hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      {language === 'ar' ? 'اختبار جديد' : 'New Quiz'}
                    </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-[16px]">
                  <div className="space-x-4">
                    <span className="font-bold text-emerald-700">{language === 'ar' ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}` : `Question ${currentQuestionIndex + 1} of ${questions.length}`}</span>
                    <span className="text-zinc-400 font-bold ml-4">|</span>
                    <span className="text-zinc-500 font-bold ml-4">{language === 'ar' ? `النتيجة: ${score}` : `Score: ${score}`}</span>
                  </div>
                  <button 
                    onClick={reset} 
                    title={language === 'ar' ? 'إغلاق الاختبار والعودة' : 'Close quiz and return'}
                    className="text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    {language === 'ar' ? 'خروج' : 'Exit'}
                  </button>
                </div>
                
                <div className="p-8 border-2 border-zinc-200/80 rounded-[24px] md:rounded-[32px] space-y-6">
                  <h3 className="text-2xl font-bold text-zinc-800 leading-tight">{questions[currentQuestionIndex].question}</h3>
                  
                  <div className="grid gap-3">
                    {questions[currentQuestionIndex].options?.map((opt: string, i: number) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                      const isCorrect = opt === questions[currentQuestionIndex].answer;
                      
                      return (
                        <button 
                          key={i} 
                          onClick={() => handleSelect(opt)}
                          disabled={showFeedback}
                          title={language === 'ar' ? 'اختيار هذه الإجابة' : 'Select this answer'}
                          className={cn(
                            "p-5 text-right rounded-[16px] border-2 font-bold transition-all flex justify-between items-center",
                            !showFeedback && "bg-white border-zinc-100 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer",
                            showFeedback && isCorrect && "bg-emerald-50 border-emerald-500 text-emerald-700",
                            showFeedback && isSelected && !isCorrect && "bg-red-50 border-red-500 text-red-700",
                            showFeedback && !isSelected && !isCorrect && "opacity-50 border-zinc-100 bg-zinc-50 cursor-default"
                          )}
                        >
                          <span>{opt}</span>
                          {showFeedback && isCorrect && <span className="ml-2">✅</span>}
                          {showFeedback && isSelected && !isCorrect && <span className="ml-2">❌</span>}
                        </button>
                      );
                    })}
                  </div>

                  {showFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={cn(
                        "p-6 rounded-[16px] font-bold",
                        selectedAnswers[currentQuestionIndex] === questions[currentQuestionIndex].answer 
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                      )}
                    >
                      {selectedAnswers[currentQuestionIndex] === questions[currentQuestionIndex].answer 
                        ? (language === 'ar' ? 'إجابة رائعة! استمر هكذا.' : 'Great job! Keep going.')
                        : (language === 'ar' ? `للأسف إجابة خاطئة. الإجابة الصحيحة هي: ${questions[currentQuestionIndex].answer}` : `Wrong answer. The correct one is: ${questions[currentQuestionIndex].answer}`)
                      }
                    </motion.div>
                  )}
                </div>
     
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleNext}
                    disabled={!showFeedback}
                    title={language === 'ar' ? 'الانتقال للسؤال القادم' : 'Move to next question'}
                    className={cn(
                      "flex-1 py-5 rounded-[16px] font-bold text-xl transition-all shadow-lg",
                      showFeedback 
                        ? "bg-black text-white cursor-pointer hover:bg-zinc-900" 
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    {currentQuestionIndex === questions.length - 1 ? (language === 'ar' ? 'عرض النتيجة النهائية' : 'Show Final Results') : (language === 'ar' ? 'السؤال التالي' : 'Next Question')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
   </motion.div>
 )});
