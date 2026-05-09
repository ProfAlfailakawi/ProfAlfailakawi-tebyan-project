import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Network, Globe, Plus, Share2, Search, ArrowRight, UserCircle, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateARSimulation } from '../../services/gemini'; // Dummy just for import if needed

interface RippleNode {
    id: string;
    text: string;
    author: string;
    type: 'seed' | 'branch' | 'implementation';
    children: RippleNode[];
    likes: number;
    timestamp: string;
}

const DUMMY_RIPPLES: RippleNode[] = [
    {
        id: '1',
        text: 'مقهى يجمع بين العمل ومكتبة صوتية هادئة',
        author: 'أنت',
        type: 'seed',
        likes: 142,
        timestamp: 'قبل يومين',
        children: [
            {
                id: '1-1',
                text: 'إضافة غرف عزل صوتي للاجتماعات الصغيرة',
                author: 'أحمد سعيد',
                type: 'branch',
                likes: 56,
                timestamp: 'قبل يوم',
                children: [
                    {
                        id: '1-1-1',
                        text: 'تطبيق لحجز الغرف بالساعة',
                        author: 'فريق CodeLabs',
                        type: 'implementation',
                        likes: 89,
                        timestamp: 'منذ 5 ساعات',
                        children: []
                    }
                ]
            },
            {
                id: '1-2',
                text: 'توفير اشتراكات شهرية للقهوة مع مساحة العمل',
                author: 'سارة خالد',
                type: 'branch',
                likes: 34,
                timestamp: 'قبل 12 ساعة',
                children: []
            }
        ]
    },
    {
        id: '2',
        text: 'تطبيق يساعد في تنظيف البيئة بمقابل نقاط مكافآت',
        author: 'مستخدم_١٩٨',
        type: 'seed',
        likes: 412,
        timestamp: 'قبل أسبوع',
        children: [
            {
                id: '2-1',
                text: 'التعاون مع السوبرماركت لاستبدال النقاط بمقاضي',
                author: 'نور الدين',
                type: 'branch',
                likes: 120,
                timestamp: 'قبل 4 أيام',
                children: []
            }
        ]
    }
];

