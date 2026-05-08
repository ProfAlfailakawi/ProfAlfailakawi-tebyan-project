import React, { useState, useEffect } from 'react';
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

import { MessageCircleQuestion } from 'lucide-react';
import { TabHeader } from '../../TabHeader';

export const QawlFaslTab = ({ language, initialValue, onValueUsed, onSearch, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, onSearch?: (query: string) => void, handleTabChange: any }) => {
  const [currentView, setCurrentView] = useState<'home' | 'emergency' | 'question' | 'category'>('home');
  // ... (rest of the component)
  
  // Inside TabHeader:
  // <TabHeader ... onBack={() => handleTabChange('home', initialValue)} ... />
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QawlFaslQuestion[]>(fallbackMock);
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);

  useEffect(() => {
    // Trigger daily generation if needed
    qawlFaslService.triggerDailyGenerationIfNecessary().catch(err => {
      console.warn("Daily trigger skipped or failed (common if not admin or quota reached):", err);
    });
  }, []);

  useEffect(() => {
    if (initialValue && initialValue.trim().length > 2) {
      // Store in persistence
      localStorage.setItem('tebyan_last_query', initialValue);
      sessionStorage.setItem('tebyan_current_query', initialValue);
      sessionStorage.setItem('tebyan_current_has_searched', 'true');
      if (currentView !== 'home') {
        setCurrentView('home');
      }
    }
  }, [initialValue, currentView]);

  useEffect(() => {
    const saved = localStorage.getItem('lastViewedQawlFaslId');
    if (saved) setLastViewedId(saved);
  }, []);

  useEffect(() => {
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
    window.scrollTo(0, 0);
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
      className="w-full min-h-[80vh] overflow-hidden relative border border-transparent space-y-4 px-2"
      onClick={(e) => {
        if (e.target === e.currentTarget && currentView !== 'home') {
          goToHome();
        }
      }}
    >
      <TabHeader 
        icon={MessageCircleQuestion}
        title={{ ar: 'قول فصل', en: 'Qawl Fasl' }}
        description={{ 
            ar: 'منصة قرارات وتحليل وحلول للمواقف والصعوبات، مدعمة بالبحث والمراجع الذكية.', 
            en: 'A comprehensive educational library that answers your questions and shows you the right approach in dealing with children.' 
        }}
        language={language}
        onBack={currentView !== 'home' ? goToHome : () => handleTabChange('discover', '')}
        onClose={handleExit}
      />
      <div className="rounded-[24px] md:rounded-[32px] overflow-hidden">
        <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <HomeView 
              lastViewedId={lastViewedId} 
              questions={questions} 
              onEmergency={goToEmergency} 
              onQuestion={goToQuestion} 
              onCategory={goToCategory} 
              initialValue={initialValue}
              onValueUsed={onValueUsed}
            />
          </motion.div>
        )}
        
        {currentView === 'emergency' && (
          <motion.div key="emergency" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <EmergencyView questions={questions} onBack={goToHome} onQuestion={goToQuestion} />
          </motion.div>
        )}

        {currentView === 'question' && selectedQuestionId && (
          <motion.div key={`question-${selectedQuestionId}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
          <motion.div key="category" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
             <CategoryView questions={questions} categoryId={selectedCategoryId} onBack={goToHome} onQuestion={goToQuestion} />
          </motion.div>
        )}
        
      </AnimatePresence>
      </div>
    </div>
  );
};

