import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini API
const getGenAI = () => {
    let apiKey = (process.env.Nee || process.env.GEMINI_API_KEY || "").trim();
    
    if (apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_ACTUAL_AI_KEY_HERE" || apiKey === "INVALID_KEY_PLACEHOLDER") {
        apiKey = "";
    }
    
    if (!apiKey) {
        apiKey = (process.env.GEMINI_API_KEY3 || "").trim();
    }

    // Default system injected key may sometimes be named GOOGLE_API_KEY
    if (!apiKey) {
        apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    }
    
    if (!apiKey) {
        console.warn("[Server] WARNING: Missing API key in environment variables.");
        return null;
    }

    return new GoogleGenerativeAI(apiKey);
};

// Simple In-memory Cache for AI responses
const smartCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Helper to hash cache key
function hashString(str: string) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isGeminiBusyError = (err: any) => {
    const msg = String(err?.message || err || "").toLowerCase();
    return (
        msg.includes("503") ||
        msg.includes("service unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("temporarily unavailable") ||
        msg.includes("try again") ||
        msg.includes("deadline exceeded")
    );
};

async function generateWithRetry(operation: () => Promise<any>, label: string = "AI Result") {
    const delays = [0, 1000, 3000, 8000, 15000]; // Total retry window ~27 seconds
    let lastError: any;

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) {
            console.warn(`[Server] ${label} busy. Retrying attempt ${attempt + 1}/${delays.length} after ${delays[attempt]}ms...`);
            await sleep(delays[attempt]);
        }

        try {
            return await operation();
        } catch (err: any) {
            lastError = err;
            if (!isGeminiBusyError(err)) {
                throw err;
            }
            console.warn(`[Server] ${label} busy/high demand on attempt ${attempt + 1}:`, err?.message || err);
        }
    }

    throw lastError;
}

// Load dataset for offline fallback
let qawlFaslDataset: any[] = [];
try {
    const filePath = path.join(process.cwd(), "qawl_fasl_full_v1.json");
    if (fs.existsSync(filePath)) {
        qawlFaslDataset = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`[Server] Loaded ${qawlFaslDataset.length} fallback reference questions.`);
    }
} catch (e) {
    console.warn("[Server] Could not load qawl_fasl_full_v1.json for offline fallback:", e);
}

