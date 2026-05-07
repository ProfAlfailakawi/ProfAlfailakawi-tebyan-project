const fs = require('fs');
let content = fs.readFileSync('src/services/gemini.ts', 'utf8');

const warning = 'تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة. ';

// Replace specific parts to inject the warning.
// Note: We might be replacing it multiple times if we're not careful, so let's do this:
// Remove any existing occurrences if we already ran it (just in case), but we haven't yet on this logic.

content = content.replace(/امرأة حنونة ومستشارة حكيمة"\./g, `امرأة حنونة ومستشارة حكيمة". ${warning}`);
content = content.replace(/امرأة حنونة ومستشارة"\./g, `امرأة حنونة ومستشارة". ${warning}`);
content = content.replace(/امرأة حنونة وراوية"\./g, `امرأة حنونة وراوية". ${warning}`);

fs.writeFileSync('src/services/gemini.ts', content);
