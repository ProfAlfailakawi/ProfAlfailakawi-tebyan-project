import React from 'react';
import { Bookmark, Link2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KnowledgeSignatureProps {
  language: 'ar' | 'en' | string;
  query?: string;
  kind?: string;
  compact?: boolean;
  onSave?: () => void;
  onLink?: () => void;
  className?: string;
}

export const KnowledgeSignature: React.FC<KnowledgeSignatureProps> = ({
  language,
  query = '',
  kind,
  compact = false,
  onSave,
  onLink,
  className,
}) => {
  const [saved, setSaved] = React.useState(false);
  const isAr = language === 'ar';

  const handleSave = () => {
    try {
      const item = {
        id: `quick-${Date.now()}`,
        type: kind || 'insight',
        title: query || (isAr ? 'مسار معرفي من تبيان' : 'Tebyan knowledge path'),
        content: query,
        createdAt: new Date().toISOString(),
      };
      const savedItems = JSON.parse(localStorage.getItem('tebyan_quick_saves') || '[]');
      localStorage.setItem('tebyan_quick_saves', JSON.stringify([item, ...savedItems].slice(0, 40)));
      setSaved(true);
      onSave?.();
    } catch (e) {
      onSave?.();
    }
  };

  return (
    <div
      className={cn(
        'mt-4 rounded-[20px] border border-[#8FA9C7]/12 bg-white/82 px-4 py-3 shadow-[0_12px_32px_rgba(24,34,49,0.04)]',
        'flex flex-col md:flex-row md:items-center justify-between gap-3 text-right',
        compact && 'px-3 py-2 rounded-2xl',
        className
      )}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-2xl bg-[#F4F1F8] text-[#8E7AAE] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-widest uppercase text-[#8E7AAE]">
            {isAr ? 'احفظ المسار' : 'Save this path'}
          </p>
          <p className="text-xs md:text-sm font-bold text-[#6F7785] leading-relaxed">
            {isAr ? 'زر واحد للحفظ. وإذا احتجت تربطه بنسيج أفكارك، الخيار موجود بهدوء.' : 'One save button. Link it to your idea fabric only when you need.'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            'px-5 py-2.5 rounded-full text-xs font-black border transition-all active:scale-95 flex items-center gap-2 shadow-sm',
            saved ? 'bg-[#EAF6F1] border-[#CDEBDE] text-[#3F7E66]' : 'bg-[#182231] border-[#182231] text-white hover:bg-black'
          )}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {saved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? 'احفظ' : 'Save')}
        </button>
        {onLink && (
          <button
            type="button"
            onClick={onLink}
            className="px-4 py-2.5 rounded-full bg-[#F4F1F8] border border-[#E6E1EA] text-[#8E7AAE] text-xs font-black transition-all active:scale-95 flex items-center gap-2 hover:bg-[#EEE8F7]"
          >
            <Link2 className="w-4 h-4" />
            {isAr ? 'اربطها' : 'Link it'}
          </button>
        )}
      </div>
    </div>
  );
};
