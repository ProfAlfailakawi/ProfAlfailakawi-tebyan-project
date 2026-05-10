import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Network, Globe, Plus, Share2, Search, ArrowRight, ArrowLeft, UserCircle, Activity, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, increment, query, orderBy, getDoc, setDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';

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
};

const RippleNodeComponent = React.memo(({ node, level = 0, language, ripplesFlat, auth, handleLike, handleDelete, handleAddReply, setToast }: RippleNodeComponentProps) => {
    // For visibility: user is owner, or admin, or owner of the root node
    const rootOwnerId = node.rootId ? ripplesFlat.find(r => r.id === node.rootId)?.authorId : null;
    const isUserIdea = node.authorId === auth.currentUser?.uid || 
                        (rootOwnerId === auth.currentUser?.uid && !!rootOwnerId) ||
                        (node.author === (language === 'ar' ? 'أنت' : 'You') && !node.authorId) ||
                        auth.currentUser?.email?.toLowerCase().includes('alfailakawidrahmad') || 
                        auth.currentUser?.email?.toLowerCase().includes('dr.ahmad');
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [expanded, setExpanded] = useState(false);
    const isSelectedRipple = new URLSearchParams(window.location.search).get('ripple') === node.id;

    const isLongText = node.text.length > 200;
    const displayText = !isLongText || expanded ? node.text : node.text.slice(0, 200) + '...';

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
                    node.type === 'seed' ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-500/20" :
                    node.type === 'branch' ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-500/20" :
                    "bg-amber-50 border-amber-100 text-amber-600 shadow-amber-500/20"
                )}>
                    {node.type === 'seed' && <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20" />}
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
                        node.type === 'seed' ? "ring-2 ring-indigo-50/50 shadow-indigo-900/5" : "shadow-zinc-900/5",
                        isSelectedRipple ? "ring-4 ring-emerald-500 shadow-emerald-500/20 scale-[1.02]" : ""
                    )}
                >
                        {node.type === 'seed' && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-[40px] pointer-events-none" />}
                        <div className="relative z-10 flex items-center justify-between gap-2 md:gap-4 mb-4 border-b border-zinc-100/80 pb-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm ring-1 ring-zinc-900/5">
                                    <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                                    <span className="font-bold text-xs md:text-sm text-zinc-700">{node.author}</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] md:text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-widest",
                                    node.type === 'seed' ? "bg-indigo-50 text-indigo-600" :
                                    node.type === 'branch' ? "bg-emerald-50 text-emerald-600" :
                                    "bg-amber-50 text-amber-600"
                                )}>
                                    {node.type === 'seed' ? (language === 'ar' ? 'البذرة الأولى' : 'Origin Seed') : 
                                    node.type === 'branch' ? (language === 'ar' ? 'تطوير' : 'Evolution') : 
                                    (language === 'ar' ? 'تطبيق عملي' : 'Implementation')}
                                </span>
                            </div>
                            <span className="text-[10px] md:text-xs text-zinc-400 font-bold whitespace-nowrap bg-zinc-50 px-2 py-1 rounded-lg">{node.timestamp}</span>
                        </div>
                        <p 
                            className={cn("text-base md:text-lg text-zinc-800 leading-relaxed font-semibold mb-6 whitespace-pre-wrap relative z-10", isLongText && "cursor-pointer")} 
                            onClick={() => isLongText && setExpanded(!expanded)}
                        >
                            {displayText}
                            {isLongText && (
                                <span className={cn("text-sm font-bold transition-colors ml-2", expanded ? "text-zinc-400" : "text-indigo-500 hover:text-indigo-600")}>
                                    {expanded ? (language === 'ar' ? 'عرض أقل' : 'Show less') : (language === 'ar' ? 'قراءة المزيد' : 'Read more')}
                                </span>
                            )}
                        </p>
                        
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
                                        : "text-zinc-500 hover:text-indigo-600 hover:bg-white hover:ring-zinc-200"
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
                                    className="mt-4 flex gap-3 w-full bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100"
                                    style={{ overflow: 'hidden' }}
                                >
                                    <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 min-w-0 bg-white rounded-xl p-3 md:p-4 text-sm md:text-base font-medium shadow-inner border border-zinc-200/60 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all placeholder:text-zinc-400" placeholder={language === 'ar' ? "كيف يمكن تطوير أو تطبيق هذه الفكرة؟" : "How can this idea be evolved?"} />
                                    <button onClick={() => {
                                        if(replyText.trim()) {
                                            handleAddReply(node.id, replyText);
                                            setReplyText('');
                                            setShowReply(false);
                                        }
                                    }} className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20">{language === 'ar' ? 'إضافة للشبكة' : 'Add to Network'}</button>
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
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
});

