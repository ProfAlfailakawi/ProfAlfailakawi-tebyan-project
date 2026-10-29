import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HomeView from './HomeView';
import EmergencyView from './EmergencyView';
import QuestionDetailView from './QuestionDetailView';
import CategoryView from './CategoryView';
import { CATEGORIES, QawlFaslQuestion } from './types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { mockQuestions as fallbackMock } from './mockData';
import { qawlFaslService } from '../../../services/qawlFaslService';
import { IS_DEMO_MODE } from '../../../lib/demoMode';
import { loadDemoLibrary } from '../../../data/demoLibrary';
import { useAuth } from '../../AuthProvider';
import { isAdminIdentity } from '../../../lib/adminAccess';
import { isQawlQuestionId } from '../../../lib/qawlSearch';

import { MessageCircleQuestion } from 'lucide-react';
import { TabHeader } from '../../TabHeader';
import { getServiceNameBilingual } from '../../../constants/serviceRegistry';

export const QawlFaslTab = ({ language, initialValue, onValueUsed, onSearch, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, onSearch?: (query: string) => void, handleTabChange: any }) => {
  const [currentView, setCurrentView] = useState<'home' | 'emergency' | 'question' | 'category'>('home');
  // ... (rest of the component)
  
  // Inside TabHeader:
  // <TabHeader ... onBack={() => handleTabChange('home', initialValue)} ... />
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QawlFaslQuestion[]>(fallbackMock);
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);

  // The search text HomeView already ran. A boolean reset in a parent effect ran
  // after the child had consumed the value (child effects run first), so every
  // return to the library home re-ran the same search.
  const [consumedValue, setConsumedValue] = useState<string | undefined>(undefined);

  // Writing to the library is admin-only (firestore.rules: qawl_fasl_questions,
  // system_config). For anyone else the daily generator and the instant
  // "missing answer" generator spend Gemini calls whose result is then refused.
  const { user, profile } = useAuth();
  const canPublish = !IS_DEMO_MODE && (isAdminIdentity(user) || profile?.role === 'admin');

  // A deep link (/?tab=qawlfasl&q=q-5 from the static pages, or /qawl/<id>)
  // carries a question id, not search text: it opens that answer and must not
  // be searched as if the visitor had typed "q-5".
  const initialIsQuestionId = isQawlQuestionId(initialValue, questions.map(q => q.id));

  const dailyTriggered = useRef(false);
  useEffect(() => {
    // التوليد اليومي يكتب إلى Firestore، فلا مكان له في وضع العرض ولا لغير المدير.
    if (!canPublish || dailyTriggered.current) return;
    dailyTriggered.current = true;
    // Trigger daily generation if needed
    qawlFaslService.triggerDailyGenerationIfNecessary().catch(err => {
      console.warn("Daily trigger skipped or failed (common if not admin or quota reached):", err);
    });
  }, [canPublish]);

  useEffect(() => {
    if (initialValue && initialValue.trim().length > 2 && !initialIsQuestionId) {
      // Store in persistence
      localStorage.setItem('tebyan_last_query', initialValue);
      sessionStorage.setItem('tebyan_current_query', initialValue);
      sessionStorage.setItem('tebyan_current_has_searched', 'true');
      if (currentView !== 'home') {
        setCurrentView('home');
      }
    }
  }, [initialValue]);

  // Deep link from the static /qawl/q-* pages: /?tab=qawlfasl&q=<questionId>
  // opens that answer directly once the library has loaded.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const id = (initialValue || '').trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return;
    const match = questions.find(q => q.id === id);
    if (match) {
      deepLinkHandled.current = true;
      goToQuestion(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, questions]);

  useEffect(() => {
    const saved = localStorage.getItem('lastViewedQawlFaslId');
    if (saved) setLastViewedId(saved);
  }, []);

  useEffect(() => {
    /* في وضع العرض لا نشترك في Firestore إطلاقًا — لا لأن الكتابة محروسة فحسب،
       بل لأن الزائر يجب أن يرى مكتبة المنتج المنشورة كاملة (٤٧ سؤالًا موزّعة على
       الفئات التسع) لا ما تصادف وجوده في قاعدة بيانات نشرٍ بعينه. */
    if (IS_DEMO_MODE) {
      let cancelled = false;
      void loadDemoLibrary().then(library => {
        if (cancelled || library.length === 0) return;
        setQuestions(library);
      });
      return () => { cancelled = true; };
    }

    // Fetch only published real questions
    const q = query(collection(db, 'qawl_fasl_questions'), where('status', '==', 'published'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QawlFaslQuestion));
      
      // Combine mock data with DB data, preferring DB data if IDs match
      const combined = [...fallbackMock];
      data.forEach(dbQ => {
        const idx = combined.findIndex(m => m.id === dbQ.id);
        if (idx >= 0) {
          combined[idx] = dbQ;
        } else {
          combined.push(dbQ);
        }
      });
      
      const unique = Array.from(new Map(combined.map(q => [q.question, q])).values());
      setQuestions(unique);
    }, (error) => {
       console.error("Firestore List Error on qawl_fasl_questions:", error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTo({ top: 0, behavior: 'auto' });
      document.body.scrollTo({ top: 0, behavior: 'auto' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'auto' });
    }, 50);
  }, [currentView, selectedQuestionId, selectedCategoryId]);

  const goToHome = () => setCurrentView('home');
  
  const handleExit = () => {
    localStorage.removeItem('tebyan_last_query');
    localStorage.removeItem('tebyan_last_has_searched');
    sessionStorage.removeItem('tebyan_current_query');
    sessionStorage.removeItem('tebyan_current_has_searched');
    localStorage.removeItem('lastViewedQawlFaslId');
    setCurrentView('home');
    setSelectedQuestionId(null);
    setSelectedCategoryId(null);
    setLastViewedId(null);
    handleTabChange('discover', '', true);
  };

  const goToEmergency = () => {
    setCurrentView('emergency');
  };

  const goToQuestion = (question: QawlFaslQuestion) => {
    console.log("goToQuestion called with:", question.id);
    setSelectedQuestionId(question.id);
    setLastViewedId(question.id);

    // If the question is not in our local list yet, append it temporarily
    if (!questions.find(q => q.id === question.id)) {
      setQuestions(prev => [question, ...prev]);
    }

    localStorage.setItem('lastViewedQawlFaslId', question.id);
    setCurrentView('question');
    console.log("currentView set to 'question'");
  };

  const goToCategory = (id: string) => {
    setSelectedCategoryId(id);
    setCurrentView('category');
  };

  return (
    <div 
      className="w-full min-h-[80vh] relative z-10 border border-transparent space-y-4 px-2"
      onClick={(e) => {
        if (e.target === e.currentTarget && currentView !== 'home') {
          goToHome();
        }
      }}
    >
      <TabHeader 
        icon={MessageCircleQuestion}
        title={getServiceNameBilingual('qawlfasl')}
        description={{ 
            ar: 'مكتبة أجوبة تربوية واضحة لأسئلتك عن الأبناء، مع خطوات تبدأ بها اليوم.', 
            en: 'A comprehensive educational library that answers your questions and shows you the right approach in dealing with children.' 
        }}
        language={language}
        onBack={currentView !== 'home' ? goToHome : () => handleTabChange('discover', '')}
        onClose={handleExit}
      />
      <div className="rounded-[24px] md:rounded-[2rem]">
        <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div 
            key="home" 
            initial={{ opacity: 0, y: 35, filter: 'blur(10px)', scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} 
            exit={{ opacity: 0, y: -35, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, mass: 0.9 }}
          >
            <HomeView 
              lastViewedId={lastViewedId} 
              questions={questions} 
              onEmergency={goToEmergency} 
              onQuestion={goToQuestion} 
              onCategory={goToCategory} 
              initialValue={initialValue && !initialIsQuestionId && initialValue !== consumedValue ? initialValue : undefined}
              onValueUsed={() => setConsumedValue(initialValue)}
              canPublish={canPublish}
              onAskTebyan={(q: string) => handleTabChange('home', q)}
            />
          </motion.div>
        )}
        
        {currentView === 'emergency' && (
          <motion.div 
            key="emergency" 
            initial={{ opacity: 0, y: 35, filter: 'blur(10px)', scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} 
            exit={{ opacity: 0, y: -35, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, mass: 0.9 }}
          >
            <EmergencyView questions={questions} onBack={goToHome} onQuestion={goToQuestion} />
          </motion.div>
        )}

        {currentView === 'question' && selectedQuestionId && (
          <motion.div 
            key={`question-${selectedQuestionId}`} 
            initial={{ opacity: 0, x: 50, filter: 'blur(8px)' }} 
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
            exit={{ opacity: 0, x: -50, filter: 'blur(8px)' }}
            transition={{ type: "spring", stiffness: 100, damping: 14, mass: 0.9 }}
          >
            <QuestionDetailView 
              questionId={selectedQuestionId} 
              questions={questions} 
              onQuestion={goToQuestion}
              onBack={() => {
                if (selectedCategoryId) setCurrentView('category');
                else setCurrentView('home');
              }} 
              language={language}
            />
          </motion.div>
        )}

        {currentView === 'category' && selectedCategoryId && (
          <motion.div 
            key="category" 
            initial={{ opacity: 0, y: 35, filter: 'blur(10px)', scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} 
            exit={{ opacity: 0, y: -35, filter: 'blur(10px)', scale: 0.98 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, mass: 0.9 }}
          >
             <CategoryView questions={questions} categoryId={selectedCategoryId} onBack={goToHome} onQuestion={goToQuestion} />
          </motion.div>
        )}
        
      </AnimatePresence>
      </div>
    </div>
  );
};

