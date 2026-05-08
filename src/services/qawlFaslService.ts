import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, increment, addDoc, setDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QawlFaslQuestion as Question } from '../components/tabs/QawlFasl/types';
import { generateQawlFaslContent, GeminiKeyMissingError } from './qawlFaslAiService';

export type { Question };

const QUESTIONS_COLLECTION = 'qawl_fasl_questions';
const MAIN_CATEGORIES = [
  'الإيمان والأسئلة الدينية',
  'السلوك والتربية والتعامل',
  'المشاعر والذكاء العاطفي',
  'التعلم والمدرسة',
  'التقنية والإنترنت',
  'الوقاية وحماية الطفل',
  'المستقبل والإستراتيجية',
  'بناء الشخصية والثقة',
  'المال والاستهلاك'
];

function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefined(v)])
  );
}

export const qawlFaslService = {
  // Database Management
  async backupAndResetQuestions() {
    console.log("Starting Hard Reset process (No Backup)...");
    try {
      const qSnapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
      const allDocs = qSnapshot.docs;
      
      if (allDocs.length > 0) {
        let deletedCount = 0;
        
        // Delete individually to avoid Firestore Rules limit (10 get() ops per batch request)
        const deletePromises = allDocs.map(async (d) => {
          await deleteDoc(d.ref);
          deletedCount++;
        });
        
        // Run in smaller parallel chunks
        for (let i = 0; i < deletePromises.length; i += 50) {
          await Promise.all(deletePromises.slice(i, i + 50));
        }
        
        console.log(`Hard reset complete. Deleted ${deletedCount} docs.`);
        return { success: true, count: deletedCount };
      }
      return { success: true, count: 0 };
    } catch (error: any) {
      console.error("Hard reset failed:", error);
      throw new Error(`تعذر مسح النظام: ${error.message}`);
    }
  },

  async generateDailyQawlFaslQuestions() {
    let generated = 0;
    let published = 0;
    let needsReview = 0;
    let skipped = 0;
    let errors = 0;
    let loops = 0;
    const maxLoops = 25;

    const existingRef = await getDocs(collection(db, QUESTIONS_COLLECTION));
    const existingTitles = new Set();
    const categoryCounts: Record<string, number> = {};
    
    // Initialize category counts
    MAIN_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);

    existingRef.docs.forEach(d => {
        const data = d.data();
        existingTitles.add(data.question);
        if (data.mainCategory && categoryCounts[data.mainCategory] !== undefined) {
            categoryCounts[data.mainCategory]++;
        } else if (data.category && categoryCounts[data.category] !== undefined) {
            categoryCounts[data.category]++; // Fallback
        }
    });

    const totalToGenerate = 10;
    const targetCategoriesQueue: string[] = [];
    
    // First, ensure every category is represented once if possible
    const shuffledCats = [...MAIN_CATEGORIES].sort(() => Math.random() - 0.5);
    shuffledCats.forEach(cat => {
      if (targetCategoriesQueue.length < totalToGenerate) {
        targetCategoriesQueue.push(cat);
      }
    });
    
    // If we need more (unlikely if CATEGORIES < 10, but good for safety), pick the lowest count ones
    while(targetCategoriesQueue.length < totalToGenerate) {
        const lowestCat = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] < categoryCounts[b] ? a : b);
        targetCategoriesQueue.push(lowestCat);
        categoryCounts[lowestCat]++; // Temporary increment for queue selection
    }

    while (generated < totalToGenerate && loops < maxLoops) {
        const targetCategory = targetCategoriesQueue[generated] || MAIN_CATEGORIES[Math.floor(Math.random() * MAIN_CATEGORIES.length)];
        try {
            console.log(`Generating daily question ${generated + 1}/${totalToGenerate} for ${targetCategory}... (Loop ${loops + 1})`);
            const context = `Generate a completely unique, highly requested problem for the category: "${targetCategory}". DO NOT REPEAT common generic advice. Explore edge cases, modern variations, or very specific nuanced situations. Ensure the output strictly sets mainCategory to "${targetCategory}". The tone should be wise, educational, and compassionate.`;
            const content = await generateQawlFaslContent("اقترح سؤالاً فريداً ومحدداً للمحور التالي: " + targetCategory, context);
            
            // Artificial delay to prevent triggering API rate limits
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            if (existingTitles.has(content.question)) {
                skipped++;
                loops++;
                continue;
            }

            const isSensitive = content.riskLevel === 'high' || content.sourceStatus === 'needs_source_review';
            const status = isSensitive ? 'needs_review' : 'published';
            
            const baseData = {
                ...content,
                category: content.mainCategory, // Mapping for compatibility
                categoryId: content.categorySlug,
                status,
                requiresExpertReview: content.riskLevel === 'high',
                source: 'daily-ai-generated',
                viewCount: 0,
                isDailyPick: true,
                dailyPickDate: new Date().toISOString().split('T')[0],
                reviewStatus: {
                  educational: status === 'published' ? 'approved' : 'pending',
                  religious: status === 'published' ? 'approved' : 'pending',
                  sources: content.sourceStatus === 'verified' ? 'verified' : 'pending'
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, QUESTIONS_COLLECTION), removeUndefined(baseData));

            existingTitles.add(content.question);
            categoryCounts[targetCategory]++;
            generated++;
            loops++;
            if (status === 'published') published++;
            else needsReview++;
        } catch (error: any) {
            if (error instanceof GeminiKeyMissingError || error?.name === "GeminiKeyMissingError" || (error?.message || "").includes("تعثراً في الوصول")) {
              console.warn("AI generation skipped: GEMINI_API_KEY_NOT_CONFIGURED");
              errors++;
              break;
            }
            console.error("Error generating daily question:", error);
            errors++;
            loops++;
        }
    }

    await addDoc(collection(db, 'qawl_fasl_generation_logs'), {
        type: 'daily',
        generated,
        published,
        needsReview,
        skipped,
        errors,
        timestamp: serverTimestamp()
    });

    // Mark today as generated
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'system_config', 'qawl_fasl_last_gen'), { date: today, timestamp: serverTimestamp() });

    return { generated, published, needsReview, skipped, errors };
  },

  async triggerDailyGenerationIfNecessary() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const configRef = doc(db, 'system_config', 'qawl_fasl_last_gen');
        const configSnap = await getDoc(configRef);
        
        if (!configSnap.exists() || configSnap.data().date !== today) {
            console.log("Starting daily generation for today:", today);
            return await this.generateDailyQawlFaslQuestions();
        } else {
            console.log("Daily generation already completed for today.");
            return null;
        }
    } catch (e) {
        console.error("Failed to check/trigger daily generation:", e);
        return null;
    }
  },

  async handleMissingSearchPublishing(userSearch: string) {
    try {
        console.log(`Handling instant generation for: ${userSearch}`);
        const content = await generateQawlFaslContent(userSearch, "This is initiated by a user search. The question might be misspelled or vague. Clean it up in the 'question' field. If it is highly inappropriate, mark riskLevel 'high'.");
        
        const isSensitive = content.riskLevel === 'high' || content.sourceStatus === 'needs_source_review';
        const status = isSensitive ? 'needs_review' : 'published';

        const baseData = {
            ...content,
            category: content.mainCategory || "عام",
            categoryId: content.categorySlug || "general",
            status,
            requiresExpertReview: content.riskLevel === 'high',
            source: 'instant-user-search-generated',
            viewCount: 1,
            reviewStatus: {
              educational: status === 'published' ? 'approved' : 'pending',
              religious: status === 'published' ? 'approved' : 'pending',
              sources: content.sourceStatus === 'verified' ? 'verified' : 'pending'
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const questionData = removeUndefined(baseData);

        const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), questionData);

        await addDoc(collection(db, 'qawl_fasl_generation_logs'), {
            type: 'instant-search',
            query: userSearch,
            status,
            questionId: docRef.id,
            timestamp: serverTimestamp()
        });

        return { id: docRef.id, ...questionData } as Question;
    } catch (e: any) {
        if (e instanceof GeminiKeyMissingError || e?.name === "GeminiKeyMissingError" || (e?.message || "").includes("تعثراً في الوصول")) {
            console.warn("AI generation for missing search skipped: GEMINI_API_KEY_NOT_CONFIGURED");
            throw e;
        }
        console.warn("Status: AI analysis logic applied", e?.message || "");
        throw e;
    }
  },

  // Search engine (Keyword based)
  async searchQuestions(searchTerm: string, filters?: { categorySlug?: string; ageGroup?: string; riskLevel?: string }) {
    // Basic search functionality. For semantic, we'd need a different approach or vector search.
    // For now, doing keyword-based fetch and client-side filtering/matching.
    const questionsRef = collection(db, QUESTIONS_COLLECTION);
    // Add where clause to satisfy firestore security rules for list operations
    const qSnapshot = await getDocs(query(questionsRef, where('status', '==', 'published')));
    
    let results: Question[] = [];
    qSnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as Question);
    });

    // Simple keyword/content matching
    results = results.filter(q => 
        q.question?.includes(searchTerm) || 
        q.keywords?.some(k => k.includes(searchTerm)) ||
        q.category?.includes(searchTerm) ||
        q.mainCategory?.includes(searchTerm)
    );

    // Apply filters
    if (filters) {
        if (filters.categorySlug) results = results.filter(q => q.categorySlug === filters.categorySlug);
        if (filters.ageGroup) results = results.filter(q => q.ageGroups?.includes(filters.ageGroup!));
        if (filters.riskLevel) results = results.filter(q => q.riskLevel === filters.riskLevel);
    }

    return results;
  },

  // Related questions engine
  async getRelatedQuestions(questionId: string, limitCount = 5): Promise<Question[]> {
    const qRef = doc(db, QUESTIONS_COLLECTION, questionId);
    const qSnap = await getDoc(qRef);
    if (!qSnap.exists()) return [];

    const qData = qSnap.data() as Question;
    
    // Find questions with similar keywords or same category
    const questionsRef = collection(db, QUESTIONS_COLLECTION);
    const q = query(questionsRef, where('categorySlug', '==', qData.categorySlug || 'general'), where('status', '==', 'published'), limit(limitCount + 1));
    const querySnapshot = await getDocs(q);
    
    let related: Question[] = [];
    querySnapshot.forEach((doc) => {
        if (doc.id !== questionId) {
            related.push({ id: doc.id, ...doc.data() } as Question);
        }
    });

    return related.slice(0, limitCount);
  },

  async incrementViewCount(questionId: string) {
    try {
      const qRef = doc(db, QUESTIONS_COLLECTION, questionId);
      await updateDoc(qRef, {
        viewCount: increment(1)
      });
    } catch (e: any) {
      if (e.code === 'not-found') {
        console.warn(`Attempted to increment view count on non-existent question: ${questionId}`);
      } else {
        console.error("Failed to increment view count:", e);
      }
    }
  },

  async logSearch(queryTerm: string, resultsFound: boolean) {
    try {
      await addDoc(collection(db, 'search_logs'), {
        query: queryTerm,
        resultsFound,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to log search:', e);
    }
  },

  mapMainCategory(categoryStr: string): string {
    const CATEGORY_TO_MAIN_CATEGORY: Record<string, string> = {
        "الإيمان والأسئلة الدينية": "الإيمان والأسئلة الدينية",
        "السلوك والتربية والتعامل": "السلوك والتربية والتعامل",
        "المشاعر والذكاء العاطفي": "المشاعر والذكاء العاطفي",
        "التعلم والمدرسة": "التعلم والمدرسة",
        "التقنية والإنترنت": "التقنية والإنترنت",
        "الوقاية وحماية الطفل": "الوقاية وحماية الطفل",
        "المستقبل والإستراتيجية": "المستقبل والإستراتيجية",
        "بناء الشخصية والثقة": "بناء الشخصية والثقة",
        "المال والاستهلاك": "المال والاستهلاك",
        // Legacy/Generated mappings
        "الإيمان والأسئلة الوجودية": "الإيمان والأسئلة الدينية",
        "السلوك والتربية": "السلوك والتربية والتعامل",
        "المشاعر والعلاقات": "المشاعر والذكاء العاطفي",
        "الحماية والمخاطر": "الوقاية وحماية الطفل",
        "الحياة والهوية": "المستقبل والإستراتيجية"
    };

    if (CATEGORY_TO_MAIN_CATEGORY[categoryStr]) {
        return CATEGORY_TO_MAIN_CATEGORY[categoryStr];
    }

    const slug = categoryStr?.toLowerCase() || '';
    if (slug.includes('faith') || slug.includes('religion') || slug.includes('islam')) return 'الإيمان والأسئلة الوجودية';
    if (slug.includes('behavior') || slug.includes('discipline') || slug.includes('personality')) return 'السلوك والتربية';
    if (slug.includes('emotion') || slug.includes('relationship') || slug.includes('family')) return 'المشاعر والعلاقات';
    if (slug.includes('school') || slug.includes('learning') || slug.includes('education')) return 'التعلم والمدرسة';
    if (slug.includes('technology') || slug.includes('digital') || slug.includes('internet')) return 'التقنية والإنترنت';
    if (slug.includes('safety') || slug.includes('protection') || slug.includes('risk')) return 'الحماية والمخاطر';
    
    return 'الحياة والهوية';
  },

  async migrateAllQuestionsToMainCategory() {
    const questionsRef = collection(db, QUESTIONS_COLLECTION);
    const snap = await getDocs(questionsRef);
    const report: Record<string, string[]> = {};
    const updates = snap.docs.map(async (d) => {
        const data = d.data() as Question;
        const newMain = this.mapMainCategory(data.category);
        
        if (!report[newMain]) report[newMain] = [];
        if (!report[newMain].includes(data.category)) {
            report[newMain].push(data.category);
        }

        if (data.mainCategory !== newMain) {
            await updateDoc(d.ref, { mainCategory: newMain });
        }
    });
    await Promise.all(updates);
    console.log("Migration Validation Report:", report);
  },

  async getSearchTrends(): Promise<any[]> {
      const q = query(
        collection(db, 'search_trends'),
        orderBy('count', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  
    async analyzeSearchLogs() {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const q = query(
          collection(db, 'search_logs'),
          where('timestamp', '>=', twentyFourHoursAgo)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => d.data());
      
      // Grouping
      const stats: Record<string, { count: number, found: boolean }> = {};
      logs.forEach(log => {
        if(!stats[log.query]) stats[log.query] = { count: 0, found: true };
        stats[log.query].count++;
        if(!log.resultsFound) stats[log.query].found = false;
      });
  
    // Save trends and missing
    const trendsRef = collection(db, 'search_trends');
    const missingRef = collection(db, 'missing_questions');
    
    const trendPromises = Object.entries(stats).map(async ([queryStr, data]) => {
      await addDoc(trendsRef, { 
        query: queryStr, 
        count: data.count, 
        timestamp: serverTimestamp() 
      });
      
      if (!data.found) {
        await addDoc(missingRef, { 
          query: queryStr, 
          frequency: data.count, 
          status: 'pending',
          createdAt: serverTimestamp() 
        });
      }
    });

    await Promise.all(trendPromises);
  },
  
    async getMissingQuestions(): Promise<any[]> {
      const q = query(collection(db, 'missing_questions'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  
    async updateMissingQuestionStatus(id: string, status: string, suggestedQuestion?: string, generatedAnswer?: string) {
      await updateDoc(doc(db, 'missing_questions', id), { status, suggestedQuestion, generatedAnswer });
    },
  
    async autoGenerateMissingDrafts() {
      // Get pending missing queries
      const q = query(collection(db, 'missing_questions'), where('status', '==', 'pending'), limit(5));
      const snap = await getDocs(q);
      
        for (const docRef of snap.docs) {
          try {
            const data = docRef.data();
            const content = await this.handleMissingSearchPublishing(data.query);
            
            await updateDoc(doc(db, 'missing_questions', docRef.id), { 
               status: 'published_or_draft',
               source: 'AI-instant',
               suggestedQuestion: content.question, 
               generatedAnswer: content.quickSummary
            });
            
            // Artificial delay to prevent triggering API rate limits
            await new Promise(resolve => setTimeout(resolve, 4000));
          } catch (e: any) {
            if (e instanceof GeminiKeyMissingError) {
              console.warn("AI generation in autoGenerateMissingDrafts skipped: GEMINI_API_KEY_NOT_CONFIGURED");
              break;
            }
            console.error("Error processing missing draft:", e);
          }
        }
    },
  
    async getMostAskedQuestions(limitCount: number = 3): Promise<Question[]> {

    const q = query(
      collection(db, QUESTIONS_COLLECTION),
      where('status', '==', 'published'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  async submitFeedback(questionId: string, feedbackType: 'positive' | 'partial' | 'negative') {
    try {
      const qRef = doc(db, QUESTIONS_COLLECTION, questionId);
      await updateDoc(qRef, {
        [`feedback.${feedbackType}`]: increment(1)
      });
    } catch (e: any) {
      if (e.code === 'not-found') {
        console.warn(`Attempted to submit feedback on non-existent question: ${questionId}`);
      } else {
        console.error("Failed to submit feedback:", e);
      }
    }
  }
};
