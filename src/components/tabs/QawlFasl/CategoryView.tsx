import React from 'react';
import { ArrowRight, ShieldAlert, CheckCircle2, List } from 'lucide-react';
import { ExpandableText } from '../../ui/ExpandableText';
import { QawlFaslQuestion, CATEGORIES } from './types';

interface Props {
  questions: QawlFaslQuestion[];
  categoryId: string; // This maps to categorySlug
  onBack: () => void;
  onQuestion: (question: any) => void;
}

export default function CategoryView({ questions, categoryId, onBack, onQuestion }: Props) {
  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES.find(c => c.title === categoryId);
  const displayTitle = category?.title || categoryId;
  const displayDesc = category?.description || '';

  const finalQuestions = questions.filter(q => 
    q.categoryId === categoryId || 
    q.categorySlug === categoryId || 
    q.category === categoryId || 
    q.mainCategory === categoryId ||
    (category && (q.category === category.title || q.mainCategory === category.title))
  );

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl min-h-[80vh] pb-24 font-sans">
      <div className="bg-white border-b border-[#EBEAE4] sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row items-center md:justify-between gap-4">
          <button 
            onClick={onBack}
            className="self-start md:self-auto flex items-center gap-2 text-[#6B6A65] hover:text-[#2A2925] bg-[#F6F5F0] hover:bg-[#EBEAE4] px-4 py-2 rounded-full font-bold transition-colors"
          >
            <ArrowRight className="w-5 h-5" /> رجوع
          </button>
          <div className="text-center w-full md:flex-1">
             <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tighter">{displayTitle}</h2>
             {displayDesc && <p className="text-zinc-600 font-bold text-sm mt-3">{displayDesc}</p>}
          </div>
          <div className="hidden md:block w-24 opacity-0 pointer-events-none" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-16 w-full flex-1">
        {finalQuestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 lg:gap-10">
            {finalQuestions.map(q => (
              <div key={q.id} className="bg-white flex flex-col justify-between border border-zinc-100 rounded-[28px] p-6 lg:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all group cursor-pointer h-full luxury-ceramic-sheen" onClick={() => onQuestion(q)}>
                <div className="space-y-4 md:space-y-6 w-full mb-6">
                   <ExpandableText text={q.question || q.title || ''} className="text-lg md:text-xl font-black text-zinc-950 leading-snug lg:leading-tight group-hover:text-[#5A5A40] transition-colors" lineClamp={3} />
                   <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold flex-wrap uppercase tracking-widest">
                     {q.riskLevel === 'high' && (
                       <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full"><ShieldAlert className="w-3.5 h-3.5" /> حساسية</span>
                     )}
                     <span className="bg-[#F0F4FA] text-[#4A6B8C] px-3 py-1.5 rounded-full">العمر: {q.ageGroups.join('، ')}</span>
                   </div>
                </div>
                
                <div className="flex items-center w-full mt-auto mt-4 md:mt-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onQuestion(q); }}
                    className="bg-[#F6F5F0] text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white px-5 py-3 md:px-6 md:py-4 rounded-[20px] font-bold flex items-center justify-between transition-all w-full shadow-sm text-sm cursor-pointer"
                  >
                     <span>عرض الإجابة</span>
                     <ArrowRight className="w-5 h-5 -scale-x-100" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[#6B6A65] font-bold bg-white rounded-[24px] md:rounded-[32px] border border-dashed border-[#EBEAE4]">
             <List className="w-16 h-16 text-[#D5D4CD] mx-auto mb-4" />
             <p className="text-xl">لا توجد حالات مسجلة في هذا القسم حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
