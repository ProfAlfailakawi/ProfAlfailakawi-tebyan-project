// توليد صفحات «قول فصل» الثابتة — لكل سؤال صفحة HTML كاملة قابلة للفهرسة والمشاركة.
// تُكتب في public/qawl/ فتُنشر مع الاستضافة وتُخدم قبل صفحة التطبيق (الملف الثابت يسبق الـ rewrite).
// التشغيل: node scripts/generate-qawl-pages.mjs   (يعمل تلقائياً ضمن npm run build)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const SITE = "https://tebyan.dr-alfailakawi.com";
const OUT = path.join(root, "public", "qawl");

const questions = JSON.parse(
  fs.readFileSync(path.join(root, "qawl_fasl_full_v1.json"), "utf8"),
).filter((q) => q.status === "published");

const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const head = (title, description, url) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<meta property="og:site_name" content="قول فصل — تبيان">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-tabyan-v2.jpg">
<meta name="twitter:card" content="summary_large_image">
<!-- Same self-hosted faces the app shell uses, so a reader arriving straight on a qawl
     page gets type from our origin and, once installed, offline. -->
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  :root{--paper:#FBF8F1;--surface:#fff;--ink:#29241C;--muted:#7C7361;--line:#E9E1CF;
  --accent:#8A6B2B;--accent-soft:#F4EDDD;--lilac:#8E7AAE;
  --say:#3E7C5B;--say-bg:#E9F2EC;--dont:#A8433B;--dont-bg:#F8EAE7;--now:#4A6C8C;--now-bg:#E9EFF5;--quote:#F6F1E4}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:"Alexandria","Segoe UI",Tahoma,sans-serif;font-weight:300;line-height:1.95}
  h1,h2,h3{font-family:"Amiri",serif;font-weight:700;line-height:1.55;margin:0;text-wrap:balance}
  a{color:var(--accent);text-decoration:none}
  .top{position:sticky;top:0;background:rgba(251,248,241,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);z-index:9}
  .top-in{max-width:860px;margin:0 auto;padding:13px 22px;display:flex;align-items:baseline;gap:10px}
  .top-in b{font-family:"Amiri",serif;font-size:1.35rem;color:var(--ink)}
  .top-in small{font-size:.72rem;color:var(--muted)}
  .top-in .app{margin-inline-start:auto;font-size:.78rem;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:5px 14px}
  .wrap{max-width:760px;margin:0 auto;padding:34px 22px 90px}
  .crumb{font-size:.8rem;color:var(--muted);margin-bottom:20px}
  h1{font-size:clamp(1.5rem,4.5vw,2.15rem);margin-bottom:12px}
  .meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:26px}
  .chip{font-size:.72rem;font-weight:500;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:2px 12px;color:var(--muted)}
  .chip.ok{color:var(--say);background:var(--say-bg);border-color:transparent;font-weight:600}
  .summary{background:var(--quote);border-inline-start:3px solid var(--accent);border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:1.02rem}
  .triad{display:grid;gap:12px;margin-bottom:34px}
  @media(min-width:640px){.triad{grid-template-columns:1fr 1fr 1fr}}
  .t{border-radius:13px;padding:16px 18px;font-size:.92rem}
  .t b{font-family:"Amiri",serif;font-size:1.12rem;display:block;margin-bottom:5px}
  .t.say{background:var(--say-bg)}.t.say b{color:var(--say)}
  .t.dont{background:var(--dont-bg)}.t.dont b{color:var(--dont)}
  .t.now{background:var(--now-bg)}.t.now b{color:var(--now)}
  section{margin-bottom:32px}
  h2{font-size:1.28rem;margin-bottom:10px;display:flex;align-items:center;gap:12px}
  h2::after{content:"";flex:1;height:1px;background:var(--line)}
  ol,ul{margin:0;padding-inline-start:22px}
  li{margin-bottom:8px}
  li::marker{color:var(--accent);font-weight:700}
  .box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:15px 19px;font-size:.95rem}
  .box.warn{background:var(--dont-bg);border-color:transparent}
  .box.calm{background:var(--now-bg);border-color:transparent}
  .age{margin-bottom:12px}
  .age b{font-family:"Amiri",serif;color:var(--accent);display:block;margin-bottom:3px}
  .quran{text-align:center;background:var(--quote);border-radius:13px;padding:22px 24px;margin-bottom:32px;font-family:"Amiri",serif;font-size:1.2rem}
  .res{display:grid;gap:10px}
  @media(min-width:640px){.res{grid-template-columns:1fr 1fr}}
  .closing{text-align:center;font-family:"Amiri",serif;font-size:1.2rem;color:var(--accent);max-width:46ch;margin:44px auto 0}
  .closing::before{content:"❦";display:block;font-size:.95rem;margin-bottom:10px}
  .cta{margin-top:44px;text-align:center}
  .cta a{display:inline-block;background:var(--lilac);color:#FBF9FF;font-weight:500;border-radius:12px;padding:12px 30px;font-size:.95rem}
  .cta p{font-size:.8rem;color:var(--muted);margin:10px 0 0}
  footer{border-top:1px solid var(--line);padding:22px;text-align:center;font-size:.78rem;color:var(--muted)}
  .grid{display:grid;gap:12px;margin-top:26px}
  @media(min-width:640px){.grid{grid-template-columns:1fr 1fr}}
  .qcard{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:18px 20px;display:block;color:var(--ink)}
  .qcard:hover{border-color:var(--accent)}
  .qcard h3{font-size:1.08rem;margin-bottom:4px}
  .qcard p{margin:0;font-size:.83rem;color:var(--muted)}
</style>
</head>
<body>
<div class="top"><div class="top-in">
  <b>قَوْل فَصْل</b><small>مرجع الوالدين الموثوق</small>
  <a class="app" href="/">افتح تبيان ←</a>
</div></div>`;

const footer = `<footer>قول فصل — مكتبة الأجوبة التربوية الموثوقة · جزء من منظومة <a href="/">تبيان</a></footer></body></html>`;

const questionPage = (q) => {
  const url = `${SITE}/qawl/${q.id}`;
  const desc = q.quickSummary || "";
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: q.title,
        acceptedAnswer: { "@type": "Answer", text: q.suggestedAnswer || q.quickSummary || "" },
      },
    ],
  };
  let body = `<div class="wrap">
<nav class="crumb"><a href="/qawl/">المكتبة</a> ‹ سؤال</nav>
<article>
<h1>${esc(q.title)}</h1>
<div class="meta">
  <span class="chip ok">✓ جواب مُراجَع ومعتمد</span>
  ${(q.ageGroups || []).length ? `<span class="chip">الأعمار: ${esc(String(q.ageGroups[0]).split("-")[0])}–${esc(String(q.ageGroups[q.ageGroups.length - 1]).split("-").pop())} سنة</span>` : ""}
</div>
${desc ? `<p class="summary">${esc(desc)}</p>` : ""}`;

  if (q.quickAnswer) {
    body += `<div class="triad">
  ${q.quickAnswer.sayThis ? `<div class="t say"><b>قُل هذا</b>${esc(q.quickAnswer.sayThis)}</div>` : ""}
  ${q.quickAnswer.dontSayThis ? `<div class="t dont"><b>لا تَقُل</b>${esc(q.quickAnswer.dontSayThis)}</div>` : ""}
  ${q.quickAnswer.doThisNow ? `<div class="t now"><b>افعل الآن</b>${esc(q.quickAnswer.doThisNow)}</div>` : ""}
</div>`;
  }
  if (q.commonMistake)
    body += `<section><h2>الخطأ الشائع</h2><div class="box warn"><b style="color:var(--dont)">احذر:</b> ${esc(q.commonMistake)}</div></section>`;
  if (q.educationalView)
    body += `<section><h2>الرؤية التربوية</h2><p>${esc(q.educationalView)}</p>${q.scientificStat ? `<p class="chip" style="display:inline-block">📊 ${esc(q.scientificStat)}</p>` : ""}</section>`;
  if (q.suggestedAnswer)
    body += `<section><h2>الجواب المقترح</h2><p>${esc(q.suggestedAnswer)}</p></section>`;
  if (Array.isArray(q.byAgeVersions) && q.byAgeVersions.length)
    body += `<section><h2>بحسب عمر طفلك</h2>${q.byAgeVersions.map((v) => `<div class="age"><b>${esc(v.age)}</b>${esc(v.text)}</div>`).join("")}</section>`;
  if (Array.isArray(q.practicalSteps) && q.practicalSteps.length)
    body += `<section><h2>خطوات عملية</h2><ol>${q.practicalSteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></section>`;
  if (Array.isArray(q.exercises) && q.exercises.length)
    body += `<section><h2>تمارين مع طفلك</h2><ul>${q.exercises.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>`;
  if (q.religiousReference) body += `<div class="quran">${esc(q.religiousReference)}</div>`;
  if (q.whenToWorry)
    body += `<section><h2>متى تقلق؟</h2><div class="box calm"><b style="color:var(--now)">راجع مختصاً</b> ${esc(q.whenToWorry)}</div></section>`;
  if (Array.isArray(q.resources) && q.resources.length)
    body += `<section><h2>للاستزادة</h2><div class="res">${q.resources.map((r) => `<div class="box"><b>${esc(r.title)}</b><br><span style="font-size:.85rem;color:var(--muted)">${esc(r.description || "")}</span></div>`).join("")}</div></section>`;
  if (q.closingThought) body += `<p class="closing">${esc(q.closingThought)}</p>`;

  body += `<div class="cta">
  <a href="/?tab=qawlfasl&q=${encodeURIComponent(q.id)}">تحتاج تحليلاً أعمق لحالتك؟ أكمل في تبيان</a>
  <p>غرفة القرار، المحاكاة، وأدوات الفهم — كلها بانتظارك</p>
</div>
</article></div>`;

  return (
    head(`${q.title} | قول فصل`, desc, url) +
    `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>` +
    body +
    footer
  );
};

const indexPage = () => {
  const url = `${SITE}/qawl/`;
  let body = `<div class="wrap">
<h1 style="text-align:center">حين يسألك طفلك السؤال الصعب</h1>
<p style="text-align:center;color:var(--muted);max-width:52ch;margin:10px auto 0">
${questions.length} سؤالاً محسوماً بمراجعة تربوية وشرعية — لكل سؤال جوابه الكامل: ماذا تقول، وماذا لا تقول، وماذا تفعل الآن.</p>
<div class="grid">
${questions.map((q) => `<a class="qcard" href="/qawl/${q.id}"><h3>${esc(q.title)}</h3><p>${esc((q.quickSummary || "").slice(0, 120))}…</p></a>`).join("\n")}
</div></div>`;
  return (
    head("قول فصل — مرجع الوالدين الموثوق", `${questions.length} جواباً محسوماً ومراجعاً لأصعب أسئلة الأطفال ومواقف التربية.`, url) +
    body +
    footer
  );
};

// ── write ──
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), indexPage());
for (const q of questions) {
  const dir = path.join(OUT, q.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), questionPage(q));
}

// ── sitemap ──
const smPath = path.join(root, "public", "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8");
sm = sm.replace(/\s*<url><loc>[^<]*\/qawl[^<]*<\/loc><\/url>/g, "");
const entries = [`  <url><loc>${SITE}/qawl/</loc></url>`, ...questions.map((q) => `  <url><loc>${SITE}/qawl/${q.id}</loc></url>`)].join("\n");
sm = sm.replace("</urlset>", `${entries}\n</urlset>`);
fs.writeFileSync(smPath, sm);

console.log(`[qawl-pages] generated ${questions.length} question pages + index into public/qawl/, sitemap updated.`);