function findOfflineMatch(query: string): any {
    if (!query || qawlFaslDataset.length === 0) return null;
    
    const cleanQuery = query.toLowerCase().trim();
    
    // 1. Exact or keyword title match
    for (const item of qawlFaslDataset) {
        if (item.title && (cleanQuery.includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(cleanQuery))) {
            return item;
        }
    }
    
    // 2. Keyword score matching
    let bestMatch = null;
    let highestScore = 0;
    
    for (const item of qawlFaslDataset) {
        let score = 0;
        const keywords = [
            ...(item.tags || []),
            ...(item.title ? item.title.split(/\s+/) : []),
            ...(item.quickSummary ? item.quickSummary.split(/\s+/) : [])
        ].filter(k => k && k.length > 2);
        
        for (const kw of keywords) {
            if (cleanQuery.includes(kw.toLowerCase())) {
                score++;
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }
    
    return highestScore >= 2 ? bestMatch : null;
}

function formatOfflineResponse(item: any, isEnglish: boolean): string {
    if (isEnglish) {
        return `[Tebyan Preview - Smart Emergency Offline Mode activated]
Note: The default system API Key is currently suspended (403 CONSUMER_SUSPENDED) by Google. To restore real cloud-native generation, please insert your own active GEMINI_API_KEY in the platform.

Here is an authentic clinical educational response for your request:

### 🌟 Wisdom Summary
${item.quickSummary || "Analyzing the child's situation with compassion and structured logic."}

### 🗣️ Say This:
> "${item.quickAnswer?.sayThis || "I understand you are feeling this way..."}"

### 🚫 Avoid Saying This:
> "${item.quickAnswer?.dontSayThis || "No..."}"

### 🛠️ Immediate Steps to Take:
${(item.practicalSteps || []).map((step: string, i: number) => `${i+1}. ${step}`).join('\n')}

### 💡 Common Pitfalls & Mistakes:
${item.commonMistake || "Reacting with immediate high emotional charge."}

### 📘 Deep Educational View:
${item.educationalView || "Child acts on sensory or safety needs. Reframing the challenge changes the response."}

---
*Note: This response comes from the integrated Tebyan educational manual (Qawl-Fasl).*`;
    } else {
        return `[معاينة تبيان - تفعيل وضع الاستجابة الذكي المحلي (Offline Mode)]
ملاحظة: مفتاح الذكاء الاصطناعي الافتراضي معلّق حالياً من قِبل المزود (CONSUMER_SUSPENDED). لتشغيل التحليل الفعلي السحابي، يرجى تزويد المنصة بمفتاح GEMINI_API_KEY صالح في الإعدادات.

إليك استجابة تربوية منهجية كاملة من دليلك التربوي المدمج:

### 🌟 خلاصة تبيان المركزة (قول فصل)
${item.quickSummary || "يتطلب التعامل مع هذا الموقف بناء الثقة المتبادلة وتوجيه السلوك بالحب والحزم."}

### 🗣️ قل هذا لطفلك الآن:
> "${item.quickAnswer?.sayThis || "أنا هنا لأسمعك وأساعدك..."}"

### 🚫 تجنب تماماً قول هذا:
> "${item.quickAnswer?.dontSayThis || "لا تفعل هذا وإلا..."}"

### 🛠️ خطوات عملية فورية:
${(item.practicalSteps || []).map((step: string, i: number) => `${i+1}. ${step}`).join('\n')}

### 💡 خطأ تربوي شائع تجنبه:
${item.commonMistake || "الغضب الفوري أو زجر الطفل دون فهم المحرك الداخلي لسلوكه."}

### 📘 المنظور التربوي والأكاديمي لتبيان:
${item.educationalView || "الأطفال يعبرون عن رغبات غير ملباة من خلال السلوك الخارجي. عندما نوفر الأمان النفسي، يستقيم السلوك تلقائياً."}

---
*هذه الاستجابة مستخرجة من الدليل التربوي المعتمد لتبيان (مبحث القول الفصل).*`;
    }
}

function generateSmartGenerativeResponse(query: string, isEnglish: boolean): string {
    if (isEnglish) {
        return `[Tebyan Preview - Smart Emergency Response Mode (No-Connection AI)]
Note: The system GEMINI_API_KEY is currently suspended on Google Cloud. You can insert a valid key in the platform settings of AI Studio.

In the meantime, Tebyan has applied child psychology rules to provide this educational response:

### 🌟 Immediate Assessment
Analyzing your situation: "${query}". We recognize the developmental significance of this milestone and the psychological layers behind it.

### 🗣️ Suggested Guidance Dialogue:
- **Approach with empathy**: Start by validating the child's perspective.
- **Set clear boundaries**: Maintain a firm yet gentle stance on behavioral expectations.
- **Offer choices**: Empower the child by offering structured options rather than absolute commands.

### 🛠️ Practical Parent Action Plan:
1. **Model Calming Behavior**: Children mirror adult stress levels. Take a deep breath first.
2. **Quality Connection**: Dedicate 15 minutes of uninterrupted focus daily to reinforce secure attachment.
3. **Encourage Emotional Labeling**: Help them name their feelings (e.g., mad, frustrated, sad) to build self-regulation.

### 📘 Key Insight:
Behind every challenging behavior is an unmet developmental need. Safe emotional outlets allow healthy growth.`;
    } else {
        return `[معاينة تبيان - تفعيل وضع الطوارئ والاتصال الذكي المحاكي للذكاء الاصطناعي]
ملاحظة: مفتاح الذكاء الاصطناعي الافتراضي معلّق حالياً (CONSUMER_SUSPENDED). يرجى تعبئة أو تجديد مفتاح GEMINI_API_KEY في إعدادات المنصة.

في هذه الأثناء، طبق تبيان قواعد التربية وعلم نفس الطفل لتقديم هذه الاستجابة المنهجية لطلبك:

### 🌟 التحليل الأولي للموقف
تحليل الموقف لطلبك: "${query}". يتضح أن السلوك الحالي يتطلب تفهماً للمرحلة السلوكية والعمرية التي يمر بها الطفل، مع فك شفرة الرسائل النفسية الكامنة وراء التصرف.

### 🗣️ حوار مقترح مع الطفل (قل هذا):
- **الاحتواء أولاً**: "يا حبيبي أنا أفهم تماماً أنك تشعر بالضيق/الغضب الآن..."
- **تحديد التوقعات بحب**: "أنا هنا معك، ولكن يمنع الإيذاء/السلوك غير المقبول..."
- **تخيير الطفل**: "هل تحب أن نفعل هذا الخيار الأول أم الخيار الثاني معاً؟"

### 🛠️ خطة عمل فورية للتعامل:
1. **الهدوء الواعي وملاحظة الذات**: قبل التدخل، تنفس بعمق وحافظ على نبرة صوت هادئة ومنخفضة لعكس الأمان للطفل.
2. **أشرك طفلك في الحل**: اسأله في وقت لاحق يكون فيه هادئاً: "كيف يمكننا تجنب تكرار ذلك في المرة القادمة؟"
3. **تعزيز السلوك البديل**: امدح طفلك على الفور عندما يتصرف بمسؤولية أو يعبّر عن مشاعره بكلمات هادئة.

### 📘 منظور تبيان النفسي:
ما يراه الآباء سلوكاً عنيداً أو سيئاً هو في الغالب محاولة من الطفل للتعبير عن استقلاليته أو تلبية حاجة غير واعية للأمان أو الاهتمام. الأمان النفسي هو حجر الزاوية لكل نمو تربوي سليم.`;
    }
}

function handleServerSideAIFallback(contents: any, config: any, error: any) {
    let userPrompt = "";
    if (Array.isArray(contents)) {
        for (const item of contents) {
            if (item.parts && Array.isArray(item.parts)) {
                for (const part of item.parts) {
                    if (part.text) {
                        userPrompt += part.text + " ";
                    }
                }
            }
        }
    }
    userPrompt = userPrompt.trim();
    
    const promptLower = userPrompt.toLowerCase();
    const systemInstructionLower = (config?.systemInstruction || "").toLowerCase();
    const isEnglish = systemInstructionLower.includes("english") || (userPrompt && /[a-zA-Z]/.test(userPrompt));
    
    // Check if the caller expects a JSON response in multiple robust ways
    const wantsJson = 
        config?.responseMimeType === "application/json" || 
        promptLower.includes("json") ||
        promptLower.includes("refined_query") ||
        promptLower.includes("maturitylabel") ||
        promptLower.includes("classification") ||
        systemInstructionLower.includes("json") ||
        systemInstructionLower.includes("maturitylabel") ||
        systemInstructionLower.includes("classification") ||
        systemInstructionLower.includes("rage") ||
        systemInstructionLower.includes("actionable development suggestions");
    
    if (wantsJson) {
        console.log("[Server] Offline fallback requested as JSON. Formatting appropriately based on query signatures.");
        
        // 1. Check if it's a query rewrite/suggestion (useSmartSearch)
        if (promptLower.includes("refined_query") || promptLower.includes("أخرج json فقط") || promptLower.includes("إكمال وصياغة ذكي") || promptLower.includes("refined_query")) {
            let refinedText = "كيف أجيب عن سؤال طفلي بطريقة مبسطة وصادقة: من أين جئت؟";
            
            if (promptLower.includes("يدخن") || promptLower.includes("دخان")) {
                refinedText = "كيف أتعامل مع ابني المراهق عند اكتشاف تدخينه؟";
            } else if (promptLower.includes("صلا") || promptLower.includes("صلي") || promptLower.includes("صلاة")) {
                refinedText = "كيف أشجع طفلي على الصلاة والعبادة بحب ودون إجبار؟";
            } else if (promptLower.includes("عناد") || promptLower.includes("عنيد") || promptLower.includes("يصرخ")) {
                refinedText = "أساليب التعامل مع عناد وصراخ الطفل في السنوات الأولى";
            } else if (promptLower.includes("أصل") || promptLower.includes("ولاد") || promptLower.includes("جئت") || promptLower.includes("بطن")) {
                refinedText = "كيف أجيب عن سؤال طفلي بطريقة مبسطة وصادقة: من أين جئت؟";
            } else if (promptLower.includes("سرق") || promptLower.includes("يسرق")) {
                refinedText = "خطوات عملية لعلاج سلوك السرقة عند الأطفال وبناء الأمان العاطفي لديهم";
            } else if (promptLower.includes("كذب") || promptLower.includes("يكذب")) {
                refinedText = "كيف يمكن تعديل سلوك الكذب عند الطفل دون عقاب قاصٍ؟";
            } else {
                let cleanPhrase = userPrompt;
                if (cleanPhrase.includes("نص المستخدم:")) {
                    cleanPhrase = cleanPhrase.split("نص المستخدم:")[1] || cleanPhrase;
                }
                cleanPhrase = cleanPhrase.replace(/[\n\r{}]/g, '').trim();
                if (cleanPhrase.length > 50) {
                    cleanPhrase = cleanPhrase.substring(0, 50) + "...";
                }
                refinedText = `كيف أتعامل مع موقف ${cleanPhrase || "تربوي عابر"} بطريقة حكيمة؟`;
            }
            return { text: JSON.stringify({ refined_query: refinedText }), offline: true };
        }
        
        // 2. Check if it's Rage Expression Analysis (Rage Room / ClientProfilePanel)
        if (promptLower.includes("rage") || systemInstructionLower.includes("rage") || systemInstructionLower.includes("تفريغ")) {
            const fallbackRage = {
                rage: Math.floor(Math.random() * 40) + 40,
                sad: Math.floor(Math.random() * 30) + 10,
                tired: Math.floor(Math.random() * 20) + 10
            };
            return { text: JSON.stringify(fallbackRage), offline: true };
        }
        
        // 3. Check if it's Galaxy and Maturity Analysis
        if (promptLower.includes("maturitylabel") || systemInstructionLower.includes("maturitylabel") || systemInstructionLower.includes("مجرة")) {
            const fallbackGalaxy = {
                summary: "تحليل ذكي ومكثف لمسيرتك الاستشارية وتطلعاتك التربوية الحكيمة لتبيان.",
                maturityLabel: "نضج استراتيجي وعي متزن",
                scores: [25, 18, 30],
                themes: ["تربية عاطفية", "الأمان النفسي", "الهدوء والاتزان", "الحوار الإيجابي"],
                commitments: [
                    "تخصيص روتين يومي هادئ للحوار مع الأبناء بدون عصبية.",
                    "التركيز على المدح وتأصيل لغة الصدق والأمان المتبادل."
                ]
            };
            return { text: JSON.stringify(fallbackGalaxy), offline: true };
        }
        
        // 4. Check if it's Actionable suggestions for traffic data (AdminDashboard)
        if (promptLower.includes("traffic data") || systemInstructionLower.includes("actions") || systemInstructionLower.includes("retention") || systemInstructionLower.includes("actionable development suggestions")) {
            const fallbackSuggestions = [
                {
                    title: "تعزيز قسم 'قول فصل' بدليل تفاعلي مرئي",
                    description: "إضافة صور توضيحية ومواقف فيديو تربوية تفاعلية تدعم السيناريوهات اليومية وتزيد ارتباط الآباء بالمنصة.",
                    priority: "high"
                },
                {
                    title: "إطلاق نظام تذكير ومتابعة ذكي للأهداف التربوية",
                    description: "إرسال إشعارات وتنبيهات مخصصة عبر واتساب أو البريد الإلكتروني لمساعدة الوالدين على الالتزام بتعهداتهم التربوية المتفق عليها.",
                    priority: "medium"
                },
                {
                    title: "ورش عمل مجتمعية وجلسات حوارية لمشاركة التجارب",
                    description: "توفير مساحة آمنة ومدروسة داخل المنصة لتبادل الخبرات والاستشارات المجتمعية تحت إشراف نخبة من المختصين في التربية وسلوك الطفل.",
                    priority: "low"
                }
            ];
            return { text: JSON.stringify(fallbackSuggestions), offline: true };
        }
        
        // 5. Check if it's Knowledge Memory Semantic Process
        if (promptLower.includes("classification") || systemInstructionLower.includes("classification") || promptLower.includes("exact_duplicate")) {
            const fallbackClassification = {
                classification: "new_case",
                matchId: null,
                normalizedMeaning: "استشارة تربوية جديدة تتناول تعديل سلوك الطفل الفردي",
                mainTopic: "تربية وتوجيه السلوك",
                subTopics: ["تعديل سلوك", "أمان نفسي", "تواصل عاطفي"],
                riskLevel: "low",
                ageMentioned: null,
                emotionalTone: "seeking_help"
            };
            return { text: JSON.stringify(fallbackClassification), offline: true };
        }
        
        // 6. Check if there's a matched item in our curated dataset
        const match = findOfflineMatch(userPrompt);
        if (match) {
            console.log(`[Server] Found exact offline curated match: "${match.title || match.question}"`);
            return { text: JSON.stringify(match), offline: true };
        }
        
        // 7. Fallback compliant Qawl Fallback schema object
        console.log("[Server] No match in offline dataset. Generating default QawlFasl fallback object.");
        const fallbackObj = {
            question: userPrompt || "سؤال تربوي",
            mainCategory: "عام",
            categorySlug: "general",
            ageGroups: ["الكل"],
            riskLevel: "متوسط",
            keywords: ["تربية", "سلوك"],
            quickSummary: `التوجيه النفسي لموقف: "${userPrompt}" يتطلب الاحتواء والموازنة بين الحزم والرحمة.`,
            quickAnswer: {
                sayThis: `نحن معاً في هذا، دعنا نتحدث بهدوء ونقترح حلاً مريحاً لك ولنا.`,
                dontSayThis: `أنت دائماً تفعل كذا وكذا! لن أصدقك بعد اليوم.`,
                doThisNow: `تنفس بعمق، وانزل لمستوى طول طفلك للحفاظ على تواصل بصري مريح.`
            },
            commonMistake: `سرعة الغضب والانفعال اللفظي والجسدي يعطي نتائج عكسية تضر بالأمان النفسي.`,
            educationalView: `السلوك السلبي هو صرخة لطلب المساعدة أو وسيلة للتعبير عن احتياج عاطفي كامن.`,
            suggestedAnswer: `للتعامل بنجاح يجب إيجاد مسببات السلوك أولاً، وتصميم روتين يدعم الإيجابية وتكرار المدح للسلوك الصالح.`,
            byAgeVersions: [
                { age: "2-5", text: "قدم خيارات هادئة وبدائل ملموسة وشتت الانتباه عن السلوك السلبي." },
                { age: "6-11", text: "اشرح الأسباب والنتائج بوضوح وحوار هادئ وبسيط." },
                { age: "12-18", text: "ركز على الحوار الندّي، واحترام استقلاليتهم مع التوجيه غير المباشر." }
            ],
            practicalSteps: [
                "فهم الدافع الحقيقي خلف هذا التصرف (الحاجة للاهتمام أو الأمان).",
                "المحافظة على هدوء الأعصاب التام قبل الرد في لحظة الغضب.",
                "تقديم البدائل المشروعة وتوجيه السلوك بدلاً من المنع المطلق.",
                "قضاء وقت نوعي يومي لتعزيز العلاقة وبناء جدار الثقة التربوية."
            ],
            exercises: [
                "تمرين الحوار اليومي الإيجابي لمدة 10 دقائق.",
                "متابعة السلوك وتدوين مسببات الغضب في مفكرة عائلية."
            ],
            whenToWorry: "إذا استمر السلوك أو زاد عدوانية لعدة أسابيع مع تأثر علاقاته الاجتماعية ودراسته.",
            religiousReference: "قال نبينا الكريم محمد ﷺ: 'إن الرفق لا يكون في شيء إلا زانه، ولا ينزع من شيء إلا شأنه'.",
            scientificStat: "تشير دراسات علم نفس النمو إلى أن 85% من سلوكيات الأطفال السلبية تعدل من خلال القدوة والهدوء العائلي.",
            resources: [
                { type: "كتاب", title: "التربية الذكية للأطفال", description: "دليلك العملي لتربية إيجابية متوازنة.", url: "#" }
            ],
            closingThought: "الصبر والاحتواء هما عماد العملية التربوية، والنبتة الطيبة تحتاج وقتاً لتروى بالحب حتى تؤتي ثمارها.",
            sourceStatus: "complete"
        };
        return { text: JSON.stringify(fallbackObj), offline: true };
    } else {
        // Plain text fallback
        const match = findOfflineMatch(userPrompt);
        let responseText = "";
        if (match) {
            responseText = formatOfflineResponse(match, isEnglish);
        } else {
            responseText = generateSmartGenerativeResponse(userPrompt, isEnglish);
        }
        return { text: responseText, offline: true };
    }
}

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.set('trust proxy', 1);
    
    // إعدادات CORS للسماح للواجهة الأمامية بالاتصال بالخادم
    app.use(cors({
        origin: '*', // يمكنك تحديد الدومين الخاص بك هنا بدل * لزيادة الأمان مثل ['https://yourfrontend.com']
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(express.json());

    // Logging Middleware (تسجيل دقيق للطلبات)
    app.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
            console.log(`[${new Date().toISOString()}] [Server] API Request: ${req.method} ${req.url}`);
            console.log(`[Server] Headers: origin=${req.headers.origin}, referer=${req.headers.referer}`);
        }
        next();
    });

    // Health Endpoint
    app.get("/api/health", (req, res) => {
        let rawGemini = process.env.GEMINI_API_KEY;
        
        res.json({
            status: "ok",
            env: process.env.NODE_ENV || 'development',
            geminiKeyExists: !!rawGemini,
            rawGeminiValue: rawGemini,
            googleApiKeyExists: !!process.env.GOOGLE_API_KEY,
            googleApiKeyValue: process.env.GOOGLE_API_KEY ? 'exists' : 'missing'
        });
    });

    // AI Rate Limiter (Increased substantially to prevent blocking)
    const aiRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 2000, // Increased from 50 to 2000
        message: { error: "Too many requests, please try again later." }
    });

    // AI Proxy Route
    app.post("/api/ai/audio", async (req, res) => {
        const { text, voiceName } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Missing text for audio generation" });
        }

        const genAI = getGenAI();
        if (!genAI) {
            console.log("[Server] Gemini Client not available for audio. Returning empty audio placeholder.");
            return res.json({ 
                audioData: "", 
                offline: true,
                message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب تعليق المفتاح الذكي." 
            });
        }

        try {
            console.log(`[Server] Generating TTS for text: "${text.substring(0, 50)}..."`);
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await generateWithRetry(async () => {
                return await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text }] }],
                    generationConfig: {
                      // @ts-ignore
                      responseModalities: ["AUDIO"],
                      speechConfig: {
                          voiceConfig: {
                            prebuiltVoiceConfig: { 
                              voiceName: (voiceName && ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'].includes(voiceName)) ? voiceName : 'Aoede' 
                            },
                          },
                      },
                    } as any,
                  });
            }, "Gemini TTS");

            const audioData = (result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/')) as any)?.inlineData?.data;
            
            if (!audioData) {
              throw new Error("No audio data returned from Gemini TTS");
            }

            res.json({ audioData });
        } catch (error: any) {
            console.error("[Server] TTS Error:", error);
            const errStr = (error.message || "").toLowerCase();
            if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401")) {
              return res.status(500).json({ error: "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات.", code: "GEMINI_API_KEY_NOT_CONFIGURED" });
            }
            res.status(500).json({ error: "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." });
        }
    });

    app.post("/api/ai/generate", aiRateLimit, async (req, res) => {
        const { model: modelName, contents, config } = req.body;
        
        if (!contents) {
            return res.status(400).json({ error: "Missing contents" });
        }

        // Cache check
        const cacheKey = hashString(JSON.stringify({ modelName, contents, config }));
        if (smartCache.has(cacheKey)) {
            const cached = smartCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log("[Server] Serving from cache");
                return res.json(cached.response);
            }
        }

        const genAI = getGenAI();
        if (!genAI) {
            console.log("[Server] Gemini Client not available (missing or suspended key). Serving smart offline fallback response.");
            const fallbackResult = handleServerSideAIFallback(contents, config, new Error("Gemini Key is suspended or missing."));
            return res.json(fallbackResult);
        }

        try {
            // Model Aliasing - Use stable models but allow newer versions
            let finalModel = modelName || "gemini-2.5-flash";
            // If it's a generic "gemini" or a non-standard name, fallback to stable.
            if (finalModel === "gemini" || finalModel.includes("2.5") || finalModel.includes("3.1") || finalModel.includes("3-flash") || finalModel.includes("preview")) {
                finalModel = "gemini-2.5-flash";
            }

            const attemptGeneration = async (selectedModel: string) => {
                const generationConfig: any = {};
                if (config) {
                    if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
                    if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
                    if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
                }

                const model = genAI.getGenerativeModel({ 
                    model: selectedModel,
                    generationConfig,
                    systemInstruction: config?.systemInstruction
                });

                console.log(`[Server] Generating with model: ${selectedModel}, content length: ${JSON.stringify(contents).length}`);

                return await model.generateContent({ contents });
            };

            let result;
            try {
                result = await generateWithRetry(() => attemptGeneration(finalModel), `Gemini AI (${finalModel})`);
            } catch (firstError: any) {
                const firstErrStr = (firstError.message || "").toLowerCase();
                const isSuspended = firstErrStr.includes("403") || firstErrStr.includes("suspended") || firstErrStr.includes("permission");
                const isExpired = firstErrStr.includes("expired") || firstErrStr.includes("api_key_invalid");
                const isBusy = isGeminiBusyError(firstError);
                
                console.warn(`[Server] First AI attempt failed with ${finalModel}:`, firstError.message);
                
                if (isExpired || isSuspended) {
                    console.log("[Server] Gemini key is suspended or expired. Activating smart offline fallback.");
                    const fallbackResult = handleServerSideAIFallback(contents, config, firstError);
                    return res.json(fallbackResult);
                } else if (isBusy) {
                    return res.status(429).json({
                        error: "AI_HIGH_DEMAND",
                        message: "خدمة الذكاء الاصطناعي عليها ضغط حالياً. حاول مرة أخرى بعد قليل.",
                        details: firstError.message
                    });
                } else {
                    const fallbackModel = "gemini-2.5-flash";
                    console.log(`[Server] Retrying with fallback model: ${fallbackModel}`);
                    try {
                        result = await generateWithRetry(() => attemptGeneration(fallbackModel), `Gemini AI Fallback (${fallbackModel})`);
                    } catch (secondError: any) {
                        console.error(`[Server] Fallback AI also failed. Activating smart offline fallback:`, secondError.message);
                        const fallbackResult = handleServerSideAIFallback(contents, config, secondError);
                        return res.json(fallbackResult);
                    }
                }
            }

            if (!result.response) {
                throw new Error("No response from Gemini");
            }

            let responseText = "";
            try {
                responseText = result.response.text();
            } catch (e: any) {
                console.warn("[Server] Could not get text from response (likely safety filter):", e);
                // Try to get text from the first candidate if possible
                if (result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
                    responseText = result.response.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("AI response was blocked or empty. Please try a different prompt.");
                }
            }
            console.log(`[Server] AI Response length: ${responseText.length}`);
            
            const aiResponse = { text: responseText };
            smartCache.set(cacheKey, { timestamp: Date.now(), response: aiResponse });
            
            res.json(aiResponse);
        } catch (error: any) {
            console.error("[Server] AI Error:", error);
            const errStr = (error.message || "").toLowerCase();
            if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401")) {
                if (process.env.NODE_ENV !== "production") {
                    const wantsJson = config?.responseMimeType === "application/json";
                    const isArray = config?.responseSchema?.type === 'ARRAY';
                    const mockResponse = wantsJson ? (isArray ? "[]" : "{}") : "وضع التجربة المحلي يعمل، لكن مفتاح Gemini غير مفعّل على الخادم.";
                    return res.json({ text: mockResponse });
                } else {
                    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
                }
            }
            if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) {
              return res.status(500).json({ error: "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." });
            }
            res.status(500).json({ error: "يبدو أن معالجة هذه الفكرة تتطلب وقتاً أطول.. جرب صياغة أبسط أو العودة لاحقاً." });
        }
    });

    // Vite Integration
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // In production, esbuild output is dist/server.js
        // The frontend builds into dist/
        // Since server.js is inside dist/, __dirname will be /app/applet/dist/
        const distPath = path.resolve(__dirname);
        console.log(`[Server] Production mode: Serving static files from ${distPath}`);
        
        app.use(express.static(distPath, {
          index: false // We handle index.html manually below
        }));
        
        app.get('*', (req, res) => {
            const indexPath = path.join(distPath, 'index.html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error(`[Server] Error sending index.html from ${indexPath}:`, err);
                    res.status(500).send("Index file not found. Please run build.");
                }
            });
        });
    }

    app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error("[Server] Critical Startup Error:", err);
});
