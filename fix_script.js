import fs from 'fs';

try {
    const filePath = './server.ts';
    console.log('[Fix] Reading server.ts...');
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // First fix: Repair the unclosed template string in generateSmartGenerativeResponse
    const startIndex = content.indexOf('[معاينة تبيان - تفعيل وضع الطوارئ والاتصال الذكي المحاكي للذكاء الاصطناعي]');
    const endString = 'let userPrompt = "";';
    const endIndex = content.indexOf(endString);
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        console.log('[Fix] First fix indices found. Replacing template string segment...');
        const partBefore = content.substring(0, startIndex);
        const partAfter = content.substring(endIndex);
        
        const replacement = `[معاينة تبيان - تفعيل وضع الطوارئ والاتصال الذكي المحاكي للذكاء الاصطناعي]
ملاحظة: مفتاح الذكاء الاصطناعي الافتراضي معلّق حالياً (CONSUMER_SUSPENDED). يرجى تعبئة أو تجديد مفتاح GEMINI_API_KEY في إعدادات المنصة.

في هذه الأثناء، طبق تبيان قواعد التربية وعلم نفس الطفل لتقديم هذه الاستجابة المنهجية لطلبك:

### 🌟 التحليل الأولي للموقف
تحليل الموقف لطلبك: "\${query}". يتضح أن السلوك الحالي يتطلب تفهماً للمرحلة السلوكية والعمرية التي يمر بها الطفل، مع فك شفرة الرسائل النفسية الكامنة وراء التصرف.

### 🗣️ حوار مقترح مع الطفل (قل هذا):
- **الاحتواء أولاً**: "يا حبيبي أنا أفهم تماماً أنك تشعر بالضيق/الغضب الآن..."
- **تحديد التوقعات بحب**: "أنا هنا معك، ولكن يمنع الإيذاء/السلوك غير المقبول..."
- **تخيير الطفل**: "هل تحب أن نفعل هذا الخيار الأول أم الخيار الثاني معاً؟"

### 🛠️ خطة عمل فورية للتعامل:
1. **الهدوء الواعي وملاحظة الذات**: قبل التدخل، تنفس بعمق وحافظ على نبرة صوت هادئة ومنخفضة لعكس الأمان للطفل.
2. **أشرك طفلك في الحل**: اسأله في وقت لاحق يكون فيه هادئاً: "كيف يمكننا تجنب تكرار ذلك في المرة القادمة؟"
3. **تعزيز السلوك البديل**: امدح طفلك على الفور عندما يتصرف بمسؤولية أو يعبّر عن مشاعره بكلمات هادئة.

### 📘 منظور تبيان النفسي:
ما يراه الآباء سلوكاً عنيداً أو سيئاً هو في الغالب محاولة من الطفل للتعبير عن استقلاليته أو تلبية حاجة غير واعية للأمان أو الاهتمام. الأمان النفسي هو حجر الزاوية لكل نمو تربوي سليم.\`;
    }
}

function handleServerSideAIFallback(contents: any, config: any, error: any) {
    `;
        content = partBefore + replacement + partAfter;
        console.log('[Fix] First fix applied to memory content string.');
    } else {
        console.log('[Fix] First fix indices not found or already applied.');
    }

    // Second fix: Clean duplicate duplicate garbage block before startServer()
    const startServerIndex = content.indexOf('async function startServer()');
    const fallbackTextIndex = content.indexOf('// Plain text fallback');
    
    if (fallbackTextIndex !== -1 && startServerIndex !== -1 && fallbackTextIndex < startServerIndex) {
        console.log('[Fix] Second fix indices found. Scanning for garbage segment...');
        const postFallbackSegment = content.substring(fallbackTextIndex, startServerIndex);
        
        const matchStr = 'return { text: responseText, offline: true };';
        const pIndex = postFallbackSegment.indexOf(matchStr);
        if (pIndex !== -1) {
            const firstCloseBrace = postFallbackSegment.indexOf('}', pIndex + matchStr.length);
            const secondCloseBrace = postFallbackSegment.indexOf('}', firstCloseBrace + 1);
            
            if (firstCloseBrace !== -1 && secondCloseBrace !== -1) {
                const correctEnd = fallbackTextIndex + secondCloseBrace + 1;
                console.log('[Fix] Found end of first function. Slicing trailing garbage...');
                const partBefore = content.substring(0, correctEnd);
                const partAfter = content.substring(startServerIndex);
                
                content = partBefore + '\n\n' + partAfter;
                console.log('[Fix] Second fix applied to memory content string.');
            }
        }
    } else {
        console.log('[Fix] Second fix indices not found or already clean.');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[Fix] server.ts file updated successfully on disk!');
} catch (err) {
    console.error('[Fix] Error during fixing processes:', err);
}
