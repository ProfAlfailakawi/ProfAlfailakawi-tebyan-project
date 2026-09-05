import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface RawQuestion {
    id: string;
    title: string;
    categoryId: string;
    tags: string[];
    ageGroups: string[];
    sensitivity: 'safe' | 'medium' | 'high';
    status: string;
    createdAt: number;
    updatedAt: number;
    category?: string;
    categorySlug?: string;
    quickSummary?: string;
    quickAnswer?: any;
    commonMistake?: string;
    educationalView?: string;
    suggestedAnswer?: string;
    byAgeVersions?: any[];
    practicalSteps?: string[];
    exercises?: string[];
    whenToWorry?: string;
    religiousReference?: string;
    scientificStat?: string;
    resources?: any[];
    closingThought?: string;
}

const CATEGORY_MAP: Record<string, { category: string, categorySlug: string }> = {
    'general': { category: 'عام', categorySlug: 'general' },
    'faith': { category: 'الإيمان والأسئلة الدينية', categorySlug: 'faith-religious-questions' }
};

async function seed() {
    console.log("Starting seeding...");
    const rawData: RawQuestion[] = JSON.parse(readFileSync('./qawl_fasl_full_v1.json', 'utf-8'));
    
    let imported = 0;
    let skipped = 0;
    let invalid = 0;
    let errors = 0;

    for (const item of rawData) {
        if (!item.id || !item.title || !item.categoryId) {
            invalid++;
            continue;
        }

        try {
            const docRef = doc(db, 'qawl_fasl_questions', item.id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                skipped++;
                continue;
            }

            const categoryInfo = CATEGORY_MAP[item.categoryId] || 
                                 (item.category ? { category: item.category, categorySlug: item.categorySlug || item.categoryId.toLowerCase() } : 
                                 { category: 'غير مصنق', categorySlug: 'uncategorized' });

            const questionData = {
                question: item.title,
                category: categoryInfo.category,
                categorySlug: categoryInfo.categorySlug,
                keywords: item.tags || [],
                ageGroups: item.ageGroups || [],
                riskLevel: item.sensitivity || 'low',
                status: 'published',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                reviewStatus: {
                    educational: "needs_review",
                    religious: "needs_review",
                    sources: "needs_review"
                },
                // Pedagogical fields
                quickSummary: item.quickSummary || '',
                quickAnswer: item.quickAnswer || { sayThis: '', dontSayThis: '', doThisNow: '' },
                commonMistake: item.commonMistake || '',
                educationalView: item.educationalView || '',
                suggestedAnswer: item.suggestedAnswer || '',
                byAgeVersions: item.byAgeVersions || [],
                practicalSteps: item.practicalSteps || [],
                exercises: item.exercises || [],
                whenToWorry: item.whenToWorry || '',
                religiousReference: item.religiousReference || '',
                scientificStat: item.scientificStat || '',
                resources: item.resources || [],
                closingThought: item.closingThought || ''
            };
            
            await setDoc(docRef, questionData);
            imported++;
        } catch (e) {
            console.error(e);
            errors++;
        }
    }
    
    console.log("Import Report:");
    console.log("- Total items processed: " + rawData.length);
    console.log("- Imported: " + imported);
    console.log("- Skipped duplicates: " + skipped);
    console.log("- Invalid records: " + invalid);
    console.log("- Errors: " + errors);
}

seed().then(() => console.log("Seeding complete.")).catch(console.error);
