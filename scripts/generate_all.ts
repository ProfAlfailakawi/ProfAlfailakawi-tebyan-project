import { GoogleGenAI, Type, Schema } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const qawlFaslSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quickSummary: {
      type: Type.STRING,
      description: "Quick summary of the answer (1-2 sentences)",
    },
    quickAnswer: {
      type: Type.OBJECT,
      properties: {
        sayThis: { type: Type.STRING, description: "What to say to the child (1–2 lines)" },
        dontSayThis: { type: Type.STRING, description: "What NOT to say (1 line)" },
        doThisNow: { type: Type.STRING, description: "What to do immediately (1–2 steps)" },
      },
      required: ["sayThis", "dontSayThis", "doThisNow"],
    },
    commonMistake: { type: Type.STRING, description: "A common mistake parents make in this situation" },
    educationalView: { type: Type.STRING, description: "Short paragraph combining psychology, parenting principles, and emotional intelligence" },
    suggestedAnswer: { type: Type.STRING, description: "Provide actual sentences a parent can say to the child" },
    byAgeVersions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          age: { type: Type.STRING, description: "e.g., 4-6 years, 7-9 years, 10-12 years, 13-15 years, 16-18 years" },
          text: { type: Type.STRING, description: "The answer tailored for this specific age group" },
        },
        required: ["age", "text"],
      },
    },
    practicalSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Provide 5 clear actionable steps",
    },
    exercises: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 simple activities: role-play or conversation, behavioral or emotional exercise",
    },
    whenToWorry: { type: Type.STRING, description: "Clear signs that require attention or professional help" },
    religiousReference: { type: Type.STRING, description: "ONLY include: Quran verse OR Sahih Hadith (Bukhari/Muslim only) OR Official fatwa. DO NOT invent or paraphrase incorrectly." },
    scientificStat: { type: Type.STRING, description: "Provide ONE general accepted psychological insight OR widely cited concept. NO fake statistics." },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Must be 'video', 'book', 'site', or 'study'" },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["type", "title", "description"],
      },
      description: "ONLY suggest: well-known parenting books, credible institutions, educational YouTube channels",
    },
    closingThought: { type: Type.STRING, description: "Short emotional closing sentence" },
  },
  required: [
    "quickSummary", "quickAnswer", "commonMistake", "educationalView",
    "suggestedAnswer", "byAgeVersions", "practicalSteps", "exercises",
    "whenToWorry", "religiousReference", "scientificStat", "resources", "closingThought"
  ],
};

const SYSTEM_INSTRUCTION = `
You are a VERIFIED CONTENT GENERATION SYSTEM for a parenting platform called "قول فصل".

🎯 CORE RULE:
DO NOT fabricate information.
ONLY use:
- trusted educational psychology knowledge
- verified Islamic sources (Quran, Sahih Hadith, or official fatwa bodies)
- general widely accepted parenting practices
If unsure → say: "Requires expert review"

TONE:
- calm, supportive, non-judgmental, practical, culturally aware (Arab/Islamic context).
Language: Arabic.
The generated content must feel like: "a trusted parenting expert speaking calmly to a stressed parent".
`;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in environment");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-2.5-flash";

  const indexFile = path.join(process.cwd(), 'questions_index.json');
  const questions = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));

  const resultsFile = path.join(process.cwd(), 'qawl_fasl_full_v1.json');
  let results: any[] = [];
  if (fs.existsSync(resultsFile)) {
    results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  }

  console.log(`Starting generation for ${questions.length} questions...`);
  console.log(`Already generated: ${results.length}`);

  for (let i = results.length; i < questions.length; i++) {
    const q = questions[i];
    console.log(`[${i + 1}/${questions.length}] Generating: ${q}`);

    try {
      const prompt = `Question from a parent: "${q}"\n\nPlease generate a structured answer following the strict guidelines and schema.`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: qawlFaslSchema,
          temperature: 0.2,
        }
      });

      const text = response.text;
      if (!text) throw new Error("No text returned");
      const data = JSON.parse(text);

      results.push({
        id: `q-${i + 1}`,
        title: q,
        categoryId: 'general',
        ageGroups: ['0-3', '4-6', '7-9', '10-12', '13-15', '16-18'],
        sensitivity: 'medium',
        tags: ['تربية', 'أسئلة'],
        status: 'published',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...data
      });

      // Save every iteration to prevent loss
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      console.log(`✅ Success`);
    } catch (err: any) {
      console.error(`❌ Error on question ${i + 1}:`, err.message);
      // Wait a bit and retry
      await new Promise(r => setTimeout(r, 5000));
    }
    
    // Throttle slightly
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Done! Generated ${results.length} questions.`);
}

main();
