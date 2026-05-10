import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Network, Globe, Plus, Share2, Search, ArrowRight, ArrowLeft, UserCircle, Activity, Trash2, X, ChevronDown, ChevronUp, Brain, Lock, Ghost, Award, HelpCircle, Languages, Eye, Zap, GitBranch, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, increment, query, orderBy, getDoc, setDoc, writeBatch, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';
import { refineIdea, translateWithContext } from '../../services/geminiService';
import { seedData } from '../../data/seedData';
import { NebulaTab } from './NebulaTab';
import { InsightsPanel } from './InsightsPanel';

const ripplesCollection = collection(db, 'ripples');

type RippleNode = {
    id: string;
    text: string;
    author: string;
    authorId?: string;
    rootId?: string;
    type: 'seed' | 'branch' | 'implementation';
    children: RippleNode[];
    likes: number;
    timestamp: string;
};

type RippleNodeComponentProps = {
    node: RippleNode;
    level?: number;
    language: 'ar' | 'en';
    ripplesFlat: any[];
    auth: any;
    handleLike: (node: RippleNode) => void;
    handleDelete: (id: string) => void;
    handleAddReply: (parentId: string, text: string) => void;
    setToast: (toast: any) => void;
    userRanks: Record<string, { rank: string, aura: string, color: string }>;
    onFocusMode?: (idea: { text: string, author: string }) => void;
};

