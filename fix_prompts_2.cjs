const fs = require('fs');
let content = fs.readFileSync('src/services/gemini.ts', 'utf8');

const warning = 'تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة. ';

content = content.replace(/امرأة حنونة ومستشارة حكيمة" المبتكرة\./g, `امرأة حنونة ومستشارة حكيمة" المبتكرة. ${warning}`);

fs.writeFileSync('src/services/gemini.ts', content);