export const RippleEffectTab = ({ language, handleTabChange }: { language: 'ar' | 'en', handleTabChange: (tab: any, context?: string, exit?: boolean) => void }) => {
    const [ripplesFlat, setRipplesFlat] = useState<any[]>([]);
    const [filterMyIdeas, setFilterMyIdeas] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false); 
    const [newIdea, setNewIdea] = useState('');

    const tagFrequencies = useMemo(() => {
        const freq: Record<string, number> = {};
        ripplesFlat.forEach(node => {
            const matches = node.text.match(/#(\w+)/g) || [];
            matches.forEach(tag => {
                freq[tag] = (freq[tag] || 0) + 1;
            });
        });
        return freq;
    }, [ripplesFlat]);

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
                        idMap[item.authorId || item.text.slice(0, 10)] = docRef.id;
                        
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
        
        const q = query(ripplesCollection, orderBy('timestamp', 'desc'));
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
    }, []);

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
    const filteredRipples = ripplesFlat.filter(node => {
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




    const handleDropIdea = async () => {
        if (!auth.currentUser) {
            setToast({ 
                message: language === 'ar' ? '🚀 رحلة الألف فكرة تبدأ بتسجيل دخول! انضم إلينا الآن لنشر بذور إبداعك.' : '🚀 A journey of a thousand ideas starts with a login! Join us now to spread your creative seeds.', 
                type: 'error' 
            });
            return;
        }
        if (!newIdea.trim()) return;
        if (newIdea.length > 200) {
            setToast({ message: language === 'ar' ? 'الفكرة طويلة جداً، حاول تقسيمها.' : 'Idea is too long, please try splitting it.', type: 'error' });
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
                parentId: null
            });
            // Set rootId to its own ID for seeds
            await updateDoc(docRef, { rootId: docRef.id });
            setNewIdea('');
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
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-16">
            {/* Soft ambient background */}
            <div className="fixed inset-0 bg-zinc-50 z-[-2]" />
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiLz48L3N2Zz4=')] opacity-50 z-[-1] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-100/50 to-transparent blur-[120px] pointer-events-none z-[-1]" />

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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase shadow-sm border border-indigo-100/50"
                >
                    <Network className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'الشبكة الاجتماعية للأفكار' : 'Social Network of Ideas'}</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-600 py-2 leading-tight">
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
               className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[32px] shadow-2xl border border-white/40 ring-1 ring-zinc-900/5 relative overflow-hidden z-10"
               dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-amber-500/20 to-rose-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4">
                    <label className="text-sm font-black text-indigo-900/40 tracking-widest uppercase flex items-center gap-2">
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
                        className="w-full bg-white/50 border-2 border-zinc-100/50 rounded-2xl p-5 text-xl font-bold text-zinc-800 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none h-36 placeholder:text-zinc-300 transition-all shadow-inner"
                    />
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
                        <span>{newIdea.length} {language === 'ar' ? 'حرف' : 'characters'}</span>
                        {newIdea.length > 200 && (
                            <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"
                            >
                                {language === 'ar' ? 'فكرة عميقة! حاول تحويلها لبذرة، ثم أضف فروعاً للأجزاء الأخرى!' : 'Deep idea! Try converting to seed, then add branches for the rest!'}
                            </motion.span>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button 
                            onClick={handleDropIdea}
                            disabled={isSubmitting || (auth.currentUser && !newIdea.trim())}
                            className={cn(
                                "group relative overflow-hidden text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-900/20",
                                !auth.currentUser ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-900 hover:bg-black"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 relative z-10 gap-4">
                    <h3 className="font-black text-2xl md:text-3xl text-black flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        {language === 'ar' ? 'موجات الأفكار النشطة' : 'Active Ripples'}
                    </h3>
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
                    <AnimatePresence>
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
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
