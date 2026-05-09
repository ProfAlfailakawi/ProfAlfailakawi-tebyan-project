import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Network, Globe, Plus, Share2, Search, ArrowRight, UserCircle, Activity, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, increment, query, orderBy, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreError';

const ripplesCollection = collection(db, 'ripples');

interface RippleNode {
    id: string;
    text: string;
    author: string;
    authorId?: string;
    rootId?: string;
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
        authorId: 'dummy-1',
        type: 'seed',
        likes: 142,
        timestamp: 'قبل يومين',
        children: [
            {
                id: '1-1',
                text: 'إضافة غرف عزل صوتي للاجتماعات الصغيرة',
                author: 'أحمد سعيد',
                authorId: 'dummy-2',
                type: 'branch',
                likes: 56,
                timestamp: 'قبل يوم',
                children: [
                    {
                        id: '1-1-1',
                        text: 'تطبيق لحجز الغرف بالساعة',
                        author: 'فريق CodeLabs',
                        authorId: 'dummy-3',
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
                authorId: 'dummy-4',
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
        authorId: 'dummy-5',
        type: 'seed',
        likes: 412,
        timestamp: 'قبل أسبوع',
        children: [
            {
                id: '2-1',
                text: 'التعاون مع السوبرماركت لاستبدال النقاط بمقاضي',
                author: 'نور الدين',
                authorId: 'dummy-6',
                type: 'branch',
                likes: 120,
                timestamp: 'قبل 4 أيام',
                children: []
            }
        ]
    }
];

export const RippleEffectTab = ({ language }: { language: 'ar' | 'en' }) => {
    const [ripplesFlat, setRipplesFlat] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [newIdea, setNewIdea] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const q = query(ripplesCollection, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRipplesFlat(data);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get('ripple');
        if (targetId && ripplesFlat.length > 0) {
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

    const ripples = buildTree(ripplesFlat);

    const handleDropIdea = async () => {
        if (!newIdea.trim()) return;
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
        } catch (error) {
            console.error("Error replying:", error);
        }
    };

    const RippleNodeComponent = ({ node, level = 0 }: { node: RippleNode; level?: number }) => {
        // For visibility: user is owner, or admin, or owner of the root node
        const rootOwnerId = node.rootId ? ripplesFlat.find(r => r.id === node.rootId)?.authorId : null;
        const isUserIdea = node.authorId === auth.currentUser?.uid || 
                          (rootOwnerId === auth.currentUser?.uid && !!rootOwnerId) ||
                          (node.author === (language === 'ar' ? 'أنت' : 'You') && !node.authorId) ||
                          auth.currentUser?.email?.toLowerCase().includes('alfailakawidrahmad') || 
                          auth.currentUser?.email?.toLowerCase().includes('dr.ahmad');
        const [showReply, setShowReply] = useState(false);
        const [replyText, setReplyText] = useState('');

        return (
            <div className="relative" id={`ripple-${node.id}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                        level > 0 && (language === 'ar' ? "mr-12" : "ml-12")
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
                                 <button onClick={() => handleLike(node)} className="flex items-center gap-1 hover:text-rose-500 cursor-pointer transition-colors">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                     {node.likes}
                                 </button>
                                 <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 hover:text-indigo-500 cursor-pointer transition-colors">
                                     <Network className="w-4 h-4" />
                                     {language === 'ar' ? 'تطوير' : 'Branch'}
                                 </button>
                                 <button onClick={() => {
                                     const baseUrl = window.location.origin + window.location.pathname;
                                     const params = new URLSearchParams(window.location.search);
                                     params.set('tab', 'creativelab');
                                     params.set('ripple', node.id);
                                     navigator.clipboard.writeText(baseUrl + '?' + params.toString());
                                     setToast({ message: language === 'ar' ? 'تم نسخ الرابط الحصري' : 'Direct link copied!', type: 'success' });
                                 }} className="flex items-center gap-2 hover:text-emerald-500 cursor-pointer transition-colors px-2 py-1 bg-zinc-50 rounded-lg">
                                     <Share2 className="w-4 h-4" />
                                     {language === 'ar' ? 'مشاركة' : 'Share'}
                                 </button>
                                 {isUserIdea && (
                                     <button 
                                         onClick={() => {
                                             const warning = language === 'ar' 
                                                ? 'هل أنت متأكد؟ سيتم حذف هذه الفكرة وجميع التطويرات المتفرعة منها بشكل نهائي.' 
                                                : 'Are you sure? This will permanently delete this idea and ALL branches branching from it.';
                                             if(window.confirm(warning)) {
                                                handleDelete(node.id);
                                             }
                                         }} 
                                         className="flex items-center gap-1 hover:text-rose-600 font-bold cursor-pointer transition-colors px-2 py-1 bg-rose-50 rounded-lg text-rose-500"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                        {language === 'ar' ? 'حذف' : 'Delete'}
                                     </button>
                                 )}
                             </div>
                         </div>
                         {showReply && (
                             <div className="mt-4 flex gap-2">
                                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 bg-zinc-50 rounded-lg p-2 text-sm" placeholder={language === 'ar' ? "اكتب تطويرك هنا..." : "Write your improvement here..."} />
                                <button onClick={() => {
                                    if(replyText.trim()) {
                                        handleAddReply(node.id, replyText);
                                        setReplyText('');
                                        setShowReply(false);
                                    }
                                }} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold">{language === 'ar' ? 'إرسال' : 'Send'}</button>
                             </div>
                         )}
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
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={language === 'ar' ? 'بحث...' : 'Search...'} className="bg-zinc-100 p-2 rounded-lg text-sm" />
                    </div>
                </div>

                <div className="relative z-10">
                    <AnimatePresence>
                        {ripples.filter(n => n.text.includes(search)).map((node) => (
                            <RippleNodeComponent key={node.id} node={node} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