export const RippleEffectTab = ({ language }: { language: 'ar' | 'en' }) => {
    const [ripples, setRipples] = useState<RippleNode[]>(DUMMY_RIPPLES);
    const [newIdea, setNewIdea] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDropIdea = () => {
        if (!newIdea.trim()) return;
        setIsSubmitting(true);
        setTimeout(() => {
            const newRipple: RippleNode = {
                id: Date.now().toString(),
                text: newIdea,
                author: language === 'ar' ? 'أنت' : 'You',
                type: 'seed',
                likes: 0,
                timestamp: language === 'ar' ? 'الآن' : 'Just now',
                children: []
            };
            setRipples([newRipple, ...ripples]);
            setNewIdea('');
            setIsSubmitting(false);
        }, 1500);
    };

    const RippleNodeComponent = ({ node, level = 0 }: { node: RippleNode; level?: number }) => {
        return (
            <div className="relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className={cn(
                    "relative z-10 flex gap-4 md:gap-6 group",
                    level === 0 ? "mb-8" : "mb-6 mt-4"
                )}>
                    {level > 0 && (
                        <div className={cn(
                            "absolute top-6 bottom-[-30px] w-0.5 bg-zinc-200",
                            language === 'ar' ? "right-6" : "left-6"
                        )} />
                    )}
                    
                    {/* Node Icon */}
                    <div className={cn(
                        "w-12 h-12 rounded-full shrink-0 flex items-center justify-center shadow-lg border-2 z-10 transition-transform group-hover:scale-110",
                        node.type === 'seed' ? "bg-indigo-600 border-indigo-200 text-white" :
                        node.type === 'branch' ? "bg-emerald-500 border-emerald-200 text-white" :
                        "bg-amber-500 border-amber-200 text-white",
                        level > 0 && (language === 'ar' ? "mr-12" : "ml-12") // Indent
                    )}>
                        {node.type === 'seed' ? <Globe className="w-5 h-5" /> : 
                         node.type === 'branch' ? <Network className="w-5 h-5" /> :
                         <Activity className="w-5 h-5" />}
                    </div>

                    {/* Content Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "flex-1 bg-white p-5 rounded-[24px] border border-zinc-100 shadow-sm transition-all hover:shadow-md",
                            node.type === 'seed' ? "ring-1 ring-indigo-50" : ""
                        )}
                    >
                         <div className="flex items-center justify-between gap-4 mb-3">
                             <div className="flex items-center gap-2">
                                 <UserCircle className="w-5 h-5 text-zinc-400" />
                                 <span className="font-bold text-sm text-zinc-700">{node.author}</span>
                                 <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-500 font-bold uppercase tracking-widest">
                                     {node.type === 'seed' ? (language === 'ar' ? 'البذرة الأولى' : 'Origin Seed') : 
                                      node.type === 'branch' ? (language === 'ar' ? 'تطوير' : 'Evolution') : 
                                      (language === 'ar' ? 'تطبيق عملي' : 'Implementation')}
                                 </span>
                             </div>
                             <span className="text-xs text-zinc-400 font-medium">{node.timestamp}</span>
                         </div>
                         <p className="text-base text-zinc-800 leading-relaxed font-medium mb-4">{node.text}</p>
                         
                         <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                             <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                                 <div className="flex items-center gap-1 hover:text-rose-500 cursor-pointer transition-colors">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                     {node.likes}
                                 </div>
                                 <div className="flex items-center gap-1 hover:text-indigo-500 cursor-pointer transition-colors">
                                     <Share2 className="w-4 h-4" />
                                     {language === 'ar' ? 'بناء على هذه الفكرة' : 'Branch out'}
                                 </div>
                             </div>
                         </div>
                    </motion.div>
                </div>
                
                {/* Children */}
                {node.children && node.children.length > 0 && (
                    <div className="relative">
                        {node.children.map((child) => (
                            <RippleNodeComponent key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-sm border border-emerald-100">
                    <Network className="w-4 h-4" />
                    <span>{language === 'ar' ? 'الشبكة الاجتماعية للأفكار' : 'Social Network of Ideas'}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-black">
                    {language === 'ar' ? 'التأثير المتسلسل' : 'The Ripple Effect'}
                </h2>
                <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    {language === 'ar' 
                      ? 'ارمي فكرتك كحجر في الماء، وشاهد كيف تلتقطها العقول، تتفرع، وتتحول إلى واقع. شبكة تواصل للأفكار، لا للأشخاص.' 
                      : 'Drop your idea like a stone in water, and watch how minds pick it up, branch it out, and turn it into reality.'}
                </p>
            </div>

            {/* Input Box */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-zinc-200 relative overflow-hidden"
               dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4">
                    <label className="text-sm font-black text-zinc-400 tracking-widest uppercase">
                        {language === 'ar' ? 'ازرع بذرة فكرة مفتوحة المصدر' : 'PLANT AN OPEN SOURCE SEED'}
                    </label>
                    <textarea 
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        placeholder={language === 'ar' ? "فكرتي هي..." : "My idea is..."}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-lg font-medium text-black focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-32 placeholder:text-zinc-300"
                    />
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handleDropIdea}
                            disabled={!newIdea.trim() || isSubmitting}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span>{language === 'ar' ? 'انشر الفكرة' : 'Drop Idea'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Ripples Tree */}
            <div className="mt-16 space-y-8 relative">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="font-black text-xl text-black">
                        {language === 'ar' ? 'الأفكار النشطة' : 'Active Ripples'}
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-100 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10">
                    <AnimatePresence>
                        {ripples.map((node) => (
                            <RippleNodeComponent key={node.id} node={node} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