const RippleNodeComponent = React.memo(({ node, level = 0, language, ripplesFlat, auth, handleLike, handleDelete, handleAddReply, setToast, userRanks, onFocusMode }: RippleNodeComponentProps) => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);

    // Calculate Impact (Descendants count)
    const descendantsCount = useMemo(() => {
        const countDescendants = (n: RippleNode): number => {
            return (n.children?.length || 0) + (n.children?.reduce((acc, child) => acc + countDescendants(child), 0) || 0);
        };
        return countDescendants(node);
    }, [node]);

    // For visibility: user is owner, or admin, or owner of the root node
    const rootOwnerId = node.rootId ? ripplesFlat.find(r => r.id === node.rootId)?.authorId : null;
    const isUserIdea = node.authorId === auth.currentUser?.uid || 
                        (rootOwnerId === auth.currentUser?.uid && !!rootOwnerId) ||
                        (node.author === (language === 'ar' ? 'أنت' : 'You') && !node.authorId) ||
                        auth.currentUser?.email?.toLowerCase().includes('alfailakawidrahmad') || 
                        auth.currentUser?.email?.toLowerCase().includes('dr.ahmad');
    
    // Time Capsule Logic
    const isLocked = (node as any).isTimeCapsule && (
        (new Date((node as any).unlockDate) > new Date()) && 
        ((node as any).unlockBranchCount > (node.children?.length || 0))
    ) && !isUserIdea;

    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [expanded, setExpanded] = useState(false);
    const isSelectedRipple = new URLSearchParams(window.location.search).get('ripple') === node.id;

    const userRank = node.authorId ? userRanks[node.authorId] : null;

    const isLongText = node.text.length > 200;
    const rawText = isLocked ? (language === 'ar' ? 'هذه الفكرة مشفرة في كبسولة زمنية.. ستظهر عندما يحين الوقت أو يكتمل نضجها بكثرة المطورين.' : 'This idea is encrypted in a time capsule.. it will appear when the time comes or it matures with more branchers.') : node.text;
    const displayText = !isLongText || expanded ? rawText : rawText.slice(0, 200) + '...';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="relative" 
            id={`ripple-${node.id}`} 
            dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className={cn(
                "relative z-10 flex gap-4 md:gap-6 group",
                level === 0 ? "mb-8 md:mb-10" : "mb-6 md:mb-8 mt-4"
            )}>
                {level > 0 && (
                    <div className={cn(
                        "absolute top-5 md:top-6 w-6 md:w-8 h-8 rounded-bl-3xl border-b-2 border-l-2 border-zinc-200 z-0 opacity-50",
                        language === 'ar' ? "right-[-28px] md:right-[-38px] border-l-0 border-r-2 rounded-bl-none rounded-br-3xl" : "left-[-28px] md:left-[-38px]"
                    )} style={{ transform: 'translateY(-100%)' }} />
                )}

                {/* Node Icon */}
                <div className={cn(
                    "relative w-12 h-12 md:w-14 md:h-14 rounded-full shrink-0 flex items-center justify-center shadow-lg border-4 z-10 transition-transform group-hover:scale-105",
                    node.type === 'seed' ? "bg-mood-primary/10 border-mood-primary/20 text-mood-primary shadow-mood-glow" :
                    node.type === 'branch' ? "bg-mood-secondary/10 border-mood-secondary/20 text-mood-secondary shadow-indigo-500/10" :
                    "bg-mood-secondary/5 border-mood-secondary/10 text-mood-secondary shadow-indigo-500/5 transition-opacity"
                )}>
                    {node.type === 'seed' && <div className="absolute inset-0 rounded-full animate-ping bg-mood-primary opacity-20" />}
                    {node.type === 'seed' ? <Globe className="w-5 h-5 md:w-6 md:h-6" /> : 
                        node.type === 'branch' ? <Network className="w-5 h-5 md:w-6 md:h-6" /> :
                        <Activity className="w-5 h-5 md:w-6 md:h-6" />}
                </div>

                {/* Content Card */}
                <motion.div 
                    initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                        "flex-1 bg-white/70 backdrop-blur-sm p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden",
                        node.type === 'seed' ? "ring-2 ring-mood-primary/10 shadow-mood-glow" : "shadow-zinc-900/5",
                        isSelectedRipple ? "ring-4 ring-mood-primary shadow-mood-glow scale-[1.02]" : ""
                    )}
                >
                        {node.type === 'seed' && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-mood-primary/20 to-transparent rounded-full blur-[40px] pointer-events-none" />}
                        <div className="relative z-10 flex items-center justify-between gap-2 md:gap-4 mb-4 border-b border-zinc-100/80 pb-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className={cn(
                                    "flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm ring-1 ring-zinc-900/5 relative",
                                    userRank?.aura
                                )}>
                                    <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                                    <div className="flex flex-col -space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs md:text-sm text-zinc-700">{node.author}</span>
                                            {onFocusMode && (
                                                <button 
                                                    onClick={() => onFocusMode({ text: node.text, author: node.author })}
                                                    className="p-1 text-zinc-300 hover:text-mood-primary transition-all"
                                                    title={language === 'ar' ? 'وضع المنارة' : 'Lighthouse Mode'}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {userRank && (
                                            <span className={cn("text-[9px] font-black uppercase tracking-tighter opacity-70", userRank.color)}>
                                                {userRank.rank}
                                            </span>
                                        )}
                                    </div>
                                    {userRank && <Award className={cn("w-3 h-3 ml-1", userRank.color)} />}
                                </div>
                                <span className={cn(
                                    "text-[10px] md:text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-widest",
                                    (node as any).isTimeCapsule ? "bg-zinc-800 text-zinc-100" :
                                    node.type === 'seed' ? "bg-mood-primary/10 text-mood-primary" :
                                    node.type === 'branch' ? "bg-emerald-50 text-emerald-600" :
                                    "bg-amber-50 text-amber-600"
                                )}>
                                    {(node as any).isTimeCapsule && <Lock className="w-3 h-3 inline mr-1 mb-0.5" />}
                                    {(node as any).isTimeCapsule ? (language === 'ar' ? 'كبسولة زمنية' : 'Time Capsule') :
                                    node.type === 'seed' ? (language === 'ar' ? 'البذرة الأولى' : 'Origin Seed') : 
                                    node.type === 'branch' ? (language === 'ar' ? 'تطوير' : 'Evolution') : 
                                    (language === 'ar' ? 'تطبيق عملي' : 'Implementation')}
                                </span>
                                {descendantsCount > 0 && (
                                    <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                        <GitBranch className="w-3 h-3" />
                                        {descendantsCount} {language === 'ar' ? 'تحول' : 'impact'}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs text-zinc-400 font-bold whitespace-nowrap bg-zinc-50 px-2 py-1 rounded-lg">{node.timestamp}</span>
                        </div>
                        <p 
                            className={cn(
                                "text-base md:text-lg text-zinc-800 leading-relaxed font-semibold mb-2 whitespace-pre-wrap relative z-10 transition-all", 
                                isLongText && "cursor-pointer",
                                isLocked && "blur-sm opacity-50 select-none grayscale"
                            )} 
                            onClick={() => !isLocked && isLongText && setExpanded(!expanded)}
                        >
                            {translatedText || displayText}
                            {isLongText && !isLocked && (
                                <span className={cn("text-sm font-bold transition-colors ml-2", expanded ? "text-zinc-400" : "text-mood-primary hover:opacity-80")}>
                                    {expanded ? (language === 'ar' ? 'عرض أقل' : 'Show less') : (language === 'ar' ? 'قراءة المزيد' : 'Read more')}
                                </span>
                            )}
                        </p>

                        <div className="mb-4 relative z-10">
                            <button 
                                onClick={async () => {
                                    if (isTranslating) return;
                                    if (translatedText) {
                                        setTranslatedText(null);
                                        return;
                                    }
                                    setIsTranslating(true);
                                    const res = await translateWithContext(node.text, language === 'ar' ? 'en' : 'ar');
                                    setIsTranslating(false);
                                    if (res) setTranslatedText(res);
                                }}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-mood-primary hover:opacity-80 transition-colors"
                            >
                                {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                                {translatedText ? (language === 'ar' ? 'العودة للأصل' : 'Show Original') : (language === 'ar' ? 'جسر اللغات' : 'Cultural Bridge')}
                            </button>
                        </div>
                        
                        <div className="relative z-10 flex items-center justify-between bg-zinc-50/50 -mx-2 -mb-2 p-2 rounded-2xl">
                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                <button onClick={() => {
                                    if (!auth.currentUser) {
                                        setToast({ 
                                            message: language === 'ar' ? '🚀 سجل دخولك الآن لتنضم لعائلتنا وتساهم بتطوير الأفكار!' : '🚀 Log in now to join our family and help evolve ideas!', 
                                            type: 'error' 
                                        });
                                        return;
                                    }
                                    handleLike(node);
                                }} 
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all shadow-sm ring-1 ring-transparent", 
                                    !auth.currentUser 
                                        ? "text-zinc-300 bg-zinc-50/50" 
                                        : "text-zinc-500 hover:text-rose-500 hover:bg-white hover:ring-zinc-200"
                                )}>
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill={node.likes > 0 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    <span className="text-sm">{node.likes}</span>
                                </button>
                                <button onClick={() => {
                                    if (!auth.currentUser) {
                                        setToast({ 
                                            message: language === 'ar' ? '💡 الأفكار العظيمة تبدأ بتسجيل الدخول! انضم إلينا لتطوير هذه الفكرة.' : '💡 Great ideas start with a login! Join us to evolve this idea.', 
                                            type: 'error' 
                                        });
                                        return;
                                    }
                                    setShowReply(!showReply);
                                }} 
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all shadow-sm ring-1 ring-transparent",
                                    !auth.currentUser 
                                        ? "text-zinc-300 bg-zinc-50/50" 
                                        : "text-zinc-500 hover:text-mood-primary hover:bg-white hover:ring-zinc-200"
                                )}>
                                    <Network className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="text-sm">{language === 'ar' ? 'تطوير الفكرة' : 'Branch out'}</span>
                                </button>
                                <button onClick={() => {
                                    try {
                                        const baseUrl = window.location.origin + window.location.pathname;
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('tab', 'ripple');
                                        params.set('ripple', node.id);
                                        const shareUrl = baseUrl + '?' + params.toString();
                                        
                                        navigator.clipboard.writeText(shareUrl).then(() => {
                                             setToast({ 
                                                message: language === 'ar' ? '✅ تم نسخ الرابط بنجاح.. انشر الإلهام!' : '✅ Link copied successfully.. Spread the inspiration!', 
                                                type: 'success' 
                                            });
                                        }).catch(() => {
                                             // Fallback for some browsers
                                             const input = document.createElement('input');
                                             input.value = shareUrl;
                                             document.body.appendChild(input);
                                             input.select();
                                             document.execCommand('copy');
                                             document.body.removeChild(input);
                                             setToast({ 
                                                message: language === 'ar' ? '✅ تم نسخ الرابط!' : '✅ Link copied!', 
                                                type: 'success' 
                                            });
                                        });
                                    } catch (err) {
                                        console.error("Share error:", err);
                                    }
                                }} className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="text-sm">{language === 'ar' ? 'شارك الفكرة' : 'Share Idea'}</span>
                                </button>
                            </div>
                            
                            {isUserIdea && (
                                <button 
                                    onClick={() => {
                                        let warning = '';
                                        if (language === 'ar') {
                                            warning = node.type === 'seed' 
                                                ? 'هل أنت متأكد؟ سيتم حذف هذه الفكرة الأساسية وجميع التطويرات المتفرعة منها بشكل نهائي.'
                                                : 'هل أنت متأكد؟ سيتم حذف هذا التطوير وجميع الفروع التابعة له.';
                                        } else {
                                            warning = node.type === 'seed'
                                                ? 'Are you sure? This will permanently delete the core idea and ALL branches branching from it.'
                                                : 'Are you sure? This will delete this development and all its sub-branches.';
                                        }
                                        if(window.confirm(warning)) {
                                            handleDelete(node.id);
                                        }
                                    }} 
                                    className="flex items-center gap-2 hover:bg-rose-50 px-3 py-2 rounded-xl text-zinc-400 hover:text-rose-600 font-bold cursor-pointer transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline text-sm">{language === 'ar' ? 'حذف' : 'Delete'}</span>
                                </button>
                            )}
                        </div>
                        
                        <AnimatePresence>
                            {showReply && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 flex gap-3 w-full bg-mood-primary/5 p-3 rounded-2xl border border-mood-primary/10"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 min-w-0 bg-white rounded-xl p-3 md:p-4 text-sm md:text-base font-medium shadow-inner border border-zinc-200/60 outline-none focus:border-mood-primary focus:ring-4 focus:ring-mood-primary/20 transition-all placeholder:text-zinc-400" placeholder={language === 'ar' ? "كيف يمكن تطوير أو تطبيق هذه الفكرة؟" : "How can this idea be evolved?"} />
                                    <button onClick={() => {
                                        if(replyText.trim()) {
                                            handleAddReply(node.id, replyText);
                                            setReplyText('');
                                            setShowReply(false);
                                        }
                                    }} className="bg-mood-primary text-white px-6 rounded-xl text-sm font-bold whitespace-nowrap hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-mood-glow">{language === 'ar' ? 'إضافة للشبكة' : 'Add to Network'}</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
            </div>
            
            {/* Children Wrapper */}
            {node.children && node.children.length > 0 && (
                <div className={cn(
                    "relative",
                    language === 'ar' ? "pr-12 md:pr-16" : "pl-12 md:pl-16"
                )}>
                    {/* Connecting Line from Parent Icon to Children */}
                    <div className={cn(
                        "absolute top-[-24px] bottom-10 w-[3px] rounded-full opacity-30",
                        language === 'ar' ? "right-[22px] md:right-[26px]" : "left-[22px] md:left-[26px]",
                        node.children[0]?.type === 'branch' ? "bg-gradient-to-b from-indigo-500 to-emerald-500" : "bg-gradient-to-b from-emerald-500 to-amber-500"
                    )} />
                    
                    <AnimatePresence>
                        {node.children.map((child) => (
                            <RippleNodeComponent 
                                key={child.id} 
                                node={child} 
                                level={level + 1}
                                language={language}
                                ripplesFlat={ripplesFlat}
                                auth={auth}
                                handleLike={handleLike}
                                handleDelete={handleDelete}
                                handleAddReply={handleAddReply}
                                setToast={setToast}
                                userRanks={userRanks}
                                onFocusMode={onFocusMode}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
});

export const RippleEffectTab = ({ language, handleTabChange, onFocusMode }: { language: 'ar' | 'en', handleTabChange: (tab: any, context?: string, exit?: boolean) => void, onFocusMode?: (idea: { text: string, author: string }) => void }) => {
    const [ripplesFlat, setRipplesFlat] = useState<any[]>([]);
    const [filterMyIdeas, setFilterMyIdeas] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false); 
    const [newIdea, setNewIdea] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);
    const [activeView, setActiveView] = useState<'list' | 'nebula'>('list');
    const [dailyPrompt, setDailyPrompt] = useState<any>(null);
    const [showInsights, setShowInsights] = useState(false);
    const [limitCount, setLimitCount] = useState(10);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const combinedRipples = useMemo(() => {
        // Find existing real data IDs to avoid overlap (though unlikely)
        const realIds = new Set(ripplesFlat.map(r => r.id));
        
        // If we have enough real data (e.g. 15 nodes), we don't show seeds
        if (ripplesFlat.length > 15) return ripplesFlat;
        
        // Otherwise, add seeds that don't clash with real data
        const virtualSeeds = seedData.filter(s => !realIds.has(s.id)).map(s => ({
            ...s,
            timestamp: (s as any).timestamp || new Date(Date.now() - 3600000 * Math.random() * 24 * 7).toISOString(), // Random time in last week
            isVirtual: true
        }));
        
        return [...ripplesFlat, ...virtualSeeds];
    }, [ripplesFlat]);

    const userRanks = useMemo(() => {
        const stats: Record<string, number> = {};
        combinedRipples.forEach(node => {
            if (!node.authorId) return;
            const points = node.type === 'seed' ? 20 : 10;
            stats[node.authorId] = (stats[node.authorId] || 0) + points + (node.likes || 0) * 5;
        });

        const ranks: Record<string, any> = {};
        Object.entries(stats).forEach(([uid, points]) => {
            if (points > 500) {
                ranks[uid] = { 
                    rank: language === 'ar' ? 'حكيم تبيان' : 'Sage of Tabyan', 
                    aura: "ring-2 ring-amber-400 ring-offset-2 animate-pulse",
                    color: "text-amber-600"
                };
            } else if (points > 100) {
                ranks[uid] = { 
                    rank: language === 'ar' ? 'مهندس أفكار' : 'Idea Engineer', 
                    aura: "ring-2 ring-emerald-400 ring-offset-1",
                    color: "text-emerald-600"
                };
            } else {
                ranks[uid] = { 
                    rank: language === 'ar' ? 'زارع بذور' : 'Seed Sower', 
                    aura: "ring-1 ring-indigo-200",
                    color: "text-indigo-500"
                };
            }
        });
        return ranks;
    }, [combinedRipples, language]);

    const tagFrequencies = useMemo(() => {
        const freq: Record<string, number> = {};
        combinedRipples.forEach(node => {
            const matches = node.text.match(/#(\w+)/g) || [];
            matches.forEach(tag => {
                freq[tag] = (freq[tag] || 0) + 1;
            });
        });
        return freq;
    }, [combinedRipples]);

    const sortedTags = useMemo(() => {
        return Object.entries(tagFrequencies)
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
    }, [tagFrequencies]);
    
    const displayTags = showAllCategories ? sortedTags : sortedTags.slice(0, 10);

    useEffect(() => {
        // Seed and Cleanup once
        const initData = async () => {
            if (!auth.currentUser) return;
            
            try {
                // Remove bad data pointed out in image
                const badTimestamps = ['2026-05-09T11:42:36.875Z', '2026-05-09T11:42:59.174Z'];
                const badTexts = ['التربية', 'التعليم'];
                const snapshot = await getDocs(ripplesCollection);
                
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const cleanText = data.text?.trim();
                    const includesBadText = badTexts.some(t => cleanText === t || cleanText?.startsWith(t + ' #'));
                    if (badTimestamps.includes(data.timestamp) || includesBadText) {
                        await deleteDoc(docSnap.ref);
                    }
                }

                // Seed if empty after cleanup
                const snapshotAfter = await getDocs(ripplesCollection);
                if (snapshotAfter.empty) {
                     const { seedData } = await import('../../data/seedData');
                     const idMap: Record<string, string> = {};
                     
                     for (const item of seedData) {
                        const actualParentId = item.parentId ? idMap[item.parentId] : null;
                        const docRef = await addDoc(ripplesCollection, {
                             ...item,
                             parentId: actualParentId,
                             likes: item.likes || 0,
                             timestamp: new Date().toISOString()
                        });
                        idMap[item.id] = docRef.id;
                        
                        let rootId = docRef.id;
                        if (actualParentId) {
                            const parentDoc = await getDoc(doc(db, 'ripples', actualParentId));
                            rootId = parentDoc.data()?.rootId || actualParentId;
                        }
                        await updateDoc(docRef, { rootId });
                     }
                }
            } catch (err) {
                // Silently handle if rules block deletion
                console.warn("Init data/cleanup skip:", err);
            }
        };
        initData();
        
        // Fetch Daily Prompt
        const fetchDailyPrompt = async () => {
             const fallbackPrompts = [
                {
                    ar: 'تخيل عالماً بدون عملات ورقية أو رقمية، كيف ستكون معايير القيمة والتبادل بين الناس؟ هل سيعود نظام المقايضة أم سيولد عقل جمعي يوزع الموارد؟',
                    en: 'Imagine a world without paper or digital currencies. What would be the criteria for value and exchange? Would the barter system return, or would a collective mind emerge to distribute resources?'
                },
                {
                    ar: 'إذا تمكنت التقنية من أرشفة جميع حواسك (ليس فقط البصر والسمع، بل اللمس والشم والتذوق) في ذاكرة رقمية، كيف سيغير ذلك مفهوم الحنين والعلاقات الإنسانية؟',
                    en: 'If technology could archive all your senses (not just sight and sound, but touch, smell, and taste) in a digital memory, how would that change the concept of nostalgia and human relationships?'
                },
                {
                    ar: 'الذكاء الاصطناعي يبدأ بكتابة أحلام البشر وهم نائمون وبثها كمسلسلات واقعية. هل ستشاهد أحلامك؟ وهل سيتغير مفهوم الخصوصية عندما تصبح "الأحلام" محتوى عاماً؟',
                    en: 'AI starts writing humans\' dreams while they sleep and broadcasting them as reality shows. Would you watch your dreams? And how would the concept of privacy change when "dreams" become public content?'
                },
                {
                    ar: 'مدن معلقة في الغلاف الجوي تستمد طاقتها من البرق والصواعق. ما هي التحديات الثقافية والاجتماعية التي قد تواجه مجتمعاً لا يلمس الأرض أبداً؟',
                    en: 'Floating cities in the atmosphere deriving power from lightning. What are the cultural and social challenges for a society that never touches the ground?'
                },
                {
                    ar: 'ما هو "الغرض" الذي قد تبحث عنه آلة واعية إذا حققت الخلود والذكاء المطلق؟ هل ستتجه للفن، أم للعبث، أم للغياب التام عن الوجود؟',
                    en: 'What "purpose" would a conscious machine seek if it achieved immortality and absolute intelligence? Would it turn to art, absurdity, or total withdrawal from existence?'
                },
                {
                    ar: 'تخيل لغة لا تعتمد على الكلمات، بل على نقل العواطف مباشرة عبر الحقل الكهرومغناطيسي للدماغ. كيف سيؤثر ذلك على الصدق والكذب والصراعات البشرية؟',
                    en: 'Imagine a language not based on words, but on transmitting emotions directly via the brain\'s electromagnetic field. How would this affect honesty, lies, and human conflicts?'
                },
                {
                    ar: 'لو استطاع البشر تبادل الذكريات كما نتبادل الملفات، هل ستبقى الهوية الشخصية ملكاً للفرد؟ أم سنصبح "وعياً سحابياً" تختلط فيه تجاربنا؟',
                    en: 'If humans could swap memories like files, would personal identity still belong to the individual? Or would we become a "cloud consciousness" where experiences blend?'
                },
                {
                    ar: 'ماذا لو كان الفن هو العملة الوحيدة المعترف بها؟ كيف ستتغير العمارة، وكيف سيعيش الناس حياتهم اليومية عندما يكون "الإبداع" هو ثمن الخبز؟',
                    en: 'What if art was the only recognized currency? How would architecture change, and how would people live when "creativity" is the price of bread?'
                },
                {
                    ar: 'إذا اكتشفنا أن الأرض كائن حي يحاول التواصل معنا عبر الكوارث الطبيعية كرسائل مشفرة، كيف ستعتذر البشرية للكوكب؟',
                    en: 'If we discovered Earth is a living being trying to communicate via natural disasters as encrypted messages, how would humanity apologize to the planet?'
                },
                {
                    ar: 'تخيل وظيفتك هي "مترجم أحاسيس الحيوانات". ما هو أول شيء تعتقد أن كائناً آخراً سيخبرنا به عن طريقتنا في إدارة الكوكب؟',
                    en: 'Imagine your job is "animal emotion translator." What is the first thing you think another being would tell us about how we manage the planet?'
                },
                {
                    ar: 'الغابة الرقمية: نظام بيئي يتكون من ذكاء اصطناعي يعيش بشكل مستقل في البرية. هل سنحتاج لحماية هذه "الأرواح الرقمية" كجزء من التنوع البيئي؟',
                    en: 'The Digital Forest: An ecosystem of AI living independently in the wild. Would we need to protect these "digital souls" as part of biodiversity?'
                },
                {
                    ar: 'لو توقف الوقت لمدة ساعة واحدة يومياً للجميع باستثناء شخص واحد يتم اختياره عشوائياً، ماذا ستفعل لو كنت ذلك الشخص؟',
                    en: 'If time stopped for one hour daily for everyone except one randomly chosen person, what would you do if you were that person?'
                },
                {
                    ar: 'تخيل وجود مرآة لا تعكس شكلك الخارجي، بل تعكس "أثرك الجميل" على الآخرين. كيف سيكون مظهرك اليوم في تلك المرآة؟',
                    en: 'Imagine a mirror that doesn\'t reflect your appearance, but your "beautiful impact" on others. How would you look today in that mirror?'
                },
                {
                    ar: 'إذا كان بإمكاننا سماع "صوت النجوم"، هل تعتقد أنها تغني لنا، أم أنها مجرد ثرثرة كونية لا نهائية؟',
                    en: 'If we could hear the "sound of stars," do you think they are singing to us, or is it just infinite cosmic chatter?'
                },
                {
                    ar: 'بناء جسور بين القارات باستخدام جذور الأشجار العملاقة. كيف سيغير ذلك مفهوم السفر والحدود والارتباط بالأرض؟',
                    en: 'Building bridges between continents using giant tree roots. How would this change travel, borders, and connection to the Earth?'
                },
                {
                    ar: 'قانون الطبيعة الأول في المستقبل: كل مبنى يجب أن ينتج أكسجين أكثر مما يستهلك سكانه. كيف ستبدو مدننا في هذا النظام؟',
                    en: 'The first law of nature in the future: every building must produce more oxygen than its residents consume. How would our cities look under this system?'
                }
            ];

             const q = query(collection(db, 'daily_prompts'), orderBy('date', 'desc'), limit(1));
             const snap = await getDocs(q);
             if (!snap.empty) {
                 setDailyPrompt({ id: snap.docs[0].id, ...snap.docs[0].data() });
             } else {
                 // Determine day-based fallback
                 const todayIndex = new Date().getDate() % fallbackPrompts.length;
                 const selected = fallbackPrompts[todayIndex];
                 setDailyPrompt({
                     question: language === 'ar' ? selected.ar : selected.en,
                     date: new Date().toISOString()
                 });
             }
         };
         fetchDailyPrompt();
         
         const q = query(ripplesCollection, orderBy('timestamp', 'desc'), limit(limitCount));
         const unsubscribe = onSnapshot(q, (snapshot) => {
             const badTimestamps = ['2026-05-09T11:42:36.875Z', '2026-05-09T11:42:59.174Z'];
             const badTexts = ['التربية', 'التعليم', 'Education'];
             
             const data = snapshot.docs
                 .map(doc => ({ id: doc.id, ...doc.data() }))
                 .filter((item: any) => {
                     const cleanText = item.text?.trim();
                     const isBadTimestamp = badTimestamps.includes(item.timestamp);
                     const isBadText = badTexts.some(t => cleanText === t || cleanText?.startsWith(t + ' #'));
                     return !isBadTimestamp && !isBadText;
                 });
             setRipplesFlat(data);
         });
         return unsubscribe;
     }, [limitCount]);

    // Helper to build tree from flat list
    const buildTree = (nodes: any[]): RippleNode[] => {
        const map = new Map();
        nodes.forEach(node => map.set(node.id, { ...node, children: [] }));
        const tree: RippleNode[] = [];
        nodes.forEach(node => {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId).children.push(map.get(node.id));
            } else {
                tree.push(map.get(node.id));
            }
        });
        return tree;
    };

    // Filter and Search logic
    const filteredRipples = combinedRipples.filter(node => {
        if (filterMyIdeas && node.authorId !== auth.currentUser?.uid) return false;
        if (selectedCategory && !node.text.includes(selectedCategory)) return false;
        if (searchQuery && !node.text.toLowerCase().includes(searchQuery.toLowerCase()) && !node.author.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const ripples = buildTree(filteredRipples);


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const hasScrolledRef = useRef(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get('ripple');
        if (targetId && ripplesFlat.length > 0 && !hasScrolledRef.current) {
            hasScrolledRef.current = true;
            setTimeout(() => {
                const element = document.getElementById(`ripple-${targetId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-8');
                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-8');
                    }, 3000);
                }
            }, 500);
        }
    }, [ripplesFlat]);




    const handleRefine = async () => {
        if (!newIdea.trim()) return;
        setIsRefining(true);
        try {
            const refined = await refineIdea(newIdea, language);
            if (refined) {
                setNewIdea(refined);
                setToast({ message: language === 'ar' ? 'تمت الصياغة بلمسة أرسطو!' : 'Refined with Aristotle\'s touch!', type: 'success' });
            }
        } finally {
            setIsRefining(false);
        }
    };

    const handleDropIdea = async () => {
        if (!auth.currentUser) {
            setToast({ 
                message: language === 'ar' ? '🚀 رحلة الألف فكرة تبدأ بتسجيل دخول! انضم إلينا الآن لنشر بذور إبداعك.' : '🚀 A journey of a thousand ideas starts with a login! Join us now to spread your creative seeds.', 
                type: 'error' 
            });
            return;
        }
        if (!newIdea.trim()) return;
        if (newIdea.length > 250) {
            setToast({ message: language === 'ar' ? 'الفكرة طويلة جداً (الحد 250 حرف)، حاول صقلها أو تقسيمها لفروع.' : 'Idea is too long (limit 250 chars), please refine or split it into branches.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const docRef = await addDoc(ripplesCollection, {
                text: newIdea,
                author: auth.currentUser?.displayName || 'Anonymous',
                authorId: auth.currentUser?.uid || 'anon',
                type: 'seed',
                likes: 0,
                timestamp: new Date().toISOString(),
                parentId: null,
                isTimeCapsule: isTimeCapsule,
                unlockDate: isTimeCapsule ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null, // 1 week
                unlockBranchCount: isTimeCapsule ? 5 : 0
            });
            // Set rootId to its own ID for seeds
            await updateDoc(docRef, { rootId: docRef.id });
            setNewIdea('');
            setIsTimeCapsule(false);
        } catch (error) {
            console.error("Error adding idea:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (node: RippleNode) => {
        if (!auth.currentUser) return;
        const likeRef = doc(db, 'ripples', node.id, 'likes', auth.currentUser.uid);
        const likeSnap = await getDoc(likeRef);
        
        if (!likeSnap.exists()) {
            await setDoc(likeRef, { userId: auth.currentUser.uid });
            await updateDoc(doc(db, 'ripples', node.id), { likes: increment(1) });
            // Mock email notification
            console.log(`[Email Notification] تم التفاعل مع فكرتك في تبيان: تم عمل Like على فكرتك "${node.text.slice(0,20)}"`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const batch = writeBatch(db);
            
            // Function to recursively find all children IDs
            const getDescendantIds = (parentId: string, flatList: any[]): string[] => {
                const children = flatList.filter(node => node.parentId === parentId);
                let ids = children.map(c => c.id);
                children.forEach(child => {
                    ids = [...ids, ...getDescendantIds(child.id, flatList)];
                });
                return ids;
            };

            const allToDelete = [id, ...getDescendantIds(id, ripplesFlat)];
            
            allToDelete.forEach(docId => {
                batch.delete(doc(db, 'ripples', docId));
            });

            await batch.commit();
            setToast({ message: language === 'ar' ? 'تم حذف الغصن بالكامل بنجاح' : 'Entire branch deleted successfully', type: 'success' });
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `ripples/${id}`);
            setToast({ message: language === 'ar' ? 'حدث خطأ أثناء الحذف المتسلسل' : 'Error during cascading delete', type: 'error' });
        }
    };

    const handleAddReply = async (parentId: string, text: string) => {
        try {
            const parent = ripplesFlat.find(r => r.id === parentId);
            const rootId = parent?.rootId || parentId;

            await addDoc(ripplesCollection, {
                text,
                author: auth.currentUser?.displayName || 'Anonymous',
                authorId: auth.currentUser?.uid || 'anon',
                type: 'branch',
                likes: 0,
                timestamp: new Date().toISOString(),
                parentId,
                rootId
            });
            // Mock email notification
            console.log("[Email Notification] تم التفاعل مع فكرتك في تبيان: تم إضافة تطوير على فكرتك");
        } catch (error) {
            console.error("Error replying:", error);
        }
    };



    return (
        <div id="ripple-top-anchor" className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-16">
            {/* Soft ambient background */}
            <div className="fixed inset-0 bg-zinc-50 z-[-2]" />
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiLz48L3N2Zz4=')] opacity-50 z-[-1] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-100/50 to-transparent blur-[120px] pointer-events-none z-[-1]" />
            
            {/* Back to top tool (visible on scroll) */}
            {showBackToTop && (
                <div className="fixed bottom-6 right-6 z-50">
                     <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-zinc-800 text-white p-3 rounded-full shadow-lg hover:bg-zinc-700"
                    >
                        <ChevronUp />
                    </button>
                </div>
            )}
            
            {/* Insights tool (Always visible top-left) */}
            <div className="fixed top-20 left-6 z-50">
                <button 
                    onClick={() => setShowInsights(true)}
                    className="bg-mood-primary text-white p-4 rounded-full shadow-lg"
                >
                    <Sparkles />
                </button>
            </div>
            <AnimatePresence>
                {showInsights && <InsightsPanel ideas={combinedRipples} onClose={() => setShowInsights(false)} language={language} handleTabChange={handleTabChange} />}
            </AnimatePresence>

            <button
                onClick={() => handleTabChange('home')}
                className="absolute top-8 left-4 p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors z-20 flex items-center gap-2"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-bold hidden md:inline">{language === 'ar' ? 'رجوع' : 'Back'}</span>
            </button>
            {/* Local Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                            "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3",
                            toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        )}
                    >
                        {toast.type === 'success' ? <Sparkles className="w-5 h-5 text-emerald-200" /> : <X className="w-5 h-5 text-rose-200" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="text-center space-y-6 relative z-10 mb-12">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-mood-primary/10 to-emerald-50 text-mood-primary rounded-full text-xs font-black tracking-widest uppercase shadow-sm border border-mood-primary/20"
                >
                    <Network className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'الشبكة الاجتماعية للأفكار' : 'Social Network of Ideas'}</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-600 py-2 leading-tight">
                    {language === 'ar' ? 'نسيج الأفكار' : 'Idea Fabric'}
                </h2>
                <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    {language === 'ar' 
                      ? 'اكتشف خيوط الترابط بين الأفكار وشاهد كيف يتشكل نسيج الوعي المشترك.' 
                      : 'Explore the threads of interconnection between ideas and see how the fabric of shared awareness is formed.'}
                </p>
            </div>

            {/* Input Box */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[32px] shadow-2xl border border-white/40 ring-1 ring-zinc-900/5 relative overflow-hidden z-10"
               dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-mood-primary/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-500/20 to-rose-500/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-4">
                        {dailyPrompt && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-r from-mood-primary to-emerald-500 p-0.5 rounded-2xl mb-2"
                            >
                                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-mood-primary rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-mood-glow">
                                            <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-mood-primary tracking-widest uppercase mb-1">
                                                {language === 'ar' ? 'بذرة اليوم' : 'DAILY PROMPT'}
                                            </p>
                                            <p className="text-zinc-800 font-bold text-sm md:text-base leading-snug">
                                                {dailyPrompt.question}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setNewIdea(dailyPrompt.question + '\n\n')}
                                        className="bg-mood-primary text-white px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap hover:opacity-90 transition-all shadow-lg active:scale-95"
                                    >
                                        {language === 'ar' ? 'ازرع غصن' : 'Plant Branch'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <label className="text-sm font-black text-mood-primary/40 tracking-widest uppercase flex items-center gap-2 px-1">
                            <Sparkles className="w-4 h-4" />
                            {language === 'ar' ? 'ازرع بذرة فكرة مفتوحة المصدر' : 'PLANT AN OPEN SOURCE SEED'}
                        </label>

                    {!auth.currentUser && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-800"
                        >
                            <div className="bg-emerald-500 p-2 rounded-full text-white shrink-0">
                                <Plus className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-bold flex-1">
                                {language === 'ar' 
                                    ? '🚀 رحلة الألف فكرة تبدأ بتسجيل دخول! انضم إلينا الآن لنشر بذور إبداعك.' 
                                    : '🚀 A journey of a thousand ideas starts with a login! Join us now to spread your creative seeds.'}
                            </p>
                        </motion.div>
                    )}

                    <textarea 
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        placeholder={language === 'ar' ? "فكرتي هي..." : "My idea is..."}
                        className="w-full bg-white/50 border-2 border-zinc-100/50 rounded-2xl p-5 text-lg md:text-xl font-bold text-zinc-800 focus:bg-white focus:border-mood-primary/50 focus:ring-4 focus:ring-mood-primary/10 outline-none resize-none h-40 placeholder:text-zinc-300 transition-all shadow-inner"
                    />
                    <div className="flex flex-wrap justify-between items-center gap-4 text-xs font-bold text-zinc-400 px-1">
                        <div className="flex gap-4">
                            <span>{newIdea.length} {language === 'ar' ? 'حرف' : 'characters'}</span>
                            <button 
                                onClick={() => setIsTimeCapsule(!isTimeCapsule)}
                                className={cn(
                                    "flex items-center gap-2 transition-all p-1 px-2 rounded-lg",
                                    isTimeCapsule ? "text-mood-primary bg-mood-primary/10 ring-1 ring-mood-primary/20" : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                <Lock className={cn("w-3.5 h-3.5", isTimeCapsule ? "fill-current" : "")} />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="font-black underline decoration-indigo-200 decoration-2 underline-offset-2">
                                        {language === 'ar' ? 'كبسولة زمنية' : 'Time Capsule'}
                                    </span>
                                    {isTimeCapsule && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[9px] mt-1 text-indigo-400"
                                        >
                                            {language === 'ar' ? 'ستبقى "مُشفرة" حتى يكتمل نضجها بالمطورين' : 'Will stay "Encrypted" until it matures'}
                                        </motion.span>
                                    )}
                                </div>
                            </button>
                        </div>
                        {newIdea.length > 200 && (
                            <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "px-2 py-1 rounded-full",
                                    newIdea.length > 250 ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                                )}
                            >
                                {newIdea.length > 250 
                                    ? (language === 'ar' ? 'تجاوزت الحد الأقصى (250)! استخدم "تهذيب الفكرة" للصقل.' : 'Exceeded limit (250)! Use "Refine" to polish.')
                                    : (language === 'ar' ? 'اقتربت من الحد الأقصى للأصالة!' : 'Approaching the limit of originality!')}
                            </motion.span>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button 
                            onClick={handleRefine}
                            disabled={isRefining || !newIdea.trim()}
                            className="bg-white border-2 border-zinc-100 text-zinc-600 hover:text-mood-primary hover:border-mood-primary/20 px-6 py-3.5 rounded-2xl font-black flex items-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isRefining ? (
                                <div className="w-5 h-5 border-2 border-mood-primary/20 border-t-mood-primary rounded-full animate-spin" />
                            ) : (
                                <Brain className="w-5 h-5" />
                            )}
                            <span>{language === 'ar' ? 'تهذيب الفكرة (AI)' : 'Refine Idea (AI)'}</span>
                        </button>
                        
                        <button 
                            onClick={handleDropIdea}
                            disabled={isSubmitting || (auth.currentUser && !newIdea.trim())}
                            className={cn(
                                "group relative overflow-hidden text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-mood-glow",
                                !auth.currentUser ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-zinc-900 hover:bg-black shadow-zinc-950/20"
                            )}
                        >
                            <div className="absolute inset-0 bg-mood-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                                    <span className="relative z-10">{language === 'ar' ? 'انشر الفكرة' : 'Drop Idea'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Ripples Tree */}
            <div className="mt-20 space-y-8 relative">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 relative z-10 gap-6">
                    <div className="flex items-center gap-4 bg-zinc-100/50 p-1.5 rounded-2xl border border-zinc-200">
                        <button 
                            onClick={() => setActiveView('list')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                activeView === 'list' ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <UserCircle className="w-4 h-4" />
                            {language === 'ar' ? 'منظور الشبكة' : 'Network View'}
                        </button>
                        <button 
                            onClick={() => setActiveView('nebula')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                activeView === 'nebula' ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <Ghost className="w-4 h-4" />
                            {language === 'ar' ? 'خريطة السديم' : 'Nebula Map'}
                        </button>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400", language === 'ar' ? "right-3" : "left-3")} />
                            <input 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder={language === 'ar' ? 'ابحث في العقول...' : 'Search in minds...'} 
                                className={cn("w-full bg-white border border-zinc-200 px-4 py-3 rounded-full text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all", language === 'ar' ? "pr-10" : "pl-10")} 
                            />
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <button 
                                onClick={() => setFilterMyIdeas(!filterMyIdeas)}
                                className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", filterMyIdeas ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-700")}
                            >
                                {language === 'ar' ? 'أفكاري فقط' : 'My ideas only'}
                            </button>
                            {displayTags.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={cn("px-3 py-1 rounded-full text-xs font-bold transition-all", selectedCategory === cat ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-700")}
                                >
                                    {cat}
                                </button>
                            ))}
                            {sortedTags.length > 10 && (
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="px-3 py-1 rounded-full text-xs font-bold transition-all bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center gap-1"
                                >
                                    {showAllCategories ? <><ChevronUp className="w-3 h-3" /> ...</> : <><ChevronDown className="w-3 h-3" /> +</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        {activeView === 'list' ? (
                            <motion.div 
                                key="list-view"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {ripples.map((node) => (
                                    <RippleNodeComponent 
                                        key={node.id} 
                                        node={node} 
                                        language={language}
                                        ripplesFlat={ripplesFlat}
                                        auth={auth}
                                        handleLike={handleLike}
                                        handleDelete={handleDelete}
                                        handleAddReply={handleAddReply}
                                        setToast={setToast}
                                        userRanks={userRanks}
                                        onFocusMode={onFocusMode}
                                    />
                                ))}
                                <button 
                                    onClick={() => setLimitCount(prev => prev + 50)}
                                    className="w-full text-center py-4 text-zinc-500 font-bold hover:text-mood-primary border-t border-zinc-200"
                                >
                                    {language === 'ar' ? 'تحميل المزيد من الأفكار...' : 'Load more ideas...'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="nebula-view"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                            >
                                <NebulaTab language={language} onViewDetails={(id) => {
                                    setActiveView('list');
                                    setTimeout(() => {
                                        const el = document.getElementById(`ripple-${id}`);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
