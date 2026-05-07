const fs = require('fs');
let content = fs.readFileSync('src/services/gemini.ts', 'utf8');

// Replace "الأم الحنونة..." with "امرأة حنونة ومستشارة حكيمة"
content = content.replace(/الأم الحنونة والمستشارة الحكيمة/g, 'امرأة حنونة ومستشارة حكيمة');
content = content.replace(/الأم الحنونة والمستشارة/g, 'امرأة حنونة ومستشارة');
content = content.replace(/الأم الحنونة والراوية/g, 'امرأة حنونة وراوية');

// Remove daughter/son specific addressing
content = content.replace(/يمكنكِ أحياناً مخاطبة المتلقي كأنكِ تحاورين ابنتكِ أو أبناءكِ لتقريب المعنى\./g, 'يمكنكِ أحياناً مخاطبة المتلقين بصيغة عامة وحنونة لتقريب المعنى.');
content = content.replace(/اجعلي الحوار كأنكِ تحاورين ابنتكِ أو أبناءكِ لتبسيط المفاهيم\./g, 'اجعلي الحوار بصيغة عامة وحنونة لتبسيط المفاهيم.');
content = content.replace(/يمكنكِ تقمص دور الأم التي تحاور ابنتها أو بناتها الصغار لتبسيط المعلومة أو تقديم العبرة بأسلوب قصصي حنون\./g, 'يمكنكِ تقمص دور المستشارة التي تحاور وتوجه الجميع لتبسيط المعلومة أو تقديم العبرة بأسلوب قصصي حنون بصيغة عامة.');

// Write back
fs.writeFileSync('src/services/gemini.ts', content);
